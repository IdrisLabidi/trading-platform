package tn.utm.nainternship.marketservice.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tn.utm.nainternship.marketservice.entity.OrderEntity;
import tn.utm.nainternship.marketservice.entity.TradeEntity;
import tn.utm.nainternship.marketservice.repository.OrderRepository;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class OrderBookService {

    private final OrderRepository orderRepository;

    // ── Book structures ─────────────────────────────────────────────────────────
    // bids: highest price first (reverse order) → best buyer at top
    private final ConcurrentHashMap<String, NavigableMap<BigDecimal, Deque<OrderEntity>>> bidBooks
            = new ConcurrentHashMap<>();

    // asks: lowest price first (natural order) → best seller at top
    private final ConcurrentHashMap<String, NavigableMap<BigDecimal, Deque<OrderEntity>>> askBooks
            = new ConcurrentHashMap<>();

    // one lock object per symbol to allow concurrent matching on different symbols
    private final ConcurrentHashMap<String, Object> symbolLocks = new ConcurrentHashMap<>();

    // ── Startup: rebuild the book from DB ───────────────────────────────────────

    /**
     * On startup, reload every PENDING or PARTIAL order from the database and
     * re-insert it into the in-memory book, preserving FIFO order (createdAt ASC).
     *
     * This guarantees that a server restart or crash does not lose open orders.
     */
    @PostConstruct
    public void rebuildFromDatabase() {
        log.info("=== OrderBookService: rebuilding order book from database ===");

        List<OrderEntity> openOrders = orderRepository
                .findByStatusInOrderByCreatedAtAsc(
                        List.of(OrderEntity.Status.PENDING, OrderEntity.Status.PARTIAL)
                );

        if (openOrders.isEmpty()) {
            log.info("Order book rebuilt: no open orders found in database.");
            return;
        }

        for (OrderEntity order : openOrders) {
            insertIntoBook(order);
        }

        // Print a summary per symbol for visibility during demo / debugging
        logBookSummary();

        log.info("=== Order book rebuilt: {} open order(s) loaded ===", openOrders.size());
    }

    // ── Public API ──────────────────────────────────────────────────────────────

    /**
     * Run the matching engine for an incoming order.
     * Returns the list of trades produced. The incoming order's status and
     * remainingQty are updated in-place — the caller is responsible for
     * persisting the updated order entity.
     */
    public List<TradeEntity> match(OrderEntity incoming) {
        List<TradeEntity> trades = new ArrayList<>();

        synchronized (lockFor(incoming.getSymbol())) {

            NavigableMap<BigDecimal, Deque<OrderEntity>> counterBook = counterBookFor(incoming);
            NavigableMap<BigDecimal, Deque<OrderEntity>> ownBook     = ownBookFor(incoming);

            // ── Matching loop ────────────────────────────────────────────────────
            while (incoming.getRemainingQty() > 0 && !counterBook.isEmpty()) {

                Map.Entry<BigDecimal, Deque<OrderEntity>> bestEntry = counterBook.firstEntry();
                BigDecimal bestPrice = bestEntry.getKey();

                // For LIMIT orders, check that the prices cross
                if (incoming.getType() == OrderEntity.Type.LIMIT && !pricesCross(incoming, bestPrice)) {
                    break; // no more matchable levels
                }

                Deque<OrderEntity> queue = bestEntry.getValue();
                OrderEntity counterOrder = queue.peekFirst();

                if (counterOrder == null) {
                    // Defensive: empty deque should never be in the book, clean up
                    counterBook.pollFirstEntry();
                    continue;
                }

                // Do not match an order with itself (same userId is allowed by business rules,
                // but matching the exact same order entity would be a bug)
                if (counterOrder.getId().equals(incoming.getId())) {
                    break;
                }

                int fillQty = Math.min(incoming.getRemainingQty(), counterOrder.getRemainingQty());

                // Execution price = maker's price (the order already in the book)
                TradeEntity trade = buildTrade(incoming, counterOrder, bestPrice, fillQty);
                trades.add(trade);

                log.info("MATCH  symbol={} qty={} @ {} | buyOrder={} sellOrder={}",
                        incoming.getSymbol(), fillQty, bestPrice,
                        trade.getBuyOrder().getId(), trade.getSellOrder().getId());

                // ── Decrement quantities ─────────────────────────────────────────
                incoming.setRemainingQty(incoming.getRemainingQty() - fillQty);
                counterOrder.setRemainingQty(counterOrder.getRemainingQty() - fillQty);

                // ── Update counter-order status ──────────────────────────────────
                if (counterOrder.getRemainingQty() == 0) {
                    counterOrder.setStatus(OrderEntity.Status.FILLED);
                    queue.pollFirst(); // remove from book
                    if (queue.isEmpty()) counterBook.pollFirstEntry();
                } else {
                    counterOrder.setStatus(OrderEntity.Status.PARTIAL);
                    // stays in book with reduced remainingQty
                }
            }

            // ── After matching: handle remaining quantity of incoming order ───────
            if (incoming.getRemainingQty() > 0) {
                if (incoming.getType() == OrderEntity.Type.LIMIT) {
                    // Partially or fully unmatched LIMIT → rest goes into the book
                    ownBook.computeIfAbsent(incoming.getPrice(), k -> new ArrayDeque<>())
                            .addLast(incoming);
                    log.info("ORDER  symbol={} side={} qty={} remaining={} @ {} added to book",
                            incoming.getSymbol(), incoming.getSide(),
                            incoming.getQuantity(), incoming.getRemainingQty(), incoming.getPrice());
                } else {
                    // MARKET order cannot sit in the book — cancel the unmatched remainder
                    incoming.setStatus(OrderEntity.Status.CANCELLED);
                    log.warn("MARKET order={} unmatched remainder qty={} cancelled",
                            incoming.getId(), incoming.getRemainingQty());
                }
            }
        }

        // ── Set final status on the incoming order ───────────────────────────────
        updateIncomingStatus(incoming);

        return trades;
    }

    /**
     * Remove a PENDING or PARTIAL order from the in-memory book (used by cancelOrder).
     * Does nothing if the order is not found in the book (idempotent).
     */
    public void removeFromBook(OrderEntity order) {
        if (order.getPrice() == null) {
            // MARKET orders are never in the book
            return;
        }

        synchronized (lockFor(order.getSymbol())) {
            NavigableMap<BigDecimal, Deque<OrderEntity>> book = ownBookFor(order);
            Deque<OrderEntity> queue = book.get(order.getPrice());

            if (queue == null) return;

            boolean removed = queue.removeIf(o -> o.getId().equals(order.getId()));
            if (removed) {
                log.info("CANCEL removed order={} from book symbol={} side={} @ {}",
                        order.getId(), order.getSymbol(), order.getSide(), order.getPrice());
            }
            if (queue.isEmpty()) {
                book.remove(order.getPrice());
            }
        }
    }

    /**
     * Returns a read-only snapshot of the current book for a given symbol.
     * Used by GET /api/market/orderbook/{symbol}.
     */
    public OrderBookSnapshot snapshot(String symbol) {
        synchronized (lockFor(symbol)) {
            return OrderBookSnapshot.builder()
                    .symbol(symbol)
                    .bids(toSnapshotLevels(bidsFor(symbol)))
                    .asks(toSnapshotLevels(asksFor(symbol)))
                    .build();
        }
    }

    // ── Private helpers ─────────────────────────────────────────────────────────

    /**
     * Insert an order into the correct side of the book.
     * Called during rebuild and can be reused elsewhere if needed.
     */
    private void insertIntoBook(OrderEntity order) {
        if (order.getPrice() == null) {
            // MARKET orders are never resting in the book — skip
            log.warn("Skipping MARKET order={} during book rebuild (MARKET orders never rest in book)",
                    order.getId());
            return;
        }

        NavigableMap<BigDecimal, Deque<OrderEntity>> book = ownBookFor(order);
        // addLast preserves FIFO because the DB query sorted by createdAt ASC
        book.computeIfAbsent(order.getPrice(), k -> new ArrayDeque<>()).addLast(order);
    }

    /** Decide whether the incoming price crosses the best counter-price. */
    private boolean pricesCross(OrderEntity incoming, BigDecimal bestCounterPrice) {
        if (incoming.getSide() == OrderEntity.Side.BUY) {
            // Buyer's limit price must be >= lowest ask
            return incoming.getPrice().compareTo(bestCounterPrice) >= 0;
        } else {
            // Seller's limit price must be <= highest bid
            return incoming.getPrice().compareTo(bestCounterPrice) <= 0;
        }
    }

    /** Build a TradeEntity from two matched orders. */
    private TradeEntity buildTrade(OrderEntity incoming,
                                   OrderEntity counterOrder,
                                   BigDecimal executionPrice,
                                   int fillQty) {
        OrderEntity buyOrder  = incoming.getSide() == OrderEntity.Side.BUY
                ? incoming : counterOrder;
        OrderEntity sellOrder = incoming.getSide() == OrderEntity.Side.SELL
                ? incoming : counterOrder;

        return TradeEntity.builder()
                .symbol(incoming.getSymbol())
                .price(executionPrice)
                .quantity(fillQty)
                .buyOrder(buyOrder)
                .sellOrder(sellOrder)
                .build();
    }

    /** Set the final status of the incoming order after the matching loop. */
    private void updateIncomingStatus(OrderEntity incoming) {
        if (incoming.getStatus() == OrderEntity.Status.CANCELLED) {
            return; // already set inside the loop for unmatched MARKET
        }
        if (incoming.getRemainingQty() == 0) {
            incoming.setStatus(OrderEntity.Status.FILLED);
        } else if (incoming.getRemainingQty() < incoming.getQuantity()) {
            incoming.setStatus(OrderEntity.Status.PARTIAL);
        } else {
            // remainingQty == quantity: nothing was matched, order is waiting in book
            incoming.setStatus(OrderEntity.Status.PENDING);
        }
    }

    /** Print a per-symbol summary of the book — useful during demo. */
    private void logBookSummary() {
        Set<String> allSymbols = new HashSet<>();
        allSymbols.addAll(bidBooks.keySet());
        allSymbols.addAll(askBooks.keySet());

        for (String symbol : allSymbols) {
            int bidCount = bidBooks.getOrDefault(symbol, new TreeMap<>())
                    .values().stream().mapToInt(Deque::size).sum();
            int askCount = askBooks.getOrDefault(symbol, new TreeMap<>())
                    .values().stream().mapToInt(Deque::size).sum();
            log.info("  [{}] bids={} asks={}", symbol, bidCount, askCount);
        }
    }

    // ── Book accessors ──────────────────────────────────────────────────────────

    private NavigableMap<BigDecimal, Deque<OrderEntity>> bidsFor(String symbol) {
        return bidBooks.computeIfAbsent(symbol,
                k -> new TreeMap<>(Collections.reverseOrder()));
    }

    private NavigableMap<BigDecimal, Deque<OrderEntity>> asksFor(String symbol) {
        return askBooks.computeIfAbsent(symbol, k -> new TreeMap<>());
    }

    private NavigableMap<BigDecimal, Deque<OrderEntity>> ownBookFor(OrderEntity order) {
        return order.getSide() == OrderEntity.Side.BUY
                ? bidsFor(order.getSymbol())
                : asksFor(order.getSymbol());
    }

    private NavigableMap<BigDecimal, Deque<OrderEntity>> counterBookFor(OrderEntity order) {
        return order.getSide() == OrderEntity.Side.BUY
                ? asksFor(order.getSymbol())
                : bidsFor(order.getSymbol());
    }

    private Object lockFor(String symbol) {
        return symbolLocks.computeIfAbsent(symbol, k -> new Object());
    }

    /** Convert a price-level map to a flat list of [price, totalQty] pairs for the snapshot. */
    private List<OrderBookSnapshot.Level> toSnapshotLevels(
            NavigableMap<BigDecimal, Deque<OrderEntity>> book) {

        List<OrderBookSnapshot.Level> levels = new ArrayList<>();
        for (Map.Entry<BigDecimal, Deque<OrderEntity>> entry : book.entrySet()) {
            int totalQty = entry.getValue().stream()
                    .mapToInt(OrderEntity::getRemainingQty)
                    .sum();
            levels.add(new OrderBookSnapshot.Level(entry.getKey(), totalQty));
        }
        return levels;
    }
}
package tn.utm.nainternship.marketservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tn.utm.nainternship.marketservice.entity.OrderEntity;
import tn.utm.nainternship.marketservice.dto.TradeEvent;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderBookService {

    private final Map<String, NavigableMap<BigDecimal, Deque<OrderNode>>> bids = new ConcurrentHashMap<>();
    private final Map<String, NavigableMap<BigDecimal, Deque<OrderNode>>> asks = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Object> locks = new ConcurrentHashMap<>();

    private Object lockFor(String symbol) {
        return locks.computeIfAbsent(symbol, k -> new Object());
    }

    public List<TradeEvent> match(OrderEntity incoming) {
        List<TradeEvent> trades = new ArrayList<>();
        String symbol = incoming.getSymbol();
        synchronized (lockFor(symbol)) {
            NavigableMap<BigDecimal, Deque<OrderNode>> bookBids = bids.computeIfAbsent(symbol, k -> new TreeMap<>(Comparator.reverseOrder()));
            NavigableMap<BigDecimal, Deque<OrderNode>> bookAsks = asks.computeIfAbsent(symbol, k -> new TreeMap<>());

            boolean isBuy = incoming.getSide() == OrderEntity.Side.BUY;

            if (isBuy) {
                // match against asks
                while (incoming.getRemainingQty() > 0 && !bookAsks.isEmpty()) {
                    Map.Entry<BigDecimal, Deque<OrderNode>> bestEntry = bookAsks.firstEntry();
                    BigDecimal bestPrice = bestEntry.getKey();
                    if (incoming.getType() == OrderEntity.Type.LIMIT && incoming.getPrice().compareTo(bestPrice) < 0) break;

                    Deque<OrderNode> queue = bestEntry.getValue();
                    OrderNode counter = queue.peekFirst();
                    if (counter == null) { bookAsks.remove(bestPrice); continue; }

                    int fill = Math.min(incoming.getRemainingQty(), counter.remainingQty);
                    // create trade at counter price
                    TradeEvent t = TradeEvent.builder()
                            .tradeId(UUID.randomUUID().toString())
                            .symbol(symbol)
                            .buyOrderId(incoming.getId())
                            .sellOrderId(counter.orderId)
                            .price(counter.price)
                            .quantity(fill)
                            .timestamp(Instant.now())
                            .build();
                    trades.add(t);

                    incoming.setRemainingQty(incoming.getRemainingQty() - fill);
                    counter.remainingQty -= fill;

                    if (counter.remainingQty == 0) {
                        queue.removeFirst();
                    }
                    if (queue.isEmpty()) bookAsks.remove(bestPrice);
                }
            } else {
                // sell order: match against bids
                while (incoming.getRemainingQty() > 0 && !bookBids.isEmpty()) {
                    Map.Entry<BigDecimal, Deque<OrderNode>> bestEntry = bookBids.firstEntry();
                    BigDecimal bestPrice = bestEntry.getKey();
                    if (incoming.getType() == OrderEntity.Type.LIMIT && incoming.getPrice().compareTo(bestPrice) > 0) break;

                    Deque<OrderNode> queue = bestEntry.getValue();
                    OrderNode counter = queue.peekFirst();
                    if (counter == null) { bookBids.remove(bestPrice); continue; }

                    int fill = Math.min(incoming.getRemainingQty(), counter.remainingQty);
                    TradeEvent t = TradeEvent.builder()
                            .tradeId(UUID.randomUUID().toString())
                            .symbol(symbol)
                            .buyOrderId(counter.orderId)
                            .sellOrderId(incoming.getId())
                            .price(counter.price)
                            .quantity(fill)
                            .timestamp(Instant.now())
                            .build();
                    trades.add(t);

                    incoming.setRemainingQty(incoming.getRemainingQty() - fill);
                    counter.remainingQty -= fill;

                    if (counter.remainingQty == 0) {
                        queue.removeFirst();
                    }
                    if (queue.isEmpty()) bookBids.remove(bestPrice);
                }
            }

            // After matching
            if (incoming.getRemainingQty() > 0) {
                if (incoming.getType() == OrderEntity.Type.LIMIT) {
                    // add to book
                    NavigableMap<BigDecimal, Deque<OrderNode>> target = isBuy ? bookBids : bookAsks;
                    BigDecimal price = incoming.getPrice();
                    Deque<OrderNode> q = target.computeIfAbsent(price, k -> new ArrayDeque<>());
                    q.addLast(new OrderNode(incoming.getId(), incoming.getRemainingQty(), price, incoming.getCreatedAt()));
                } else {
                    // MARKET order with remaining qty -> add to book using provided price so it can match later
                    NavigableMap<BigDecimal, Deque<OrderNode>> target = isBuy ? bookBids : bookAsks;
                    BigDecimal price = incoming.getPrice() != null ? incoming.getPrice() : BigDecimal.ZERO;
                    Deque<OrderNode> q = target.computeIfAbsent(price, k -> new ArrayDeque<>());
                    q.addLast(new OrderNode(incoming.getId(), incoming.getRemainingQty(), price, incoming.getCreatedAt()));
                }
            }

            // update incoming status
            if (incoming.getRemainingQty() == 0) incoming.setStatus(OrderEntity.Status.FILLED);
            else if (incoming.getRemainingQty() < incoming.getQuantity()) incoming.setStatus(OrderEntity.Status.PARTIAL);
            else incoming.setStatus(OrderEntity.Status.PENDING);
        }

        return trades;
    }

    private static class OrderNode {
        String orderId;
        int remainingQty;
        BigDecimal price;
        Instant timestamp;

        OrderNode(String orderId, int remainingQty, BigDecimal price, Instant timestamp) {
            this.orderId = orderId;
            this.remainingQty = remainingQty;
            this.price = price;
            this.timestamp = timestamp;
        }
    }
}


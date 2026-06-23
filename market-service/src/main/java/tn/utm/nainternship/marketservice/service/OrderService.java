package tn.utm.nainternship.marketservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.utm.nainternship.marketservice.client.AssetClient;
import tn.utm.nainternship.marketservice.client.NotificationsServiceClient;
import tn.utm.nainternship.marketservice.client.PortfolioClient;
import tn.utm.nainternship.marketservice.dto.OrderDetailsResponse;
import tn.utm.nainternship.marketservice.dto.OrderRequest;
import tn.utm.nainternship.marketservice.dto.OrderResponse;
import tn.utm.nainternship.marketservice.dto.OrderUpdateRequest;
import tn.utm.nainternship.marketservice.dto.TradeEvent;
import tn.utm.nainternship.marketservice.entity.OrderEntity;
import tn.utm.nainternship.marketservice.entity.TradeEntity;
import tn.utm.nainternship.marketservice.exception.InsufficientFundsException;
import tn.utm.nainternship.marketservice.kafka.TradeEventPublisher;
import tn.utm.nainternship.marketservice.mapper.OrderMapper;
import tn.utm.nainternship.marketservice.repository.OrderRepository;
import tn.utm.nainternship.marketservice.repository.TradeRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final AssetClient assetClient;
    private final PortfolioClient portfolioClient;
    private final NotificationsServiceClient notificationsClient;
    private final OrderBookService orderBookService;
    private final OrderRepository orderRepository;
    private final TradeRepository tradeRepository;
    private final TradeEventPublisher tradeEventPublisher;
    private final OrderMapper orderMapper;

    @Transactional
    public OrderResponse submitOrder(OrderRequest request) {
        // Step 1 - Read the authenticated principal from the security context and extract userId
        String userId = resolveUserId();
        log.info("Submitting order for userId={}, symbol={}, side={}, quantity={}, price={}", userId, request.getSymbol(), request.getSide(), request.getQuantity(), request.getPrice());

        // Step 2 - Validate symbol via asset-service (cached)
        assetClient.getAsset(request.getSymbol());
        log.info("Symbol {} is valid", request.getSymbol());

        // Step 3 - Verify balance/position
        if (request.getSide() == OrderRequest.Side.BUY) {
            BigDecimal balance = portfolioClient.getBalance(userId);
            BigDecimal required = request.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
            if (balance.compareTo(required) < 0) {
                throw new InsufficientFundsException("Insufficient funds");
            }
        } else {
            int position = portfolioClient.getPositionQuantity(userId, request.getSymbol());
            if (position < request.getQuantity()) {
                throw new InsufficientFundsException("Insufficient shares for symbol: " + request.getSymbol());
            }
        }

        // Step 4 - Freeze funds or shares
        OrderEntity order = orderMapper.toEntity(request);
        order.setId(UUID.randomUUID().toString()); // ensure id exists for freeze reason
        order.setUserId(userId);
        order.setRemainingQty(request.getQuantity());
        order.setStatus(OrderEntity.Status.PENDING);

        String freezeReason = "ORDER_" + order.getId();
        try {
            if (request.getSide() == OrderRequest.Side.BUY) {
                BigDecimal amount = request.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
                portfolioClient.freezeAmount(userId, amount, freezeReason);
            } else {
                portfolioClient.freezeShares(userId, request.getSymbol(), request.getQuantity(), freezeReason);
            }
        } catch (RuntimeException ex) {
            log.error("Failed to freeze funds/shares", ex);
            throw new RuntimeException("Failed to freeze funds/shares: " + ex.getMessage(), ex);
        }

        // Step 5 - Persist the order
        order = orderRepository.save(order);

        // Step 6 — Run matching engine
        List<TradeEntity> trades = orderBookService.match(order);
        log.info("Matching result for order {}: {} trade(s), status={}",
                order.getId(), trades.size(), order.getStatus());

        // Step 7 — Persist trades and publish to Kafka
        persistTrades(trades);

        // Save the updated order status (FILLED / PARTIAL / PENDING / CANCELLED)
        order = orderRepository.save(order);

        // Check if order is fully or partially filled and send appropriate notification
        int totalFilledQuantity = trades.stream().mapToInt(TradeEntity::getQuantity).sum();
        if (totalFilledQuantity > 0) {
            if (totalFilledQuantity == request.getQuantity()) {
                // Fully filled - already handled by trade events
                log.info("Order fully filled");
            } else {
                // Partially filled
                notificationsClient.sendOrderPartiallyExecutedNotification(userId, order, totalFilledQuantity);
            }
        }

        return OrderResponse.builder()
                .id(order.getId())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public OrderBookSnapshot getOrderBookBySymbol(String symbol) {
        return orderBookService.snapshot(symbol);
    }

    @Transactional(readOnly = true)
    public OrderDetailsResponse getOrderById(String orderId) {
        String userId = resolveUserId();
        return toDetails(requireOwnedOrder(orderId, userId));
    }

    @Transactional(readOnly = true)
    public List<OrderDetailsResponse> getOrdersByUser(String userId) {
        ensureSelf(userId);
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDetails)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderDetailsResponse> getOpenOrdersByUser(String userId) {
        ensureSelf(userId);
        return orderRepository.findByUserIdAndStatusInOrderByCreatedAtDesc(
                userId, List.of(OrderEntity.Status.PENDING, OrderEntity.Status.PARTIAL)
        ).stream().map(this::toDetails).toList();
    }

    @Transactional
    public OrderResponse updateOrder(String orderId, OrderUpdateRequest request) {
        String userId = resolveUserId();
        OrderEntity order = requireOwnedOrder(orderId, userId);

        if (order.getStatus() != OrderEntity.Status.PENDING && order.getStatus() != OrderEntity.Status.PARTIAL) {
            throw new IllegalStateException("Only open orders can be updated");
        }
        if (request.getPrice() == null && request.getQuantity() == null) {
            throw new IllegalArgumentException("At least one field must be provided for update");
        }

        int filledQty = order.getQuantity() - order.getRemainingQty();
        BigDecimal newPrice = request.getPrice() != null ? request.getPrice() : order.getPrice();
        int newTotalQty = request.getQuantity() != null ? request.getQuantity() : order.getQuantity();

        if (newTotalQty < filledQty) {
            throw new IllegalArgumentException("Updated quantity cannot be smaller than already filled quantity");
        }

        int newRemainingQty = newTotalQty - filledQty;
        String freezeReason = "ORDER_" + order.getId();

        orderBookService.removeFromBook(order);
        adjustReservation(order, newPrice, newRemainingQty, userId, freezeReason);

        order.setPrice(newPrice);
        order.setQuantity(newTotalQty);
        order.setRemainingQty(newRemainingQty);
        order.setStatus(newRemainingQty > 0
                ? (filledQty > 0 ? OrderEntity.Status.PARTIAL : OrderEntity.Status.PENDING)
                : OrderEntity.Status.CANCELLED);

        order = orderRepository.save(order);

        if (order.getRemainingQty() > 0) {
            List<TradeEntity> trades = orderBookService.match(order);
            persistTrades(trades);
            order = orderRepository.save(order);

            int totalFilledQuantity = trades.stream().mapToInt(TradeEntity::getQuantity).sum();
            if (totalFilledQuantity > 0 && order.getRemainingQty() > 0) {
                notificationsClient.sendOrderPartiallyExecutedNotification(userId, order, totalFilledQuantity);
            }
        }

        return OrderResponse.builder()
                .id(order.getId())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .build();
    }

    @Transactional
    public OrderResponse cancelOrder(String orderId) {
        String userId = resolveUserId();
        OrderEntity order = requireOwnedOrder(orderId, userId);

        if (order.getStatus() == OrderEntity.Status.FILLED || order.getStatus() == OrderEntity.Status.CANCELLED) {
            throw new IllegalStateException("Order cannot be cancelled in status " + order.getStatus());
        }

        int remainingQty = order.getRemainingQty();
        String freezeReason = "ORDER_" + order.getId();

        orderBookService.removeFromBook(order);

        if (remainingQty > 0) {
            if (order.getSide() == OrderEntity.Side.BUY) {
                BigDecimal amount = order.getPrice().multiply(BigDecimal.valueOf(remainingQty));
                portfolioClient.unfreezeAmount(userId, amount, freezeReason);
            } else {
                portfolioClient.unfreezeShares(userId, order.getSymbol(), remainingQty, freezeReason);
            }
        }

        order.setRemainingQty(0);
        order.setStatus(OrderEntity.Status.CANCELLED);
        order = orderRepository.save(order);

        notificationsClient.sendOrderCancelledNotification(userId, order);

        return OrderResponse.builder()
                .id(order.getId())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .build();
    }

    private void adjustReservation(OrderEntity order, BigDecimal newPrice, int newRemainingQty, String userId, String freezeReason) {
        if (order.getSide() == OrderEntity.Side.BUY) {
            BigDecimal oldReserved = order.getPrice().multiply(BigDecimal.valueOf(order.getRemainingQty()));
            BigDecimal newReserved = newPrice.multiply(BigDecimal.valueOf(newRemainingQty));
            BigDecimal delta = newReserved.subtract(oldReserved);
            if (delta.signum() > 0) {
                portfolioClient.freezeAmount(userId, delta, freezeReason);
            } else if (delta.signum() < 0) {
                portfolioClient.unfreezeAmount(userId, delta.abs(), freezeReason);
            }
        } else {
            int delta = newRemainingQty - order.getRemainingQty();
            if (delta > 0) {
                portfolioClient.freezeShares(userId, order.getSymbol(), delta, freezeReason);
            } else if (delta < 0) {
                portfolioClient.unfreezeShares(userId, order.getSymbol(), Math.abs(delta), freezeReason);
            }
        }
    }

    private void persistTrades(List<TradeEntity> trades) {
        for (TradeEntity trade : trades) {
            TradeEntity saved = tradeRepository.save(trade);
            log.info("Trade persisted: {} x{} @ {}", saved.getSymbol(), saved.getQuantity(), saved.getPrice());

            TradeEvent event = TradeEvent.builder()
                    .tradeId(saved.getId())
                    .symbol(saved.getSymbol())
                    .price(saved.getPrice())
                    .quantity(saved.getQuantity())
                    .buyOrderId(saved.getBuyOrder().getId())
                    .sellOrderId(saved.getSellOrder().getId())
                    .buyUserId(saved.getBuyOrder().getUserId())
                    .sellUserId(saved.getSellOrder().getUserId())
                    .timestamp(saved.getTimestamp())
                    .build();

            tradeEventPublisher.publish(event);
        }
    }

    private OrderEntity requireOwnedOrder(String orderId, String userId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        if (!userId.equals(order.getUserId())) {
            throw new SecurityException("You can only access your own orders");
        }
        return order;
    }

    private void ensureSelf(String userId) {
        String currentUserId = resolveUserId();
        if (!currentUserId.equals(userId)) {
            throw new SecurityException("You can only access your own orders");
        }
    }

    private OrderDetailsResponse toDetails(OrderEntity order) {
        return OrderDetailsResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .symbol(order.getSymbol())
                .side(order.getSide())
                .type(order.getType())
                .price(order.getPrice())
                .quantity(order.getQuantity())
                .remainingQty(order.getRemainingQty())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .build();
    }

    private String resolveUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new IllegalStateException("No authentication found in security context");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            return jwt.getSubject();
        }

        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            return jwtAuthenticationToken.getToken().getSubject();
        }

        String principalType = principal == null ? "null" : principal.getClass().getName();
        throw new IllegalStateException("Unsupported authentication principal: " + principalType);
    }
}

package tn.utm.nainternship.marketservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.utm.nainternship.marketservice.client.AssetClient;
import tn.utm.nainternship.marketservice.client.NotificationsServiceClient;
import tn.utm.nainternship.marketservice.client.PortfolioClient;
import tn.utm.nainternship.marketservice.dto.OrderRequest;
import tn.utm.nainternship.marketservice.dto.OrderResponse;
import tn.utm.nainternship.marketservice.dto.TradeEvent;
import tn.utm.nainternship.marketservice.entity.OrderEntity;
import tn.utm.nainternship.marketservice.entity.TradeEntity;
import tn.utm.nainternship.marketservice.exception.InsufficientFundsException;
import tn.utm.nainternship.marketservice.mapper.OrderMapper;
import tn.utm.nainternship.marketservice.mapper.TradeMapper;
import tn.utm.nainternship.marketservice.repository.OrderRepository;
import tn.utm.nainternship.marketservice.repository.TradeRepository;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final AssetClient assetClient;
    private final PortfolioClient portfolioClient;
    private final OrderBookService orderBookService;
    private final OrderRepository orderRepository;
    private final TradeRepository tradeRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final OrderMapper orderMapper;
    private final TradeMapper tradeMapper;
    private final NotificationsServiceClient notificationsServiceClient;

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
                // Send notification for rejected order
                notificationsServiceClient.sendOrderRejectedNotification(userId, request);
                throw new InsufficientFundsException("Insufficient funds");
            }
        } else {
            int position = portfolioClient.getPositionQuantity(userId, request.getSymbol());
            if (position < request.getQuantity()) {
                // Send notification for rejected order
                notificationsServiceClient.sendOrderRejectedNotification(userId, request);
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
            // Send notification for rejected order
            notificationsServiceClient.sendOrderRejectedNotification(userId, request);
            throw new RuntimeException("Failed to freeze funds/shares: " + ex.getMessage(), ex);
        }

        // Step 5 - Persist the order
        order = orderRepository.save(order);

        // Step 6 - Run matching engine
        List<TradeEvent> tradeEvents = orderBookService.match(order);

        // Step 7 - Persist trades and publish to Kafka
        List<TradeEntity> tradeEntities = tradeEvents.stream()
                .map(tradeMapper::toEntity)
                .collect(Collectors.toList());

        tradeRepository.saveAll(tradeEntities);

        // Send notifications for trade events
        for (TradeEvent te : tradeEvents) {
            try {
                // Find the corresponding TradeEntity that was saved
                TradeEntity tradeEntity = tradeEntities.stream()
                    .filter(t -> t.getId().equals(te.getTradeId()))
                    .findFirst()
                    .orElse(null);
                
                if (tradeEntity != null) {
                    // Send notification for executed trade
                    notificationsServiceClient.sendOrderExecutedNotification(userId, order, tradeEntity);
                }
                
                // Send to Kafka
                String payload = objectMapper.writeValueAsString(te);
                kafkaTemplate.send("trade-executed", te.getSymbol(), payload);
            } catch (Exception e) {
                log.error("Failed to serialize trade event", e);
            }
        }

        // Check if order is fully or partially filled and send appropriate notification
        int totalFilledQuantity = tradeEvents.stream().mapToInt(TradeEvent::getQuantity).sum();
        if (totalFilledQuantity > 0) {
            if (totalFilledQuantity == request.getQuantity()) {
                // Fully filled - already handled by trade events
                log.info("Order fully filled");
            } else {
                // Partially filled
                notificationsServiceClient.sendOrderPartiallyExecutedNotification(userId, order, totalFilledQuantity);
            }
        }

        return OrderResponse.builder()
                .id(order.getId())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .build();
    }

    public void cancelOrder(String orderId) {
        OrderEntity order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
            
        String userId = order.getUserId();
        order.setStatus(OrderEntity.Status.CANCELLED);
        orderRepository.save(order);
        
        // Send notification for cancelled order
        notificationsServiceClient.sendOrderCancelledNotification(userId, order);
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

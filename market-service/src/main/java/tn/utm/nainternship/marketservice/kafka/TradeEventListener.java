package tn.utm.nainternship.marketservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tn.utm.nainternship.marketservice.entity.OrderEntity;
import tn.utm.nainternship.marketservice.entity.TradeEntity;
import tn.utm.nainternship.marketservice.repository.OrderRepository;
import tn.utm.nainternship.marketservice.repository.TradeRepository;
import tools.jackson.databind.ObjectMapper;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class TradeEventListener {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final OrderRepository orderRepository;
    private final TradeRepository tradeRepository;

    @KafkaListener(topics = "trade-executed", groupId = "market-service-group")
    public void onTradeExecuted(String message) {
        try {
            // map to TradeEntity
            var dto = objectMapper.readTree(message);
            TradeEntity trade = new TradeEntity();
            trade.setId(dto.get("tradeId").asString());
            trade.setSymbol(dto.get("symbol").asString());
            trade.setBuyOrderId(dto.get("buyOrderId").asString());
            trade.setSellOrderId(dto.get("sellOrderId").asString());
            trade.setPrice(new java.math.BigDecimal(dto.get("price").asString()));
            trade.setQuantity(dto.get("quantity").asInt());
            tradeRepository.save(trade);

            // update orders' remaining qty and status if present
            String buyId = trade.getBuyOrderId();
            String sellId = trade.getSellOrderId();

            Optional<OrderEntity> buyOpt = orderRepository.findById(buyId);
            buyOpt.ifPresent(orderEntity -> updateOrderFromTrade(orderEntity, trade.getQuantity()));
            Optional<OrderEntity> sellOpt = orderRepository.findById(sellId);
            sellOpt.ifPresent(orderEntity -> updateOrderFromTrade(orderEntity, trade.getQuantity()));

        } catch (Exception ex) {
            log.error("Failed to process trade-executed message", ex);
        }
    }

    private void updateOrderFromTrade(OrderEntity order, int fillQty) {
        int remaining = order.getRemainingQty() - fillQty;
        if (remaining < 0) remaining = 0;
        order.setRemainingQty(remaining);
        if (remaining == 0) order.setStatus(OrderEntity.Status.FILLED);
        else if (remaining < order.getQuantity()) order.setStatus(OrderEntity.Status.PARTIAL);
        orderRepository.save(order);
    }
}


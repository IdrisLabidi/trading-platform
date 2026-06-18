package tn.utm.nainternship.marketservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tn.utm.nainternship.marketservice.entity.OrderEntity;
import tn.utm.nainternship.marketservice.entity.TradeEntity;
import tn.utm.nainternship.marketservice.mapper.TradeMapper;
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
    private final TradeMapper tradeMapper;

    @KafkaListener(topics = "trade-executed", groupId = "market-service-group")
    public void onTradeExecuted(String message) {
        try {
            // map to TradeEntity
            var dto = objectMapper.readTree(message);
            TradeEntity trade = new TradeEntity();
            trade.setId(dto.get("tradeId").asText());
            trade.setSymbol(dto.get("symbol").asText());
            trade.setBuyOrderId(dto.get("buyOrderId").asText());
            trade.setSellOrderId(dto.get("sellOrderId").asText());
            trade.setPrice(new java.math.BigDecimal(dto.get("price").asText()));
            trade.setQuantity(dto.get("quantity").asInt());
            tradeRepository.save(trade);

            // update orders' remaining qty and status if present
            String buyId = trade.getBuyOrderId();
            String sellId = trade.getSellOrderId();

            Optional<OrderEntity> buyOpt = orderRepository.findById(buyId);
            if (buyOpt.isPresent()) updateOrderFromTrade(buyOpt.get(), trade.getQuantity());
            Optional<OrderEntity> sellOpt = orderRepository.findById(sellId);
            if (sellOpt.isPresent()) updateOrderFromTrade(sellOpt.get(), trade.getQuantity());

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


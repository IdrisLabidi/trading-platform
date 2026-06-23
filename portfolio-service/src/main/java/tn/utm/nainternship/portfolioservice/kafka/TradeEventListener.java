package tn.utm.nainternship.portfolioservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tn.utm.nainternship.portfolioservice.service.AccountService;
import tn.utm.nainternship.portfolioservice.service.PositionService;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class TradeEventListener {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AccountService accountService;
    private final PositionService positionService;

    @KafkaListener(topics = "trade-executed", groupId = "portfolio-service-group")
    public void onTradeExecuted(String message){
        log.info("Received trade-executed message: {}", message);
        var dto = objectMapper.readTree(message);

        String buyUserId = dto.get("buyUserId").asString();
        String sellUserId = dto.get("sellUserId").asString();
        String symbol = dto.get("symbol").asString();
        int quantity = dto.get("quantity").asInt();
        BigDecimal price = new BigDecimal(dto.get("price").asString());
        BigDecimal totalAmount = price.multiply(BigDecimal.valueOf(quantity));

        accountService.consumeFrozenCash(buyUserId, totalAmount);
        accountService.creditCash(sellUserId, totalAmount);
        positionService.creditShares(buyUserId, symbol, quantity, price);
        positionService.debitShares(sellUserId, symbol, quantity);
    }
}

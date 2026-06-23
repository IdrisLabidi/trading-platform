package tn.utm.nainternship.marketservice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class TradeEvent {
    private String tradeId;
    private String symbol;
    private String buyOrderId;
    private String buyUserId;
    private String sellOrderId;
    private String sellUserId;
    private BigDecimal price;
    private int quantity;
    private Instant timestamp;
}


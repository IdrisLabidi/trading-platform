package tn.utm.nainternship.marketservice.dto;

import lombok.Builder;
import lombok.Data;
import tn.utm.nainternship.marketservice.entity.OrderEntity;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class OrderDetailsResponse {
    private String id;
    private String userId;
    private String symbol;
    private OrderEntity.Side side;
    private OrderEntity.Type type;
    private BigDecimal price;
    private int quantity;
    private int remainingQty;
    private OrderEntity.Status status;
    private Instant createdAt;
}

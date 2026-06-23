package tn.utm.nainternship.marketservice.dto;

import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderUpdateRequest {
    @Positive
    private BigDecimal price;

    @Positive
    private Integer quantity;
}

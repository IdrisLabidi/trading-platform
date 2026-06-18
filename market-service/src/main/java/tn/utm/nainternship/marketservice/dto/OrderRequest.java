package tn.utm.nainternship.marketservice.dto;

import lombok.Data;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
public class OrderRequest {
    @NotBlank
    private String symbol;

    @NotNull
    private Side side;

    @NotNull
    private Type type;

    @Positive
    private BigDecimal price;

    @Positive
    private Integer quantity;

    public enum Side { BUY, SELL }
    public enum Type { MARKET, LIMIT }
}


package tn.utm.nainternship.portfolioservice.dto;

import java.math.BigDecimal;

public record FreezeSharesRequest(String reason, Integer quantity, String symbol) {
}

package tn.utm.nainternship.portfolioservice.dto;

import java.math.BigDecimal;

public record FreezeBalanceRequest(
        String userId,
        String reason,
        BigDecimal amount) {
}

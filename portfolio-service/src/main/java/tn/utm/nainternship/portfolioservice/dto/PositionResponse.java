package tn.utm.nainternship.portfolioservice.dto;

import java.math.BigDecimal;

/**
 * DTO de réponse pour les positions d'un trader.
 *
 * On y trouve la quantité totale, la quantité gelée (non revendable), et la
 * quantité réellement disponible (quantity - frozenQty).
 */
public record PositionResponse(String userId,
                               String symbol,
                               Integer quantity,
                               Integer frozenQuantity,
                               Integer availableQuantity,
                               BigDecimal avgPrice) {
}

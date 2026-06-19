package tn.utm.nainternship.portfolioservice.dto;

import tn.utm.nainternship.portfolioservice.model.OrderSide;
import tn.utm.nainternship.portfolioservice.model.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO de réponse renvoyé après création d'un ordre.
 *
 * Il contient toutes les informations utiles au frontend pour afficher
 * l'ordre et son statut. Le champ frozenAmount correspond à la valeur
 * (price * quantity) qui a été gelée sur le compte.
 */
public record OrderResponse(UUID id,
                            String userId,
                            String symbol,
                            OrderSide side,
                            Integer quantity,
                            BigDecimal price,
                            BigDecimal frozenAmount,
                            OrderStatus status,
                            Instant createdAt) {
}

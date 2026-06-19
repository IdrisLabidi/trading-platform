package tn.utm.nainternship.portfolioservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import tn.utm.nainternship.portfolioservice.model.OrderSide;

import java.math.BigDecimal;

/**
 * DTO d'entrée pour la création d'un ordre (BUY ou SELL).
 *
 * Il est validé via jakarta.validation (Bean Validation) avant d'être traité
 * par le service. Le prix est obligatoire ici car, même si le market-service
 * supporte les ordres MARKET, on travaille à ce stade avec des ordres LIMIT
 * pour lesquels le prix est connu à l'avance.
 */
public record CreateOrderRequest(
        @NotBlank String symbol,
        @NotNull OrderSide side,
        @NotNull @Min(1) Integer quantity,
        @NotNull @Positive BigDecimal price
) {
}

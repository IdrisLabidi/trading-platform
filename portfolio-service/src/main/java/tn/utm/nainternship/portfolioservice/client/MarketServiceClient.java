package tn.utm.nainternship.portfolioservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tn.utm.nainternship.portfolioservice.exception.MarketServiceUnavailableException;

import java.math.BigDecimal;

/**
 * Client synchrone vers le market-service.
 *
 * Pourquoi synchrone ? Lors de la création d'un ordre BUY, le portfolio-service
 * doit vérifier que le trader a assez de cash AVANT de geler le solde et
 * d'acheminer l'ordre. Cette vérification doit se faire dans la même
 * transaction logique que la création de l'ordre : on a donc besoin d'une
 * réponse synchrone pour prendre une décision immédiate.
 *
 * On interroge pour l'instant l'endpoint "quote" exposé par le market-service
 * pour récupérer le dernier prix d'un actif. Cela permet de calculer le coût
 * total d'un ordre BUY (prix * quantité) à partir d'une donnée de marché
 * officielle plutôt qu'à partir d'un prix saisi par le client (plus tard,
 * on pourra étendre à une vérification d'enchères en carnet).
 *
 * Toute exception réseau ou 5xx est transformée en
 * {@link MarketServiceUnavailableException} pour être traitée de façon
 * homogène par le GlobalExceptionHandler (HTTP 502 Bad Gateway).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MarketServiceClient {

    private final RestClient marketRestClient;

    /**
     * Récupère le dernier prix de marché pour un symbole donné.
     *
     * @param symbol symbole de l'actif (ex: "BIAT")
     * @return prix actuel sous forme de BigDecimal
     * @throws MarketServiceUnavailableException si le market-service ne répond pas
     *         ou renvoie une erreur.
     */
    public BigDecimal getLastPrice(String symbol) {
        log.debug("Calling market-service for last price of symbol={}", symbol);
        try {
            QuoteResponse response = marketRestClient.get()
                    .uri("/api/market/quotes/{symbol}", symbol)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new MarketServiceUnavailableException(
                                "Market-service returned status " + res.getStatusCode() + " for symbol " + symbol);
                    })
                    .body(QuoteResponse.class);

            if (response == null || response.price() == null) {
                throw new MarketServiceUnavailableException(
                        "Empty response from market-service for symbol " + symbol);
            }
            return response.price();
        } catch (MarketServiceUnavailableException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to call market-service for symbol {}: {}", symbol, ex.getMessage());
            throw new MarketServiceUnavailableException(
                    "Unable to reach market-service: " + ex.getMessage(), ex);
        }
    }

    /**
     * Réponse minimale attendue du market-service pour une cotation.
     * Le nom du champ "price" suit la convention du guide de démarrage.
     */
    public record QuoteResponse(String symbol, BigDecimal price) {
    }
}

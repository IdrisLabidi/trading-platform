package tn.utm.nainternship.portfolioservice.exception;

/**
 * Levée lorsque le market-service ne répond pas ou renvoie une erreur lors
 * d'une vérification synchrone (par exemple, la validation d'un prix actuel
 * ou d'un symbole). Permet au contrôleur de remonter un HTTP 502 (BAD GATEWAY).
 */
public class MarketServiceUnavailableException extends RuntimeException {
    public MarketServiceUnavailableException(String message) {
        super(message);
    }

    public MarketServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}

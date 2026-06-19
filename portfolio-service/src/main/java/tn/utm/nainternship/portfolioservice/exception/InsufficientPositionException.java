package tn.utm.nainternship.portfolioservice.exception;

/**
 * Levée lorsqu'un trader tente de vendre plus d'actions qu'il n'en possède
 * réellement (en tenant compte de la quantité déjà gelée par d'autres SELL).
 * Mécanisme anti double-spending côté vendeur.
 */
public class InsufficientPositionException extends RuntimeException {
    public InsufficientPositionException(String message) {
        super(message);
    }
}

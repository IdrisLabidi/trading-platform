package tn.utm.nainternship.portfolioservice.exception;

/**
 * Levée lorsqu'un trader tente de passer un ordre BUY alors que
 * son solde disponible (cashBalance - frozenBalance) est insuffisant.
 *
 * Cette exception est traduite en HTTP 400 (BAD REQUEST) par le
 * GlobalExceptionHandler.
 */
public class InsufficientFundsException extends RuntimeException {
    public InsufficientFundsException(String message) {
        super(message);
    }
}

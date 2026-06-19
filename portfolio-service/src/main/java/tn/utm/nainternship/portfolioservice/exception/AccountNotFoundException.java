package tn.utm.nainternship.portfolioservice.exception;

/**
 * Levée lorsqu'aucun compte n'existe pour un userId donné.
 * Typiquement, on créera automatiquement le compte à la première
 * interrogation, mais cette exception reste utile si la création
 * automatique est désactivée.
 */
public class AccountNotFoundException extends RuntimeException {
    public AccountNotFoundException(String message) {
        super(message);
    }
}

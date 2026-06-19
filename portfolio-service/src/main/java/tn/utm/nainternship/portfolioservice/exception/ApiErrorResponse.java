package tn.utm.nainternship.portfolioservice.exception;

import java.time.Instant;

/**
 * Format uniforme des réponses d'erreur renvoyées par l'API.
 * Cohérent avec celui utilisé par asset-service pour faciliter
 * le debugging côté frontend.
 */
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {
}

package tn.utm.nainternship.portfolioservice.model;

/**
 * Cycle de vie simplifié d'un ordre dans le portfolio-service.
 *
 * L'ordre n'est qu'un point de vue local côté portefeuille ; l'état réel
 * (matching, exécution) est géré par le market-service. Cette enum sert
 * uniquement à tracer l'avancement côté portfolio (réservation, libération).
 *
 *  - PENDING   : ordre créé, fonds/positions gelés, en attente de matching.
 *  - EXECUTED  : ordre exécuté (transaction enregistrée).
 *  - CANCELLED : ordre annulé par l'utilisateur ou le système, fonds/positions
 *                restitués au propriétaire.
 */
public enum OrderStatus {
    PENDING,
    EXECUTED,
    CANCELLED
}

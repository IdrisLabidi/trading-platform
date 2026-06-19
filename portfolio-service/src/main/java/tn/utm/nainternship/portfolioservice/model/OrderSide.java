package tn.utm.nainternship.portfolioservice.model;

/**
 * Côté d'un ordre de bourse passé par un trader.
 *
 *  - BUY  : l'utilisateur achète un actif, son cash doit être suffisant.
 *  - SELL : l'utilisateur vend un actif, il doit posséder assez d'actions.
 *
 * Cette enum est volontairement simple et partagée par tous les composants
 * internes (DTO, services, contrôleurs). Elle pourra plus tard être alignée
 * sur celle du market-service lors de l'interopérabilité via Kafka.
 */
public enum OrderSide {
    BUY,
    SELL
}

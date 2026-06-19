package tn.utm.nainternship.portfolioservice.dto;

import java.math.BigDecimal;

/**
 * DTO de réponse pour l'endpoint /api/portfolio/{userId}/balance.
 *
 * Il expose :
 *  - cashBalance     : cash réellement disponible ;
 *  - frozenBalance   : cash déjà réservé par des ordres en attente ;
 *  - availableBalance: cashBalance - frozenBalance, c'est ce montant que
 *                       l'utilisateur peut engager dans un nouvel ordre.
 */
public record BalanceResponse(String userId,
                              BigDecimal cashBalance,
                              BigDecimal frozenBalance,
                              BigDecimal availableBalance) {
}

package tn.utm.nainternship.portfolioservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.utm.nainternship.portfolioservice.dto.BalanceResponse;
import tn.utm.nainternship.portfolioservice.dto.PositionResponse;
import tn.utm.nainternship.portfolioservice.service.AccountService;
import tn.utm.nainternship.portfolioservice.service.PositionService;

import java.util.List;

/**
 * Contrôleur REST principal du portfolio-service.
 * Endpoints exposés (préfixe /api/portfolio) :
 *   GET /api/portfolio/{userId}/balance
 *       → solde cash (cashBalance, frozenBalance, availableBalance)
 *   GET /api/portfolio/{userId}/positions
 *       → liste de toutes les positions détenues par l'utilisateur
 *   GET /api/portfolio/{userId}/positions/{symbol}
 *       → quantité d'actions pour un symbole précis
 * Tous les endpoints sont protégés par JWT (SecurityConfig) et restreints
 * au rôle "trader". On vérifie également côté contrôleur que le {userId}
 * du chemin correspond au sujet (sub) du JWT, afin qu'un utilisateur ne
 * puisse pas accéder au portefeuille d'un autre trader.
 */
@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final AccountService accountService;
    private final PositionService positionService;

    /**
     * Récupère le solde (cash + frozen + disponible) d'un utilisateur.
     */
    @GetMapping("/{userId}/balance")
    public ResponseEntity<BalanceResponse> getBalance(@PathVariable String userId,
                                                      @AuthenticationPrincipal Jwt jwt) {
        ensureSelf(userId, jwt);
        return ResponseEntity.ok(accountService.getBalance(userId));
    }

    /**
     * Récupère la position d'un utilisateur pour un symbole précis.
     * Retourne un DTO avec quantité totale, gelée et disponible.
     */
    @GetMapping("/{userId}/positions/{symbol}")
    public ResponseEntity<PositionResponse> getPosition(@PathVariable String userId,
                                                        @PathVariable String symbol,
                                                        @AuthenticationPrincipal Jwt jwt) {
        ensureSelf(userId, jwt);
        return ResponseEntity.ok(positionService.getPosition(userId, symbol));
    }

    /** Liste toutes les positions de l'utilisateur. */
    @GetMapping("/{userId}/positions")
    public ResponseEntity<List<PositionResponse>> getAllPositions(@PathVariable String userId,
                                                                  @AuthenticationPrincipal Jwt jwt) {
        ensureSelf(userId, jwt);
        return ResponseEntity.ok(positionService.getAllPositions(userId));
    }

    /**
     * Compare l'identifiant utilisateur du chemin avec la claim "sub" du JWT.
     * Cela protège contre les appels du type
     *     GET /api/portfolio/OTHER_USER/balance
     * où OTHER_USER != authenticated user.
     */
    private void ensureSelf(String userId, Jwt jwt) {
        if (jwt == null || !userId.equals(jwt.getSubject())) {
            throw new SecurityException("Accès refusé : le userId ne correspond pas au token");
        }
    }
}

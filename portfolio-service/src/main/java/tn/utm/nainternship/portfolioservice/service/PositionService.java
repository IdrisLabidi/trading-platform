package tn.utm.nainternship.portfolioservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.utm.nainternship.portfolioservice.dto.PositionResponse;
import tn.utm.nainternship.portfolioservice.entity.Position;
import tn.utm.nainternship.portfolioservice.exception.InsufficientPositionException;
import tn.utm.nainternship.portfolioservice.repository.PositionRepository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service métier pour la gestion des positions détenues par un utilisateur.
 *
 * Une position = (userId, symbol) → quantité / prix moyen.
 *
 * Comme pour le cash, on distingue la quantité totale (quantity) de la quantité
 * gelée (frozenQty) qui correspond aux actions réservées par des ordres SELL
 * en cours. Cela garantit qu'un utilisateur ne peut pas vendre deux fois les
 * mêmes actions (anti double-spending côté vendeur).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PositionService {

    private final PositionRepository positionRepository;

    /**
     * Récupère une position précise en mode verrou pessimiste (SELECT FOR UPDATE).
     * Utilisé lors d'un SELL pour sérialiser les écritures sur cette ligne.
     */
    @Transactional
    public Position loadForUpdate(String userId, String symbol) {
        return positionRepository.findByUserIdAndSymbolForUpdate(userId, symbol)
                .orElse(null);
    }

    /**
     * Renvoie la position d'un utilisateur pour un symbole donné.
     * Retourne null si l'utilisateur ne détient pas cet actif.
     */
    @Transactional(readOnly = true)
    public PositionResponse getPosition(String userId, String symbol) {
        return positionRepository.findByUserIdAndSymbol(userId, symbol)
                .map(this::toResponse)
                .orElse(new PositionResponse(userId, symbol, 0, 0, 0, BigDecimal.ZERO));
    }

    /**
     * Liste toutes les positions d'un utilisateur (utilisé pour la vue d'ensemble).
     */
    @Transactional(readOnly = true)
    public List<PositionResponse> getAllPositions(String userId) {
        return positionRepository.findAllByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Gèle une quantité d'actions pour un SELL en cours.
     * Lève InsufficientPositionException si l'utilisateur ne possède pas assez
     * d'actions réellement disponibles (quantity - frozenQty).
     */
    @Transactional
    public Position freezeShares(String userId, String symbol, int quantity) {
        Position position = loadForUpdate(userId, symbol);
        if (position == null) {
            throw new InsufficientPositionException(
                    "L'utilisateur ne détient aucune action du symbole " + symbol);
        }
        int available = position.getQuantity() - position.getFrozenQty();
        if (available < quantity) {
            log.warn("Freeze refused for user={} symbol={} qty={} available={}",
                    userId, symbol, quantity, available);
            throw new InsufficientPositionException(
                    "Quantité insuffisante : disponible=" + available + ", demandé=" + quantity);
        }
        position.setFrozenQty(position.getFrozenQty() + quantity);
        log.debug("Froze {} shares of {} for user {}", quantity, symbol, userId);
        return positionRepository.save(position);
    }

    /** Libère des actions gelées (annulation d'un ordre SELL). */
    @Transactional
    public Position releaseShares(String userId, String symbol, int quantity) {
        Position position = loadForUpdate(userId, symbol);
        if (position == null) {
            return null;
        }
        int newFrozen = Math.max(0, position.getFrozenQty() - quantity);
        position.setFrozenQty(newFrozen);
        return positionRepository.save(position);
    }

    /**
     * Crée ou met à jour une position suite à un BUY exécuté.
     * Met à jour la quantité et le prix moyen pondéré.
     */
    @Transactional
    public Position creditShares(String userId, String symbol, int quantity, BigDecimal price) {
        Position position = loadForUpdate(userId, symbol);
        if (position == null) {
            position = Position.builder()
                    .userId(userId)
                    .symbol(symbol)
                    .quantity(quantity)
                    .frozenQty(0)
                    .avgPrice(price)
                    .build();
        } else {
            // prix moyen pondéré
            int totalQty = position.getQuantity() + quantity;
            BigDecimal totalCost = position.getAvgPrice()
                    .multiply(BigDecimal.valueOf(position.getQuantity()))
                    .add(price.multiply(BigDecimal.valueOf(quantity)));
            position.setAvgPrice(totalCost.divide(BigDecimal.valueOf(totalQty), 4, java.math.RoundingMode.HALF_UP));
            position.setQuantity(totalQty);
        }
        return positionRepository.save(position);
    }

    /**
     * Consomme définitivement des actions suite à un SELL exécuté :
     * on retire la quantité de "quantity" et on libère le frozen correspondant.
     */
    @Transactional
    public Position debitShares(String userId, String symbol, int quantity) {
        Position position = loadForUpdate(userId, symbol);
        if (position == null) {
            throw new InsufficientPositionException("Aucune position à débiter pour " + symbol);
        }
        int newQty = position.getQuantity() - quantity;
        int newFrozen = Math.max(0, position.getFrozenQty() - quantity);
        if (newQty < 0) {
            newQty = 0;
        }
        position.setQuantity(newQty);
        position.setFrozenQty(newFrozen);
        return positionRepository.save(position);
    }

    private PositionResponse toResponse(Position position) {
        int available = position.getQuantity() - position.getFrozenQty();
        return new PositionResponse(
                position.getUserId(),
                position.getSymbol(),
                position.getQuantity(),
                position.getFrozenQty(),
                available,
                position.getAvgPrice()
        );
    }
}

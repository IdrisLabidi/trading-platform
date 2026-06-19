package tn.utm.nainternship.portfolioservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Représente une position détenue par un trader sur un actif donné.
 *
 * Une position = (userId, symbol) → (quantity, avgPrice).
 *
 * On distingue :
 *  - quantity     : nombre total d'actions actuellement détenues.
 *  - frozenQty    : portion de la quantité réservée par des ordres SELL en attente.
 *                   Elle n'est pas revendable tant que l'ordre n'est pas exécuté
 *                   ou annulé (anti double-spending côté vendeur).
 *  - avgPrice     : prix moyen d'achat pondéré, utile pour calculer la plus-value latente.
 */
@Entity
@Table(
    name = "positions",
    uniqueConstraints = @UniqueConstraint(name = "uk_position_user_symbol", columnNames = {"user_id", "symbol"}),
    indexes = {@Index(name = "idx_position_user", columnList = "user_id")}
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Position {

    /** Identifiant technique auto-généré (UUID v4). */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Identifiant du trader propriétaire de la position. */
    @Column(name = "user_id", nullable = false)
    private String userId;

    /** Symbole de l'actif (ex: "BIAT", "SP500"). */
    @Column(name = "symbol", nullable = false)
    private String symbol;

    /** Quantité totale d'actions détenues (inclut la quantité gelée). */
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    /**
     * Quantité d'actions "gelées" pour couvrir des ordres SELL en cours.
     * Empêche un vendeur d'envoyer deux ordres de vente simultanés portant
     * sur plus d'actions qu'il n'en possède réellement.
     */
    @Column(name = "frozen_qty", nullable = false)
    private Integer frozenQty;

    /** Prix moyen d'achat pondéré (utilisé pour calculer une plus-value latente). */
    @Column(name = "avg_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal avgPrice;

    /** Verrou optimiste JPA : détecte les écritures concurrentes sur la même position. */
    @Version
    @Column(name = "version")
    private Long version;
}

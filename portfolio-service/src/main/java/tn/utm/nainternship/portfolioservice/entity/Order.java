package tn.utm.nainternship.portfolioservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.utm.nainternship.portfolioservice.model.OrderSide;
import tn.utm.nainternship.portfolioservice.model.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Représente un ordre d'achat ou de vente tel qu'enregistré localement
 * par le portfolio-service.
 *
 * Le portfolio-service agit comme un "pre-trade check" :
 *  - vérifie que le trader a suffisamment de cash (BUY) ou d'actions (SELL)
 *    via les soldes/positions ;
 *  - gèle les ressources correspondantes pour empêcher un double-spending
 *    pendant que l'ordre est acheminé vers le market-service.
 *
 * Une fois l'ordre exécuté (réception d'un trade via Kafka) ou annulé, le
 * solde / la position est mis à jour en conséquence.
 */
@Entity
@Table(
    name = "orders",
    indexes = {
        @Index(name = "idx_order_user", columnList = "user_id"),
        @Index(name = "idx_order_status", columnList = "status")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "symbol", nullable = false)
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "side", nullable = false)
    private OrderSide side;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "price", nullable = false, precision = 19, scale = 4)
    private BigDecimal price;

    /** Montant total bloqué (= price * quantity). Valable surtout côté BUY. */
    @Column(name = "frozen_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal frozenAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Version
    @Column(name = "version")
    private Long version;
}

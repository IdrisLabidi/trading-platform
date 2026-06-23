package tn.utm.nainternship.marketservice.entity;

import lombok.*;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "trades")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeEntity {
    @Id
    private String id;

    @Column(nullable = false)
    private String symbol;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buy_order_id", nullable = false)
    private OrderEntity buyOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sell_order_id", nullable = false)
    private OrderEntity sellOrder;

    private BigDecimal price;

    private int quantity;

    private Instant timestamp;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
        if (timestamp == null) timestamp = Instant.now();
    }
}


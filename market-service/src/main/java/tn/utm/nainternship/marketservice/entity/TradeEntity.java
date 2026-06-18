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

    @Column(nullable = false)
    private String buyOrderId;

    @Column(nullable = false)
    private String sellOrderId;

    private BigDecimal price;

    private int quantity;

    private Instant timestamp;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
        if (timestamp == null) timestamp = Instant.now();
    }
}


package tn.utm.nainternship.marketservice.entity;

import lombok.*;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderEntity {
    @Id
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String symbol;

    @Enumerated(EnumType.STRING)
    private Side side;

    @Enumerated(EnumType.STRING)
    private Type type;

    private BigDecimal price;

    private int quantity;

    private int remainingQty;

    @Enumerated(EnumType.STRING)
    private Status status;

    private Instant createdAt;

    public enum Side { BUY, SELL }
    public enum Type { MARKET, LIMIT }
    public enum Status { PENDING, PARTIAL, FILLED, CANCELLED }

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }
}


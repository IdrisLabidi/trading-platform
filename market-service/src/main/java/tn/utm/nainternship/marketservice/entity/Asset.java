package tn.utm.nainternship.marketservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.utm.nainternship.marketservice.dto.AssetResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assets")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true)
    private String symbol;
    private String description;
    private String name;
    @Enumerated(EnumType.STRING)
    private AssetType type;
    private String market;          // "TUNIS", "NYSE", "NASDAQ"
    private String currency;        // "TND", "USD"
    private BigDecimal lastPrice;
    private BigDecimal previousClose;
    private BigDecimal variationPercent;
    private Long quantity;
    private BigDecimal volume;
    private Long buyQuantity;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private Long sellQuantity;
    private Boolean isActive;
    private Instant listedAt;

    public enum AssetType {
        STOCK, //Action
        ETF,
        BOND, //Obligation
        FOREX
    }

    public AssetResponse toResponse() {
        return new AssetResponse(
                this.id,
                this.symbol,
                this.description,
                this.name,
                this.type,
                this.market,
                this.currency,
                this.lastPrice,
                this.previousClose,
                this.variationPercent,
                this.quantity,
                this.volume,
                this.buyQuantity,
                this.buyPrice,
                this.sellPrice,
                this.sellQuantity,
                this.isActive,
                this.listedAt
        );
    }
}

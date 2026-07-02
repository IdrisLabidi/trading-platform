package tn.utm.nainternship.marketservice.dto;

import tn.utm.nainternship.marketservice.entity.Asset;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO for {@link Asset}
 */
public record AssetResponse(
        UUID id,
        String symbol,
        String description,
        String name,
        Asset.AssetType type,
        String market,
        String currency,
        BigDecimal lastPrice,
        BigDecimal previousClose,
        BigDecimal variationPercent,
        Long quantity,
        BigDecimal volume,
        Long buyQuantity,
        BigDecimal buyPrice,
        BigDecimal sellPrice,
        Long sellQuantity,
        Boolean isActive,
        Instant listedAt
) implements Serializable {
}
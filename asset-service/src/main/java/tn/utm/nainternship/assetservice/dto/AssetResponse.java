package tn.utm.nainternship.assetservice.dto;

import tn.utm.nainternship.assetservice.model.Asset;
import tn.utm.nainternship.assetservice.model.AssetType;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO for {@link Asset}
 */
public record AssetResponse(UUID id, String symbol, String description, String name, AssetType type, String market,
                            String currency, BigDecimal lastPrice, Boolean isActive,
                            Instant listedAt) implements Serializable {
}
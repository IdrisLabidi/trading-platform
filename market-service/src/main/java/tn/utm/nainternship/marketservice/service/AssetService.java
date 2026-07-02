package tn.utm.nainternship.marketservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.utm.nainternship.marketservice.dto.MarketDataEntry;
import tn.utm.nainternship.marketservice.dto.MarketDataSnapshotResponse;
import tn.utm.nainternship.marketservice.entity.Asset;
import tn.utm.nainternship.marketservice.exception.AssetNotFoundException;
import tn.utm.nainternship.marketservice.repository.AssetRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssetService {
    private final AssetRepository assetRepository;

    public List<Asset> findAll() {
        return assetRepository.findAll();
    }

    public Asset findById(UUID id) {
        return assetRepository.findById(id).orElseThrow(() -> new AssetNotFoundException("Asset not found"));
    }

    public Asset findBySymbol(String symbol) {
        return assetRepository.findBySymbol(symbol)
                .orElseThrow(() -> new AssetNotFoundException("Asset not found"));
    }

    public Asset findBySymbolIgnoreCase(String symbol) {
        return assetRepository.findBySymbolIgnoreCase(symbol)
                .orElseThrow(() -> new AssetNotFoundException("Asset not found"));
    }

    @Transactional
    public int syncMarketData(MarketDataSnapshotResponse snapshot, String defaultMarket, String defaultCurrency) {
        if (snapshot == null || snapshot.marketData() == null || snapshot.marketData().isEmpty()) {
            return 0;
        }
        int updated = 0;
        for (MarketDataEntry entry : snapshot.marketData()) {
            if (entry == null || entry.referentiel() == null) {
                continue;
            }
            upsertFromMarketData(entry, defaultMarket, defaultCurrency);
            updated += 1;
        }
        return updated;
    }

    @Transactional
    public Asset upsertFromMarketData(MarketDataEntry entry, String defaultMarket, String defaultCurrency) {
        String symbol = resolveSymbol(entry);
        if (symbol == null || symbol.isBlank()) {
            throw new IllegalArgumentException("Market data entry is missing a ticker");
        }

        Asset asset = assetRepository.findBySymbolIgnoreCase(symbol)
                .orElseGet(Asset::new);

        boolean existing = asset.getId() != null;
        asset.setSymbol(symbol);
        asset.setName(resolveName(entry, asset));
        asset.setDescription(resolveDescription(entry, asset));
        asset.setType(existing && asset.getType() != null ? asset.getType() : Asset.AssetType.STOCK);
        asset.setMarket(resolveMarket(asset, defaultMarket));
        asset.setCurrency(resolveCurrency(asset, defaultCurrency));
        asset.setLastPrice(resolveLastPrice(entry, asset));
        asset.setPreviousClose(resolvePreviousClose(entry, asset));
        asset.setVariationPercent(resolveVariationPercent(entry, asset));
        asset.setQuantity(resolveQuantity(entry, asset));
        asset.setVolume(resolveVolume(entry, asset));
        asset.setBuyQuantity(resolveBuyQuantity(entry, asset));
        asset.setBuyPrice(resolveBuyPrice(entry, asset));
        asset.setSellPrice(resolveSellPrice(entry, asset));
        asset.setSellQuantity(resolveSellQuantity(entry, asset));
        asset.setIsActive(resolveActive(entry, asset));
        asset.setListedAt(existing && asset.getListedAt() != null ? asset.getListedAt() : Instant.now());
        return assetRepository.save(asset);
    }

    private String resolveSymbol(MarketDataEntry entry) {
        if (entry.referentiel() == null) {
            return null;
        }
        String ticker = entry.referentiel().ticker();
        return ticker == null || ticker.isBlank() ? null : ticker.toUpperCase();
    }

    private String resolveName(MarketDataEntry entry, Asset current) {
        String name = entry.referentiel() == null ? null : entry.referentiel().stockName();
        if (name != null && !name.isBlank()) {
            return name;
        }
        return current.getName() != null ? current.getName() : current.getSymbol();
    }

    private String resolveDescription(MarketDataEntry entry, Asset current) {
        if (current.getDescription() != null && !current.getDescription().isBlank()) {
            return current.getDescription();
        }
        String name = entry.referentiel() == null ? null : entry.referentiel().stockName();
        return name != null && !name.isBlank() ? name : current.getDescription();
    }

    private String resolveMarket(Asset current, String defaultMarket) {
        if (current.getMarket() != null && !current.getMarket().isBlank()) {
            return current.getMarket();
        }
        return defaultMarket;
    }

    private String resolveCurrency(Asset current, String defaultCurrency) {
        if (current.getCurrency() != null && !current.getCurrency().isBlank()) {
            return current.getCurrency();
        }
        return defaultCurrency;
    }

    private BigDecimal resolveLastPrice(MarketDataEntry entry, Asset current) {
        BigDecimal price = firstNonNull(entry.last(), entry.cmp(), entry.close(),
                entry.referentiel() == null ? null : entry.referentiel().lastAdjustedClosingPrice());
        if (price != null) {
            return price;
        }
        return current.getLastPrice() != null ? current.getLastPrice() : BigDecimal.ZERO;
    }

    private Boolean resolveActive(MarketDataEntry entry, Asset current) {
        boolean suspended = entry.state() != null
                && entry.state().phaseQualifierSet() != null
                && Boolean.TRUE.equals(entry.state().phaseQualifierSet().suspended());
        if (suspended) {
            return false;
        }
        if (current.getIsActive() != null) {
            return current.getIsActive();
        }
        return true;
    }

    private BigDecimal resolvePreviousClose(MarketDataEntry entry, Asset current) {
        BigDecimal previous = firstNonNull(entry.close(),
                entry.referentiel() == null ? null : entry.referentiel().lastAdjustedClosingPrice(),
                current.getPreviousClose());
        return previous != null ? previous : BigDecimal.ZERO;
    }

    private BigDecimal resolveVariationPercent(MarketDataEntry entry, Asset current) {
        BigDecimal variation = entry.change();
        if (variation != null) {
            return variation.divide(BigDecimal.valueOf(100));
        }
        BigDecimal previous = resolvePreviousClose(entry, current);
        BigDecimal last = resolveLastPrice(entry, current);
        if (previous.signum() == 0) {
            return BigDecimal.ZERO;
        }
        return last.subtract(previous).divide(previous, 6, java.math.RoundingMode.HALF_UP);
    }

    private Long resolveQuantity(MarketDataEntry entry, Asset current) {
        Integer quantity = firstNonNull(entry.quantity(), current.getQuantity() == null ? null : current.getQuantity().intValue());
        return quantity == null ? 0L : quantity.longValue();
    }

    private BigDecimal resolveVolume(MarketDataEntry entry, Asset current) {
        BigDecimal volume = firstNonNull(entry.caps(), current.getVolume());
        return volume != null ? volume : BigDecimal.ZERO;
    }

    private Long resolveBuyQuantity(MarketDataEntry entry, Asset current) {
        Integer buyQuantity = firstNonNull(entry.bidQty(), current.getBuyQuantity() == null ? null : current.getBuyQuantity().intValue());
        return buyQuantity == null ? 0L : buyQuantity.longValue();
    }

    private BigDecimal resolveBuyPrice(MarketDataEntry entry, Asset current) {
        BigDecimal buyPrice = firstNonNull(entry.bid(), current.getBuyPrice());
        return buyPrice != null ? buyPrice : BigDecimal.ZERO;
    }

    private BigDecimal resolveSellPrice(MarketDataEntry entry, Asset current) {
        BigDecimal sellPrice = firstNonNull(entry.ask(), current.getSellPrice());
        return sellPrice != null ? sellPrice : BigDecimal.ZERO;
    }

    private Long resolveSellQuantity(MarketDataEntry entry, Asset current) {
        Integer sellQuantity = firstNonNull(entry.askQty(), current.getSellQuantity() == null ? null : current.getSellQuantity().intValue());
        return sellQuantity == null ? 0L : sellQuantity.longValue();
    }

    @SafeVarargs
    private final <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }
}

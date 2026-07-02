package tn.utm.nainternship.marketservice.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.utm.nainternship.marketservice.dto.MarketDataEntry;
import tn.utm.nainternship.marketservice.dto.MarketDataSnapshotResponse;
import tn.utm.nainternship.marketservice.dto.MarketState;
import tn.utm.nainternship.marketservice.dto.PhaseQualifierSet;
import tn.utm.nainternship.marketservice.dto.Referentiel;
import tn.utm.nainternship.marketservice.entity.Asset;
import tn.utm.nainternship.marketservice.repository.AssetRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock
    private AssetRepository assetRepository;

    @Test
    void upsertFromMarketDataCreatesAssetWhenMissing() {
        AssetService service = new AssetService(assetRepository);
        when(assetRepository.findBySymbolIgnoreCase("AB")).thenReturn(Optional.empty());
        when(assetRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Asset asset = service.upsertFromMarketData(entry("AB", "AMEN BANK", new BigDecimal("86.90"), false), "TUNIS", "TND");

        assertEquals("AB", asset.getSymbol());
        assertEquals("AMEN BANK", asset.getName());
        assertEquals(new BigDecimal("86.90"), asset.getLastPrice());
        assertEquals("TUNIS", asset.getMarket());
        assertEquals("TND", asset.getCurrency());
        assertTrue(asset.getIsActive());
        verify(assetRepository).save(any(Asset.class));
    }

    @Test
    void upsertFromMarketDataKeepsExistingMetadataAndUpdatesPrice() {
        Asset existing = Asset.builder()
                .id(UUID.randomUUID())
                .symbol("ARTES")
                .name("ARTES")
                .description("Existing description")
                .type(Asset.AssetType.STOCK)
                .market("TUNIS")
                .currency("TND")
                .lastPrice(new BigDecimal("13.40"))
                .isActive(true)
                .listedAt(Instant.parse("2024-01-01T00:00:00Z"))
                .build();

        AssetService service = new AssetService(assetRepository);
        when(assetRepository.findBySymbolIgnoreCase("ARTES")).thenReturn(Optional.of(existing));
        when(assetRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Asset asset = service.upsertFromMarketData(entry("ARTES", "ARTES", new BigDecimal("13.79"), false), "TUNIS", "TND");

        assertEquals(existing.getId(), asset.getId());
        assertEquals(new BigDecimal("13.79"), asset.getLastPrice());
        assertEquals("Existing description", asset.getDescription());
        assertEquals(Instant.parse("2024-01-01T00:00:00Z"), asset.getListedAt());
        assertTrue(asset.getIsActive());
    }

    @Test
    void syncMarketDataSkipsEmptyPayload() {
        AssetService service = new AssetService(assetRepository);

        int updated = service.syncMarketData(new MarketDataSnapshotResponse(List.of()), "TUNIS", "TND");

        assertEquals(0, updated);
    }

    private MarketDataEntry entry(String ticker, String name, BigDecimal lastPrice, boolean suspended) {
        Referentiel referentiel = new Referentiel(
                "TN0000000000",
                1L,
                name,
                ticker,
                "11",
                10,
                null,
                1,
                0L,
                new BigDecimal("84.49")
        );
        MarketState state = new MarketState(
                1L,
                1,
                0,
                0,
                new PhaseQualifierSet(0L, false, false, false, false, suspended, false, true),
                255,
                255,
                255,
                -1,
                0,
                null,
                0,
                null,
                3,
                255
        );
        return new MarketDataEntry(
                referentiel,
                state,
                referentiel.isin(),
                referentiel.symbolIndex(),
                "130000",
                "5",
                "closed",
                "",
                " ",
                new BigDecimal("84.49"),
                BigDecimal.ZERO,
                new BigDecimal("86.90"),
                lastPrice,
                new BigDecimal("84.49"),
                new BigDecimal("2.91"),
                BigDecimal.ZERO,
                new BigDecimal("85.787"),
                1102,
                10,
                3,
                new BigDecimal("15189.31"),
                23,
                new BigDecimal("13.98"),
                new BigDecimal("13.4"),
                new BigDecimal("12.6"),
                new BigDecimal("14.2"),
                new BigDecimal("13.52"),
                new BigDecimal("14.06"),
                2,
                497,
                lastPrice,
                new BigDecimal("13.6"),
                100,
                1,
                new BigDecimal("0.0"),
                0,
                "closed",
                "5",
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0,
                0,
                0,
                BigDecimal.ZERO,
                0,
                0,
                0
        );
    }
}

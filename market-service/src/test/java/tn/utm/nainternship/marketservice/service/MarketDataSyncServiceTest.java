package tn.utm.nainternship.marketservice.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.utm.nainternship.marketservice.config.MarketDataProperties;
import tn.utm.nainternship.marketservice.dto.MarketDataEntry;
import tn.utm.nainternship.marketservice.dto.MarketDataSnapshotResponse;
import tn.utm.nainternship.marketservice.dto.MarketState;
import tn.utm.nainternship.marketservice.dto.PhaseQualifierSet;
import tn.utm.nainternship.marketservice.dto.Referentiel;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarketDataSyncServiceTest {

    @Mock
    private AssetService assetService;

    @Mock
    private MarketDataProperties properties;

    @Mock
    private org.springframework.web.client.RestTemplate restTemplate;

    @Test
    void refreshMarketDataFetchesEndpointAndSyncsCatalog() {
        when(properties.isEnabled()).thenReturn(true);
        when(properties.getEndpointUrl()).thenReturn("http://example.test/market-data");
        when(properties.getDefaultMarket()).thenReturn("TUNIS");
        when(properties.getDefaultCurrency()).thenReturn("TND");

        MarketDataSnapshotResponse snapshot = new MarketDataSnapshotResponse(
                List.of(entry("AB", "AMEN BANK", new BigDecimal("86.90"), false))
        );
        when(restTemplate.getForObject("http://example.test/market-data", MarketDataSnapshotResponse.class))
                .thenReturn(snapshot);
        when(assetService.syncMarketData(snapshot, "TUNIS", "TND")).thenReturn(1);

        MarketDataSyncService service = new MarketDataSyncService(assetService, properties, restTemplate);
        service.refreshMarketData();

        verify(restTemplate).getForObject("http://example.test/market-data", MarketDataSnapshotResponse.class);
        verify(assetService).syncMarketData(snapshot, "TUNIS", "TND");
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

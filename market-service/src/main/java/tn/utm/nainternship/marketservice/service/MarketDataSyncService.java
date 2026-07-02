package tn.utm.nainternship.marketservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import tn.utm.nainternship.marketservice.config.MarketDataProperties;
import tn.utm.nainternship.marketservice.dto.MarketDataSnapshotResponse;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketDataSyncService {
    private final AssetService assetService;
    private final MarketDataProperties properties;
    private final RestTemplate restTemplate;

    @Scheduled(fixedDelayString = "${market-data.refresh-interval-ms:60000}")
    public void refreshMarketData() {
        if (!properties.isEnabled()) {
            return;
        }
        String endpoint = properties.getEndpointUrl();
        if (endpoint == null || endpoint.isBlank()) {
            log.warn("Market data sync skipped: endpoint is not configured");
            return;
        }
        try {
            MarketDataSnapshotResponse payload = restTemplate.getForObject(endpoint, MarketDataSnapshotResponse.class);
            int updated = assetService.syncMarketData(
                    payload,
                    properties.getDefaultMarket(),
                    properties.getDefaultCurrency()
            );
            if (updated > 0) {
                log.info("Synced {} market data entries from {}", updated, endpoint);
            }
        } catch (RestClientException ex) {
            log.error("Failed to sync market data from {}", endpoint, ex);
        }
    }
}

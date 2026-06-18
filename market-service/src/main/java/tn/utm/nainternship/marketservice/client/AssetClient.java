package tn.utm.nainternship.marketservice.client;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import tn.utm.nainternship.marketservice.exception.AssetNotFoundException;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class AssetClient {
    private static final Logger log = LoggerFactory.getLogger(AssetClient.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Cacheable(value = "asset", key = "#symbol")
    public Map<String, Object> getAsset(String symbol) throws AssetNotFoundException {
        String url = String.format("http://asset-service:8084/api/assets/%s", symbol);
        try {
            Map response = restTemplate.getForObject(url, Map.class);
            if (response == null) throw new AssetNotFoundException("Unknown or inactive symbol: " + symbol);
            return response;
        } catch (HttpClientErrorException.NotFound ex) {
            throw new AssetNotFoundException("Unknown or inactive symbol: " + symbol);
        } catch (Exception ex) {
            log.error("Error calling asset-service", ex);
            throw new RuntimeException("Failed to reach asset-service: " + ex.getMessage(), ex);
        }
    }
}


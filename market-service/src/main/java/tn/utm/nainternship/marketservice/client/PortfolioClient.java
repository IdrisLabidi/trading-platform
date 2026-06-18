package tn.utm.nainternship.marketservice.client;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PortfolioClient {
    private static final Logger log = LoggerFactory.getLogger(PortfolioClient.class);
    private final RestTemplate restTemplate = new RestTemplate();

    public BigDecimal getBalance(String userId) {
        String url = String.format("http://portfolio-service:8082/api/portfolio/%s/balance", userId);
        try {
            Map resp = restTemplate.getForObject(url, Map.class);
            if (resp == null || !resp.containsKey("cashBalance")) return BigDecimal.ZERO;
            return new BigDecimal(resp.get("cashBalance").toString());
        } catch (HttpClientErrorException.NotFound ex) {
            throw new RuntimeException("Portfolio not found for user: " + userId);
        } catch (Exception ex) {
            log.error("Error calling portfolio-service", ex);
            throw new RuntimeException("Failed to reach portfolio-service: " + ex.getMessage(), ex);
        }
    }

    public int getPositionQuantity(String userId, String symbol) {
        String url = String.format("http://portfolio-service:8082/api/portfolio/%s/positions/%s", userId, symbol);
        try {
            Map resp = restTemplate.getForObject(url, Map.class);
            if (resp == null || !resp.containsKey("quantity")) return 0;
            return Integer.parseInt(resp.get("quantity").toString());
        } catch (HttpClientErrorException.NotFound ex) {
            return 0;
        } catch (Exception ex) {
            log.error("Error calling portfolio-service", ex);
            throw new RuntimeException("Failed to reach portfolio-service: " + ex.getMessage(), ex);
        }
    }

    public void freezeAmount(String userId, BigDecimal amount, String reason) {
        String url = String.format("http://portfolio-service:8082/api/portfolio/%s/freeze", userId);
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map body = Map.of("amount", amount, "reason", reason);
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception ex) {
            log.error("Error freezing amount", ex);
            throw new RuntimeException("Failed to freeze amount: " + ex.getMessage(), ex);
        }
    }

    public void freezeShares(String userId, String symbol, int quantity, String reason) {
        String url = String.format("http://portfolio-service:8082/api/portfolio/%s/freeze-shares", userId);
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map body = Map.of("symbol", symbol, "quantity", quantity, "reason", reason);
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception ex) {
            log.error("Error freezing shares", ex);
            throw new RuntimeException("Failed to freeze shares: " + ex.getMessage(), ex);
        }
    }
}


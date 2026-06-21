package tn.utm.nainternship.assetservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationsServiceClient {

    private final RestTemplate restTemplate;
    
    @Value("")
    private String notificationsServiceUrl;

    public void sendAssetPurchasedNotification(String userId, String symbol, int quantity, double price) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("symbol", symbol);
            notificationData.put("quantity", quantity);
            notificationData.put("price", price);
            
            String url = notificationsServiceUrl + "/api/notifications/asset-bought";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Asset purchased notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send asset purchased notification", e);
        }
    }

    public void sendAssetSoldNotification(String userId, String symbol, int quantity, double price) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("symbol", symbol);
            notificationData.put("quantity", quantity);
            notificationData.put("price", price);
            
            String url = notificationsServiceUrl + "/api/notifications/asset-sold";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Asset sold notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send asset sold notification", e);
        }
    }

    public void sendAssetTransferCompletedNotification(String userId, String symbol, int quantity, String fromUserId, String toUserId) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("symbol", symbol);
            notificationData.put("quantity", quantity);
            notificationData.put("fromUserId", fromUserId);
            notificationData.put("toUserId", toUserId);
            
            String url = notificationsServiceUrl + "/api/notifications/asset-transferred";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Asset transfer completed notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send asset transfer completed notification", e);
        }
    }

    public void sendAssetOperationFailedNotification(String userId, String symbol, int quantity, String reason) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("symbol", symbol);
            notificationData.put("quantity", quantity);
            notificationData.put("reason", reason);
            
            String url = notificationsServiceUrl + "/api/notifications/asset-transfer-failed";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Asset operation failed notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send asset operation failed notification", e);
        }
    }
}

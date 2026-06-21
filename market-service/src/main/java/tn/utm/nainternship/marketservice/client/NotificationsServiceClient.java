package tn.utm.nainternship.marketservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import tn.utm.nainternship.marketservice.dto.OrderRequest;
import tn.utm.nainternship.marketservice.entity.OrderEntity;
import tn.utm.nainternship.marketservice.entity.TradeEntity;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationsServiceClient {

    private final RestTemplate restTemplate;
    
    @Value("${notifications.service.url:http://localhost:8084}")
    private String notificationsServiceUrl;

    public void sendOrderExecutedNotification(String userId, OrderEntity order, TradeEntity trade) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("symbol", order.getSymbol());
            notificationData.put("quantity", trade.getQuantity());
            notificationData.put("price", trade.getPrice());
            
            String url = notificationsServiceUrl + "/api/notifications/order-executed";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Order executed notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send order executed notification", e);
        }
    }

    public void sendOrderPartiallyExecutedNotification(String userId, OrderEntity order, int filledQuantity) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("symbol", order.getSymbol());
            notificationData.put("filledQuantity", filledQuantity);
            notificationData.put("remainingQuantity", order.getRemainingQty());
            
            String url = notificationsServiceUrl + "/api/notifications/order-partially-executed";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Order partially executed notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send order partially executed notification", e);
        }
    }

    public void sendOrderRejectedNotification(String userId, OrderRequest request) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("symbol", request.getSymbol());
            notificationData.put("quantity", request.getQuantity());
            notificationData.put("price", request.getPrice());
            
            String url = notificationsServiceUrl + "/api/notifications/order-rejected";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Order rejected notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send order rejected notification", e);
        }
    }

    public void sendOrderCancelledNotification(String userId, OrderEntity order) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("symbol", order.getSymbol());
            notificationData.put("quantity", order.getQuantity());
            notificationData.put("price", order.getPrice());
            
            String url = notificationsServiceUrl + "/api/notifications/order-cancelled";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Order cancelled notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send order cancelled notification", e);
        }
    }
}

package tn.utm.nainternship.portfolioservice.client;

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

    public void sendPortfolioUpdatedNotification(String userId, double balance, String currency) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("balance", balance);
            notificationData.put("currency", currency);
            
            String url = notificationsServiceUrl + "/api/notifications/portfolio-balance-updated";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Portfolio updated notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send portfolio updated notification", e);
        }
    }

    public void sendDepositConfirmedNotification(String userId, double amount, String currency) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("amount", amount);
            notificationData.put("currency", currency);
            
            String url = notificationsServiceUrl + "/api/notifications/portfolio-deposit-confirmed";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Deposit confirmed notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send deposit confirmed notification", e);
        }
    }

    public void sendWithdrawalConfirmedNotification(String userId, double amount, String currency) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("amount", amount);
            notificationData.put("currency", currency);
            
            String url = notificationsServiceUrl + "/api/notifications/portfolio-withdrawal-confirmed";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Withdrawal confirmed notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send withdrawal confirmed notification", e);
        }
    }

    public void sendLowBalanceAlertNotification(String userId, double balance, String currency) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("userId", userId);
            notificationData.put("balance", balance);
            notificationData.put("currency", currency);
            
            String url = notificationsServiceUrl + "/api/notifications/portfolio-alert-triggered";
            ResponseEntity<String> response = restTemplate.postForEntity(url, notificationData, String.class);
            log.info("Low balance alert notification sent: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send low balance alert notification", e);
        }
    }
}

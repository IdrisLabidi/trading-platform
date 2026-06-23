package tn.utm.nainternship.marketservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tn.utm.nainternship.marketservice.dto.TradeEvent;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
@Slf4j
public class TradeEventPublisher {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final KafkaTemplate<String, String> kafkaTemplate;

    public void publish(TradeEvent te){
        try {
            String message = objectMapper.writeValueAsString(te);
            kafkaTemplate.send("trade-executed", message);
            log.info("Published trade event: {}", message);
        } catch (Exception ex) {
            log.error("Failed to publish trade event", ex);
        }
    }
}

package tn.utm.nainternship.marketservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class OrderResponse {
    private String id;
    private String status;
    private Instant createdAt;
}


package tn.utm.nainternship.marketservice.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderBookSnapshot {

    private String symbol;

    /** Best bids: sorted highest price first */
    private List<Level> bids;

    /** Best asks: sorted lowest price first */
    private List<Level> asks;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Level {
        private BigDecimal price;
        private int totalQuantity;
    }
}
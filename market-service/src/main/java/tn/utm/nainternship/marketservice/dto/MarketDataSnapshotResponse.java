package tn.utm.nainternship.marketservice.dto;

import java.util.List;

public record MarketDataSnapshotResponse(List<MarketDataEntry> marketData) {
}

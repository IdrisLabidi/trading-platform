package tn.utm.nainternship.marketservice.dto;

public record MarketState(
        Long symbolIndex,
        Integer bookState,
        Integer changeType,
        Integer orderEntryQualifier,
        PhaseQualifierSet phaseQualifierSet,
        Integer priceLimit,
        Integer quoteSpreadMultiplier,
        Integer scheduledEvent,
        Integer scheduledEventTime,
        Integer session,
        String source,
        Integer statusRaison,
        String time,
        Integer tradingPeriode,
        Integer tradingSide
) {
}

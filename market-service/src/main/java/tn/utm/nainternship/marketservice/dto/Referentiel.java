package tn.utm.nainternship.marketservice.dto;

import java.math.BigDecimal;

public record Referentiel(
        String isin,
        Long symbolIndex,
        String stockName,
        String ticker,
        String valGroup,
        Integer patternId,
        String instrumentGroupCode,
        Integer optiqSegment,
        Long numberInstrumentCirculating,
        BigDecimal lastAdjustedClosingPrice
) {
}

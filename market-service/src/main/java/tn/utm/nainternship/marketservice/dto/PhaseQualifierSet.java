package tn.utm.nainternship.marketservice.dto;

public record PhaseQualifierSet(
        Long psymbolIndex,
        Boolean noQualifie,
        Boolean callBBOOnly,
        Boolean tradingAtLast,
        Boolean randomUncrossing,
        Boolean suspended,
        Boolean wholesaleAllowed,
        Boolean empty
) {
}

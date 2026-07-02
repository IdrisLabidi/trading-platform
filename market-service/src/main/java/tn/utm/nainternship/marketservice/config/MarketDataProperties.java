package tn.utm.nainternship.marketservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "market-data")
public class MarketDataProperties {
    private boolean enabled = true;
    private String endpointUrl = "http://localhost:8085/api/market-data";
    private long refreshIntervalMs = 60_000L;
    private String defaultMarket = "TUNIS";
    private String defaultCurrency = "TND";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getEndpointUrl() {
        return endpointUrl;
    }

    public void setEndpointUrl(String endpointUrl) {
        this.endpointUrl = endpointUrl;
    }

    public long getRefreshIntervalMs() {
        return refreshIntervalMs;
    }

    public void setRefreshIntervalMs(long refreshIntervalMs) {
        this.refreshIntervalMs = refreshIntervalMs;
    }

    public String getDefaultMarket() {
        return defaultMarket;
    }

    public void setDefaultMarket(String defaultMarket) {
        this.defaultMarket = defaultMarket;
    }

    public String getDefaultCurrency() {
        return defaultCurrency;
    }

    public void setDefaultCurrency(String defaultCurrency) {
        this.defaultCurrency = defaultCurrency;
    }
}

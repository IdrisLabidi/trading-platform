package tn.utm.nainternship.portfolioservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Configuration du client HTTP synchrone utilisé pour interroger le market-service.
 *
 * Spring Framework 6 expose RestClient, une API fluide et synchrone qui remplace
 * progressivement RestTemplate. Ici on construit un client préconfiguré avec
 * l'URL de base du market-service (injectée via la propriété
 * "market-service.base-url" du application.yaml), ce qui évite de la répéter
 * à chaque appel et facilite la testabilité (on peut mocker le bean).
 *
 * Communication inter-services : dans une architecture microservices, chaque
 * service expose ses APIs via le nom de service Docker (market-service).
 */
@Configuration
public class MarketClientConfig {

    /**
     * Construit un RestClient pointant vers le market-service.
     * L'URL de base est lue depuis application.yaml :
     *   market-service.base-url=http://market-service:8081
     */
    @Bean
    public RestClient marketRestClient(@Value("${market-service.base-url}") String baseUrl) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }
}

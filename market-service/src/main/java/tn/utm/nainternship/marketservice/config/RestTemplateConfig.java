package tn.utm.nainternship.marketservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import tn.utm.nainternship.marketservice.client.SecurityContextTokenInterceptor;

import java.util.Collections;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();

        restTemplate.setInterceptors(
                Collections.singletonList(new SecurityContextTokenInterceptor())
        );

        return restTemplate;
    }
}

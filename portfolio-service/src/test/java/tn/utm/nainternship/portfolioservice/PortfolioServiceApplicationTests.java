package tn.utm.nainternship.portfolioservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Smoke test du contexte Spring.
 *
 * On désactive ici la résolution des paramètres OAuth2/JPA pour éviter que le
 * test d'intégration ne tente de joindre Keycloak/PostgreSQL. Les tests
 * métier plus fins (compte, position, ordre) seront ajoutés ultérieurement.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration,org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration"
})
class PortfolioServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}

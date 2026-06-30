package tn.utm.nainternship.portfolioservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Configuration de sécurité Spring Security pour le portfolio-service.
 *
 * Le service agit en tant que "Resource Server" OAuth2 : il valide les JWT
 * émis par Keycloak pour chaque requête entrante. Comme pour l'asset-service,
 * les rôles sont extraits de la claim imbriquée "realm_access.roles" du token
 * et préfixés par "ROLE_" pour s'intégrer proprement avec hasRole(...).
 *
 * Toutes les routes /api/portfolio/** nécessitent d'être authentifié
 * avec un token valide, ce qui garantit qu'un utilisateur ne peut consulter
 * ou modifier que son propre portefeuille (vérification effectuée dans
 * les services à partir du sujet du JWT).
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())

                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Les routes d'actuator éventuelles (health) peuvent rester ouvertes
                        .requestMatchers("/actuator/health").permitAll()
                        // Tout le reste du portefeuille est protégé par JWT
                        .requestMatchers("/api/portfolio/**").hasRole("trader")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt ->
                        jwt.jwtAuthenticationConverter(jwtAuthConverter())
                ))
                .csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }

    /**
     * Convertit les claims Keycloak en autorités Spring Security.
     *
     * Keycloak stocke les rôles dans realm_access.roles. Spring attend des
     * autorités préfixées par "ROLE_". Cette méthode fait le pont.
     */
    private JwtAuthenticationConverter jwtAuthConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess == null || !realmAccess.containsKey("roles")) {
                return Collections.emptyList();
            }

            @SuppressWarnings("unchecked")
            Collection<String> roles = (Collection<String>) realmAccess.get("roles");

            return roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());
        });

        return converter;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("http://localhost:4200")
        );

        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setExposedHeaders(
                List.of("Authorization")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}

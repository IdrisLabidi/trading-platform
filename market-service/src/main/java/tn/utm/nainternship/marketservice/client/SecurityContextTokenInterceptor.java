package tn.utm.nainternship.marketservice.client;

import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.io.IOException;

public class SecurityContextTokenInterceptor implements ClientHttpRequestInterceptor {


    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        // 1. Get the current authentication from Spring Security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // 2. Check if the authentication principal is an instance of Jwt
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String tokenValue = jwt.getTokenValue();

            // 3. Inject the Bearer token into the Authorization header
            request.getHeaders().setBearerAuth(tokenValue);
        }

        // 4. Continue the request execution
        return execution.execute(request, body);
    }
}

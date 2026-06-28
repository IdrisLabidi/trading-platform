# Guide de démarrage — Plateforme de négociation boursière (microservices)

Stack : **Spring Boot** (services métier) · **Express.js** (notifications temps réel) · **Keycloak** (auth/SSO) · **Angular** (frontend) · **PostgreSQL/Redis** (bases de données) · **Docker Compose**

---

## Étape 0 — Structure du projet (monorepo)

```
trading-platform/
├── docker-compose.yml
├── auth/                     # config Keycloak (realm export)
├── asset-service/            # Spring Boot - référentiel des actifs
├── market-service/           # Spring Boot - carnet d'ordres
├── portfolio-service/        # Spring Boot - portefeuilles
├── notification-service/     # Express.js - WebSocket
└── frontend/                  # Angular
```

Chaque dossier de service contient son propre `Dockerfile`. Un seul `docker-compose.yml` à la fois (dev et prod) à la racine orchestre tout.

---

## Étape 1 — Keycloak (authentification centralisée)

Keycloak remplace votre `auth-service` custom : il gère les utilisateurs, les rôles, et émet des tokens JWT que tous les autres services valident.

### 1.1 Lancer Keycloak

Ajoutez ceci dans `docker-compose.yml` :

```yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:25.0
    command: start-dev
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
    ports: ["8080:8080"]
    depends_on: [keycloak-db]

  keycloak-db:
    image: postgres:16
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes: [keycloak_data:/var/lib/postgresql/data]

volumes:
  keycloak_data:
```

Démarrez : `docker compose up keycloak keycloak-db` puis ouvrez `http://localhost:8080` (login `admin`/`admin`).

### 1.2 Créer le realm et le client

1. Créez un **realm** : `trading-platform`
2. Créez un **client** pour Angular :
   - Client ID : `trading-frontend`
   - Client type : `OpenID Connect`
   - Authentication flow : `Standard flow` (Authorization Code)
   - Valid redirect URIs : `http://localhost:4200/*`
   - Web origins : `http://localhost:4200`
3. Créez un **client confidentiel** pour les appels machine-à-machine (optionnel pour la semaine 2) : `trading-backend` avec `Client authentication: On`
4. Créez des **rôles** : `trader`, `admin`
5. Créez un **utilisateur de test** (ex: `youssef`), définissez un mot de passe, assignez-lui le rôle `trader`

> **Astuce :** exportez le realm (`Realm settings → Action → Partial export`) et placez le JSON dans `auth/realm-export.json`. Vous pourrez l'importer automatiquement au démarrage avec `--import-realm`, ce qui évite de tout reconfigurer à chaque `docker compose down -v`.

---

## Étape 2 — `market-service` (Spring Boot)

C'est le cœur du système : carnet d'ordres + matching engine.

### 2.1 Générer le projet

Allez sur [start.spring.io](https://start.spring.io) (ou utilisez IntelliJ) avec :

- **Project** : Gradle
- **Language** : Java 
- **Dependencies** :
  ```
  plugins {
    id 'java'
    id 'org.springframework.boot' version '4.1.0'
    id 'io.spring.dependency-management' version '1.1.7'
    }
    
    group = 'tn.utm.na-internship'
    version = '0.0.1-SNAPSHOT'
    description = 'market-service'
    
    java {
    toolchain {
    languageVersion = JavaLanguageVersion.of(26)
    }
    }
    
    repositories {
    mavenCentral()
    }
    
    dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-kafka'
    implementation 'org.springframework.boot:spring-boot-starter-security-oauth2-resource-server'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    runtimeOnly 'org.postgresql:postgresql'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    implementation 'org.mapstruct:mapstruct:1.5.5.Final'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.5.5.Final'
    testImplementation 'org.springframework.boot:spring-boot-starter-data-jpa-test'
    testImplementation 'org.springframework.boot:spring-boot-starter-data-redis-test'
    testImplementation 'org.springframework.boot:spring-boot-starter-kafka-test'
    testImplementation 'org.springframework.boot:spring-boot-starter-security-oauth2-resource-server-test'
    testImplementation 'org.springframework.boot:spring-boot-starter-validation-test'
    testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
    testCompileOnly 'org.projectlombok:lombok'
    testAnnotationProcessor 'org.projectlombok:lombok'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
    }
  ```

### 2.2 Configurer la base de données

`src/main/resources/application.yml` :

```yaml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:postgresql://market-db:5432/marketdb
    username: market
    password: market
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
  data:
    redis:
      host: redis
      port: 6379
  kafka:
    bootstrap-servers: kafka:9092

  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://keycloak:8080/realms/trading-platform
```

### 2.3 Sécuriser les endpoints avec Keycloak

`SecurityConfig.java` :

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/market/quotes/**").permitAll() // cours publics
                .requestMatchers("/api/market/orders/**").hasRole("trader")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt ->
                jwt.jwtAuthenticationConverter(jwtAuthConverter())
            ))
            .csrf(csrf -> csrf.disable());
        return http.build();
    }

    private JwtAuthenticationConverter jwtAuthConverter() {
        var grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
        grantedAuthoritiesConverter.setAuthoritiesClaimName("realm_access.roles");

        var converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return converter;
    }
}
```

> Keycloak place les rôles dans `realm_access.roles` du JWT — c'est pourquoi le converter ci-dessus va chercher cette claim spécifique.

### 2.4 Modèles de données (entités JPA)

\trading-platform\market-service\src\main\java\tn\utm\nainternship\marketservice\dto\OrderDetailsResponse.java
\trading-platform\market-service\src\main\java\tn\utm\nainternship\marketservice\dto\OrderRequest.java
\trading-platform\market-service\src\main\java\tn\utm\nainternship\marketservice\dto\OrderResponse.java
\trading-platform\market-service\src\main\java\tn\utm\nainternship\marketservice\dto\OrderUpdateRequest.java
\trading-platform\market-service\src\main\java\tn\utm\nainternship\marketservice\dto\TradeEvent.java

### 2.5 Le carnet d'ordres en mémoire (Redis ou structures Java)

Pour démarrer simplement (avant d'optimiser avec Redis), gardez le carnet en mémoire avec des `TreeMap` :

```java
@Service
public class OrderBookService {
    // clé = prix, valeur = file FIFO des ordres à ce prix
    private final NavigableMap<BigDecimal, Deque<Order>> bids =
        new TreeMap<>(Collections.reverseOrder()); // prix décroissant
    private final NavigableMap<BigDecimal, Deque<Order>> asks =
        new TreeMap<>(); // prix croissant

    public List<Trade> submit(Order order) {
        List<Trade> trades = new ArrayList<>();
        var book = order.getSide() == OrderSide.BUY ? asks : bids;
        var ownBook = order.getSide() == OrderSide.BUY ? bids : asks;

        while (order.getRemainingQty() > 0 && !book.isEmpty()) {
            var bestEntry = book.firstEntry();
            boolean priceMatches = order.getType() == OrderType.MARKET
                || (order.getSide() == OrderSide.BUY && order.getPrice().compareTo(bestEntry.getKey()) >= 0)
                || (order.getSide() == OrderSide.SELL && order.getPrice().compareTo(bestEntry.getKey()) <= 0);

            if (!priceMatches) break;

            var queue = bestEntry.getValue();
            var counterOrder = queue.peekFirst();
            int fillQty = Math.min(order.getRemainingQty(), counterOrder.getRemainingQty());

            trades.add(createTrade(order, counterOrder, bestEntry.getKey(), fillQty));

            order.setRemainingQty(order.getRemainingQty() - fillQty);
            counterOrder.setRemainingQty(counterOrder.getRemainingQty() - fillQty);

            if (counterOrder.getRemainingQty() == 0) queue.pollFirst();
            if (queue.isEmpty()) book.pollFirstEntry();
        }

        if (order.getRemainingQty() > 0 && order.getType() == OrderType.LIMIT) {
            ownBook.computeIfAbsent(order.getPrice(), k -> new ArrayDeque<>()).addLast(order);
        }
        return trades;
    }
}
```

### 2.6 Publier les trades sur Kafka

```java
@Service
public class TradeEventPublisher {
    private final KafkaTemplate<String, TradeEvent> kafkaTemplate;

    public void publish(Trade trade) {
        kafkaTemplate.send("trade-executed", trade.getSymbol(),
            new TradeEvent(trade.getId(), trade.getSymbol(), trade.getPrice(), trade.getQuantity()));
    }
}
```

### 2.7 Contrôleur REST
\trading-platform\market-service\src\main\java\tn\utm\nainternship\marketservice\controller\OrderController.java

---

## Étape 3 — `portfolio-service` (Spring Boot)

Même squelette que `market-service`, mais :

- Base de données dédiée : `portfoliodb` (PostgreSQL)
- Consomme `trade-executed` depuis Kafka pour mettre à jour les positions

### 3.1 Entités

\trading-platform\portfolio-service\src\main\java\tn\utm\nainternship\portfolioservice\entity\Account.java
\trading-platform\portfolio-service\src\main\java\tn\utm\nainternship\portfolioservice\entity\Position.java

### 3.2 Consumer Kafka

\trading-platform\portfolio-service\src\main\java\tn\utm\nainternship\portfolioservice\kafka\TradeEventListener.java

### 3.3 application.yml

Identique au market-service, mais avec :

```yaml
server:
  port: 8082
spring:
  datasource:
    url: jdbc:postgresql://portfolio-db:5432/portfoliodb
    username: portfolio
    password: portfolio
  kafka:
    consumer:
      group-id: portfolio-service
      auto-offset-reset: earliest
```

---

## Étape 4 — `notification-service` (Express.js)

Reçoit les événements Kafka et les pousse aux clients via WebSocket.

### 4.1 Initialiser le projet

```bash
mkdir notification-service && cd notification-service
npm init -y
npm install express ws kafkajs jsonwebtoken jwks-rsa cors
```

### 4.2 Structure

```
notification-service/
├── app.js
├── kafka
    ├── consumer.js
    └── kafka_event_publisher.js
├── notifications.js
└── Dockerfile
```

### 4.3 Validation du token Keycloak (`auth.js`)

```javascript
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const client = jwksClient({
  jwksUri: 'http://keycloak:8080/realms/trading-platform/protocol/openid-connect/certs'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    callback(null, key.getPublicKey());
  });
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) reject(err); else resolve(decoded);
    });
  });
}

module.exports = { verifyToken };
```

### 4.4 Serveur WebSocket (`notifications.js`)
\trading-platform\notifications-service\notifications.js

### 4.5 Consumer Kafka (`kafka/consumer.js`)
\trading-platform\notifications-service\kafka/consumer.js

### 4.6 Point d'entrée (`app.js`)
\trading-platform\notifications-service\app.js

---

## Étape 5 — Angular (frontend)

### 5.1 Créer le projet

```bash
npm install -g @angular/cli
ng new frontend --routing --style=scss
cd frontend
ng add @angular-architects/oauth2-oidc  # ou keycloak-angular
npm install keycloak-js keycloak-angular lightweight-charts
```

### 5.2 Configurer Keycloak (`app.config.ts`)

```typescript
import { provideKeycloak, withAutoRefreshToken, AutoRefreshTokenService, UserActivityService } from 'keycloak-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKeycloak({
      config: {
        url: 'http://localhost:8080',
        realm: 'trading-platform',
        clientId: 'trading-frontend'
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
      },
      features: [
        withAutoRefreshToken({
          onInactivityTimeout: 'logout',
          sessionTimeout: 60000
        })
      ],
      providers: [AutoRefreshTokenService, UserActivityService]
    })
  ]
};
```

### 5.3 Intercepteur HTTP — ajout automatique du token

```typescript
import { includeBearerTokenInterceptor, INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG } from 'keycloak-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: {
        bearerPrefix: 'Bearer',
        shouldAddToken: (request) => request.url.startsWith('http://localhost:808')
      }
    }
  ]
};
```

### 5.4 Service pour appeler `market-service`

```typescript
@Injectable({ providedIn: 'root' })
export class MarketService {
  private baseUrl = 'http://localhost:8081/api/market';
  constructor(private http: HttpClient) {}

  submitOrder(order: OrderRequest) {
    return this.http.post(`${this.baseUrl}/orders`, order);
  }

  getOrderBook(symbol: string) {
    return this.http.get<OrderBookSnapshot>(`${this.baseUrl}/orderbook/${symbol}`);
  }
}
```

### 5.5 Connexion WebSocket au `notification-service`

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private socket?: WebSocket;

  connect(token: string) {
    this.socket = new WebSocket(`ws://localhost:8083?token=${token}`);
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // mettre à jour le graphique / le carnet en temps réel
    };
  }

  subscribe(symbol: string) {
    this.socket?.send(JSON.stringify({ action: 'subscribe', symbol }));
  }
}
```

---

## Étape 6 — `docker-compose.yml` complet

```yaml
services:
  # ── Infrastructure ──
  keycloak:
    image: quay.io/keycloak/keycloak:25.0
    command: start-dev --import-realm
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
    volumes:
      - ./auth/realm-export.json:/opt/keycloak/data/import/realm-export.json
    ports: ["8080:8080"]
    depends_on: [keycloak-db]

  keycloak-db:
    image: postgres:16
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes: [keycloak_data:/var/lib/postgresql/data]

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    depends_on: [zookeeper]
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports: ["9092:9092"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  # ── Bases de données par service ──
  market-db:
    image: postgres:16
    environment:
      POSTGRES_DB: marketdb
      POSTGRES_USER: market
      POSTGRES_PASSWORD: market
    volumes: [market_data:/var/lib/postgresql/data]

  portfolio-db:
    image: postgres:16
    environment:
      POSTGRES_DB: portfoliodb
      POSTGRES_USER: portfolio
      POSTGRES_PASSWORD: portfolio
    volumes: [portfolio_data:/var/lib/postgresql/data]

  # ── Microservices ──
  market-service:
    build: ./market-service
    ports: ["8081:8081"]
    depends_on: [market-db, kafka, redis, keycloak]

  portfolio-service:
    build: ./portfolio-service
    ports: ["8082:8082"]
    depends_on: [portfolio-db, kafka, keycloak]

  notification-service:
    build: ./notification-service
    ports: ["8083:8083"]
    depends_on: [kafka, keycloak]

  # ── Frontend ──
  frontend:
    build: ./frontend
    ports: ["4200:80"]
    depends_on: [market-service, portfolio-service]

volumes:
  keycloak_data:
  market_data:
  portfolio_data:
```

---

## Étape 7 — `asset-service` (Spring Boot)

L'`asset-service` est le **référentiel central des actifs financiers** (actions, ETF, obligations). Tous les autres services le consultent pour valider qu'un symbole existe avant de créer un ordre ou une position. Il est donc à développer en premier, juste après Keycloak.

### 7.1 Dépendances (`start.spring.io`)

Identiques au `market-service`

### 7.2 Base de données dédiée : `assetdb`

```yaml
# à ajouter dans docker-compose.yml
asset-db:
  image: postgres:16
  environment:
    POSTGRES_DB: assetdb
    POSTGRES_USER: asset
    POSTGRES_PASSWORD: asset
  volumes: [asset_data:/var/lib/postgresql/data]
```

### 7.3 Entité principale
D:\IGL3 - D desk\Stage_d_ete\trading-platform\asset-service\src\main\java\tn\utm\nainternship\assetservice\model\Asset.java

### 7.4 Repository et service
\trading-platform\asset-service\src\main\java\tn\utm\nainternship\assetservice\Repository\AssetRepository.java
\trading-platform\asset-service\src\main\java\tn\utm\nainternship\assetservice\Service\AssetService.java

### 7.5 Contrôleur REST
\trading-platform\asset-service\src\main\java\tn\utm\nainternship\assetservice\controller\AssetController.java

### 7.6 Données initiales (seed)

Créez `src/main/resources/data.sql` pour peupler la base au démarrage :

```sql
INSERT INTO assets (symbol, type, name, market, currency, last_price, is_active, listed_at)
VALUES
  ('BIAT',   'STOCK', 'Banque Internationale Arabe de Tunisie', 'TUNIS', 'TND', 145.00, true, NOW()),
  ('ATB',    'STOCK', 'Arab Tunisian Bank',                     'TUNIS', 'TND',  22.50, true, NOW()),
  ('SFBT',   'STOCK', 'Société de Fabrication des Boissons',    'TUNIS', 'TND',  18.30, true, NOW()),
  ('TUN-ETF','ETF',   'ETF Tunindex 20',                        'TUNIS', 'TND',  98.00, true, NOW()),
  ('SP500',  'ETF',   'S&P 500 ETF',                            'NYSE',  'USD', 520.00, true, NOW())
ON CONFLICT (symbol) DO NOTHING;
```

### 7.7 Validation dans `market-service`

Le `market-service` appelle l'`asset-service` avant d'accepter un ordre pour vérifier que le symbole existe et est actif :

```java
@Service
public class AssetValidationClient {
    private final RestTemplate restTemplate;

    public void validateSymbol(String symbol) {
        try {
            restTemplate.getForObject(
                "http://asset-service:8084/api/assets/{symbol}", Asset.class, symbol);
        } catch (HttpClientErrorException.NotFound e) {
            throw new InvalidOrderException("Actif inconnu ou inactif : " + symbol);
        }
    }
}
```

### 7.8 Ajouter au `docker-compose.yml`

```yaml
asset-service:
  build: ./asset-service
  ports: ["8084:8084"]
  depends_on: [asset-db, keycloak]

asset-db:
  image: postgres:16
  environment:
    POSTGRES_DB: assetdb
    POSTGRES_USER: asset
    POSTGRES_PASSWORD: asset
  volumes: [asset_data:/var/lib/postgresql/data]
```

Et ajoutez `asset_data:` dans la section `volumes:` racine.

---

## Étape 8 — Ordre de développement recommandé

1. **Keycloak** : configurer realm, client, rôles, utilisateur de test → vérifier qu'on récupère un token via `curl`
2. **asset-service** : entités + seed SQL → endpoints CRUD actifs → tester avec Postman (liste des actifs sans auth, création avec rôle `admin`)
3. **market-service** : entités JPA → validation symbole via `asset-service` → endpoint `/orderbook` sans matching → tester avec Postman + token
4. **Matching engine** : implémenter `OrderBookService`, tester en local avec des appels Postman successifs
5. **Kafka** : publier `trade-executed` depuis `market-service` → vérifier avec `kafka-console-consumer`
6. **portfolio-service** : consumer Kafka + endpoints de consultation
7. **notification-service** : WebSocket + validation token + consumer Kafka
8. **Angular** : login Keycloak → dashboard actifs → carnet d'ordres → intégration WebSocket + lightweight-charts

---

## Vérifications rapides (commandes utiles)

```bash
# Obtenir un token Keycloak (test rapide sans Angular)
curl -X POST http://localhost:8080/realms/trading-platform/protocol/openid-connect/token \
  -d "client_id=trading-frontend" \
  -d "username=youssef" \
  -d "password=motdepasse" \
  -d "grant_type=password"

# Vérifier les topics Kafka
docker exec -it trading-platform-kafka-1 kafka-topics --list --bootstrap-server localhost:9092

# Suivre les logs d'un service
docker compose logs -f market-service
```

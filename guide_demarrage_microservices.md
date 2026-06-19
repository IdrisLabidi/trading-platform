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

- **Project** : Maven
- **Language** : Java 21
- **Dependencies** :
  - `Spring Web`
  - `Spring Data JPA`
  - `PostgreSQL Driver`
  - `Spring for Apache Kafka`
  - `OAuth2 Resource Server` (intégration Keycloak)
  - `Validation`
  - `Spring Data Redis` (pour le carnet d'ordres en mémoire)

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

### 2.4 Modèle de données (entités JPA)

```java
@Entity
@Table(name = "orders")
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String userId;       // sub du token Keycloak
    private String symbol;        // ex: "ABC"
    private OrderSide side;       // BUY / SELL
    private OrderType type;       // MARKET / LIMIT
    private BigDecimal price;
    private Integer quantity;
    private Integer remainingQty;
    private OrderStatus status;   // PENDING / PARTIAL / FILLED / CANCELLED
    private Instant createdAt;
}

@Entity
@Table(name = "trades")
public class Trade {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String symbol;
    private BigDecimal price;
    private Integer quantity;
    private UUID buyOrderId;
    private UUID sellOrderId;
    private Instant executedAt;
}
```

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

```java
@RestController
@RequestMapping("/api/market")
public class OrderController {

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> submitOrder(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid OrderRequest request) {
        String userId = jwt.getSubject();
        Order order = orderService.submit(userId, request);
        return ResponseEntity.ok(toResponse(order));
    }

    @GetMapping("/orderbook/{symbol}")
    public OrderBookSnapshot getOrderBook(@PathVariable String symbol) {
        return orderBookService.snapshot(symbol);
    }
}
```

---

## Étape 3 — `portfolio-service` (Spring Boot)

Même squelette que `market-service`, mais :

- Base de données dédiée : `portfoliodb` (PostgreSQL)
- Consomme `trade-executed` depuis Kafka pour mettre à jour les positions

### 3.1 Entités

```java
@Entity
@Table(name = "accounts")
public class Account {
    @Id
    private String userId; // sub Keycloak
    private BigDecimal cashBalance;
}

@Entity
@Table(name = "positions")
public class Position {
    @Id @GeneratedValue
    private Long id;
    private String userId;
    private String symbol;
    private Integer quantity;
    private BigDecimal avgPrice;
}
```

### 3.2 Consumer Kafka

```java
@Component
public class TradeEventListener {

    @KafkaListener(topics = "trade-executed", groupId = "portfolio-service")
    public void onTradeExecuted(TradeEvent event) {
        // 1. Récupérer la position existante (ou la créer)
        // 2. Mettre à jour quantity et avgPrice (moyenne pondérée)
        // 3. Débiter/créditer le cashBalance
        positionRepository.save(updatedPosition);
    }
}
```

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
├── server.js
├── kafkaConsumer.js
├── wsServer.js
└── auth.js
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

### 4.4 Serveur WebSocket (`wsServer.js`)

```javascript
const WebSocket = require('ws');
const { verifyToken } = require('./auth');

function createWsServer(server) {
  const wss = new WebSocket.Server({ server });
  const clientsBySymbol = new Map(); // symbol -> Set<ws>

  wss.on('connection', async (ws, req) => {
    const token = new URL(req.url, 'http://x').searchParams.get('token');
    try {
      const user = await verifyToken(token);
      ws.userId = user.sub;
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    ws.on('message', (msg) => {
      const { action, symbol } = JSON.parse(msg);
      if (action === 'subscribe') {
        if (!clientsBySymbol.has(symbol)) clientsBySymbol.set(symbol, new Set());
        clientsBySymbol.get(symbol).add(ws);
      }
    });

    ws.on('close', () => {
      clientsBySymbol.forEach(set => set.delete(ws));
    });
  });

  return {
    broadcast(symbol, payload) {
      const clients = clientsBySymbol.get(symbol);
      if (!clients) return;
      const message = JSON.stringify(payload);
      clients.forEach(ws => ws.readyState === WebSocket.OPEN && ws.send(message));
    }
  };
}

module.exports = createWsServer;
```

### 4.5 Consumer Kafka (`kafkaConsumer.js`)

```javascript
const { Kafka } = require('kafkajs');

function startKafkaConsumer(wsServer) {
  const kafka = new Kafka({ clientId: 'notification-service', brokers: ['kafka:9092'] });
  const consumer = kafka.consumer({ groupId: 'notification-service' });

  return (async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'trade-executed', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value.toString());
        wsServer.broadcast(event.symbol, { type: 'trade', ...event });
      }
    });
  })();
}

module.exports = startKafkaConsumer;
```

### 4.6 Point d'entrée (`server.js`)

```javascript
const express = require('express');
const http = require('http');
const cors = require('cors');
const createWsServer = require('./wsServer');
const startKafkaConsumer = require('./kafkaConsumer');

const app = express();
app.use(cors());
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const server = http.createServer(app);
const wsServer = createWsServer(server);
startKafkaConsumer(wsServer);

server.listen(8083, () => console.log('notification-service on :8083'));
```

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

Identiques au `market-service` :
`Spring Web` · `Spring Data JPA` · `PostgreSQL Driver` · `OAuth2 Resource Server` · `Validation` · `Spring Cache` (pour mettre les actifs en cache Redis et éviter des appels répétés)

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

```java
@Entity
@Table(name = "assets")
public class Asset {
    @Id
    private String symbol;          // ex: "ABC", "TUN10", "SP500-ETF"

    @Enumerated(EnumType.STRING)
    private AssetType type;         // STOCK, ETF, BOND, FOREX

    private String name;            // "Attijari Bank"
    private String description;
    private String market;          // "TUNIS", "NYSE", "NASDAQ"
    private String currency;        // "TND", "USD"
    private BigDecimal lastPrice;
    private Boolean isActive;
    private Instant listedAt;
}

public enum AssetType { STOCK, ETF, BOND, FOREX }
```

### 7.4 Repository et service

```java
public interface AssetRepository extends JpaRepository<Asset, String> {
    List<Asset> findByTypeAndIsActiveTrue(AssetType type);
    List<Asset> findByMarketAndIsActiveTrue(String market);
    boolean existsBySymbolAndIsActiveTrue(String symbol);
}

@Service
@CacheConfig(cacheNames = "assets")
public class AssetService {

    @Cacheable(key = "#symbol")
    public Asset getBySymbol(String symbol) {
        return assetRepository.findById(symbol)
            .orElseThrow(() -> new AssetNotFoundException("Actif inconnu : " + symbol));
    }

    @Cacheable(key = "#type")
    public List<Asset> getByType(AssetType type) {
        return assetRepository.findByTypeAndIsActiveTrue(type);
    }
}
```

### 7.5 Contrôleur REST

```java
@RestController
@RequestMapping("/api/assets")
public class AssetController {

    @GetMapping
    public List<Asset> list(@RequestParam(required = false) AssetType type) {
        return type != null ? assetService.getByType(type) : assetService.getAll();
    }

    @GetMapping("/{symbol}")
    public Asset getOne(@PathVariable String symbol) {
        return assetService.getBySymbol(symbol);
    }

    // Endpoint réservé aux admins pour créer/désactiver un actif
    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Asset> create(@RequestBody @Valid AssetRequest request) {
        return ResponseEntity.status(201).body(assetService.create(request));
    }

    @DeleteMapping("/{symbol}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Void> deactivate(@PathVariable String symbol) {
        assetService.deactivate(symbol);
        return ResponseEntity.noContent().build();
    }
}
```

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

# AGENTS.md - trading-platform

Ce fichier retrace les modifications importantes apportées au projet, afin
que d'autres agents IA (ou un humain) puissent rapidement comprendre l'état
courant du dépôt.

## Résumé des modifications

- 2026-06-17 : Conversion de AGENTS.md depuis UTF-16 vers UTF-8 sans BOM pour
  respecter l'encodage commun du projet et éviter les caractères illisibles
  dans les outils Git, Docker et les éditeurs de code.
- 2026-06-18 : Refactor du **portfolio-service** (Spring Boot 4.1 / Java 17) :
  - Adoption de **Lombok** sur toutes les entités, DTOs et services
    (`@Data`, `@Builder`, `@NoArgsConstructor`, `@RequiredArgsConstructor`).
  - Mise en place d'entités JPA `Account`, `Position` et `Order` avec
    champs "gelés" (`frozenBalance`, `frozenQty`, `frozenAmount`) pour
    empêcher le **double-spending** lors de la création d'ordres BUY/SELL.
  - Ajout de verrous pessimistes (`SELECT FOR UPDATE`) côté
    `AccountRepository` et `PositionRepository` pour sérialiser les écritures
    concurrentes sur les soldes et positions.
  - Implémentation d'un client HTTP **synchrone** (`RestClient`) vers le
    `market-service` (`MarketServiceClient`) qui vérifie, lors d'un ordre BUY,
    la cohérence du prix saisi avec le dernier cours de marché.
  - Nouveaux endpoints REST sous `/api/portfolio` :
      - `GET  /api/portfolio/{userId}/balance` (solde cash + frozen + disponible)
      - `GET  /api/portfolio/{userId}/positions/{symbol}` (quantité d'actions)
      - `GET  /api/portfolio/{userId}/positions` (toutes les positions)
      - `POST /api/portfolio/{userId}/orders` (création BUY/SELL avec gel)
      - `DELETE /api/portfolio/{userId}/orders/{orderId}` (annulation)
    Chaque endpoint vérifie que `userId` du chemin correspond à la claim
    `sub` du JWT Keycloak (`SecurityConfig`).
  - Gestion centralisée des erreurs via `GlobalExceptionHandler`
    (`ApiErrorResponse` uniforme).
  - Configuration externalisée : `application.yaml` (DB Postgres, Keycloak,
    URL du market-service, port 8082).
  - Mise à jour du `Dockerfile` (multi-stage Gradle/Corretto, user non-root)
    et alignement avec le pattern déjà utilisé par `asset-service`.
  - Le `KafkaConsumerConfig` initialement squelette a été supprimé car il
    référençait des classes inexistantes ; il sera réintroduit lorsque le
    topic `trade-executed` sera réellement consommé pour mettre à jour les
    positions après exécution d'un trade côté market-service.
- 2026-06-19 : Refactor du **notifications-service** (Node.js 18 / Express 4) :
  - Adoption de `dotenv` pour la gestion des variables d'environnement
    (fichier `.env`).
  - Utilisation de `nodemailer` pour l'envoi d'e-mails, avec une configuration
    conditionnelle selon l'environnement (`development` vs `production`).
  - Implémentation de Socket.io pour gérer les connexions en temps réel et
    recevoir les événements de notification.
  - Ajout de la fonction `sendEmail` qui vérifie la présence d'une adresse
    e-mail avant d'envoyer une notification.
  - Mise à jour du `Dockerfile` pour installer les dépendances et lancer
    l'application avec Node.js.


# AGENTS.md - Trading Platform
## About the project:
Current directory represents a trading platform project.

## Purpose:
The project is structured to facilitate the development of a trading platform, with a focus on modularity, scalability, and maintainability.

## Business domain:
The trading platform operates within the stock exchanges financial services sector, providing functionalities for trading, market data analysis, and user account management.

## General architecture:
The architecture is designed to support microservices, allowing for independent development and deployment of different components. Each service represents part of the application.

## Repositories:
The project is monorepo, with the current directory containing all the code for the trading platform. The monorepo structure allows for easier management of dependencies and versioning across services.

## Microservices:
5 microservices are defined, each responsible for a specific aspect of the trading platform. These services communicate with each other through well-defined APIs.

# High level overview:
- `asset-service`: Reference catalog of tradable symbols.
- `market-service`: Order book, matching engine, publishes `trade-executed` events in Kafka.
- `portfolio-service`: Cash accounts, positions, freeze/reserve, consumes Kafka.
- `notifications-service`: Email (nodemailer) + Socket.IO relay of in-app notifications.
- `frontend-service`: Trading UI pages.
# Trading Platform Frontend Architecture Document

## 1. High-level Architecture

The trading platform frontend follows a Feature-Based Architecture with clear separation of concerns:

- Core: Application-wide services, guards, interceptors, and utilities
- Shared: Reusable components, directives, pipes, and models used across features
- Layout: Main application layout components (sidebar, topbar, workspace)
- Features: Domain-specific modules organized by business functionality

The architecture emphasizes:

- Standalone Components
- Signals for state management
- Zoneless change detection
- Client-side rendering only
- Dark theme by default with light theme option
- Desktop-first design with responsive/mobile readiness

## 2. Folder Tree

src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── services/
│   │   ├── utils/
│   │   └── core.module.ts
│   ├── shared/
│   │   ├── components/
│   │   ├── directives/
│   │   ├── pipes/
│   │   ├── models/
│   │   └── shared.module.ts
│   ├── layout/
│   │   ├── sidebar/
│   │   ├── topbar/
│   │   ├── workspace/
│   │   └── right-panel/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── markets/
│   │   ├── portfolio/
│   │   ├── assets/
│   │   ├── orders/
│   │   ├── history/
│   │   ├── watchlist/
│   │   ├── notifications/
│   │   └── settings/
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── app.component.ts
├── assets/
├── environments/
└── styles/

## 3. Responsibility of Major Folders

- core/: Singleton services, guards, interceptors, and utilities used throughout the application
- shared/: Reusable UI components, directives, pipes, and data models shared across features
- layout/: Main application layout components (sidebar, topbar, workspace, right panel)
- features/: Feature modules organized by business domain
- assets/: Static assets like images, icons, and translations
- environments/: Environment-specific configuration files
- styles/: Global styles, themes, and SCSS mixins/variables

## 4. Feature Organization

Each feature follows this structure:

feature-name/
├── components/
├── services/
├── models/
├── feature-name.routes.ts
└── feature-name.component.ts

Features:

- auth/: Login and authentication flow
- dashboard/: Main dashboard with overview of markets, portfolio, and watchlist
- markets/: Market listings and market details
- portfolio/: User portfolio management
- assets/: Asset management and details
- orders/: Order creation and management
- history/: Trade history
- watchlist/: Watchlist management
- notifications/: Notification system
- settings/: User settings and preferences

## 5. Shared Components Strategy

Shared components are designed to be highly reusable across features:

- Generic UI components (tables, forms, charts)
- Common layout elements
- Reusable form controls
- Standardized dialogs and modals

All shared components are exported through shared.module.ts and imported where needed.

## 6. Layout Strategy

Main layout components:

- Sidebar: Collapsible navigation rail with main menu items
- Topbar: User controls, notifications, and quick actions
- Workspace: Main content area
- Right Panel: Contextual information panel

Layout components are designed to be responsive and support mobile adaptation.

## 7. Routing Strategy

Routes are organized by feature with lazy-loading:

- /login: Authentication
- /dashboard: Main dashboard
- /markets: Market listings
- /markets/:symbol: Market details
- /portfolio: Portfolio overview
- /assets: Asset management
- /orders: Order management
- /history: Trade history
- /watchlist: Watchlist management
- /notifications: Notification center
- /settings: User settings

## 8. Lazy-Loading Strategy

Each feature module is lazy-loaded using Angular's built-in lazy-loading:

{
path: 'markets',
loadChildren: () => import('./features/markets/markets.routes').then(m => m.routes)
}

This reduces initial bundle size and improves application startup time.

## 9. Core Services Strategy

Core services include:

- AuthService: Authentication and user management
- HttpService: Enhanced HTTP client with interceptors
- WebSocketService: WebSocket communication for real-time updates
- StorageService: Local storage management
- NotificationService: Notification handling
- ThemeService: Theme management
- TranslationService: Internationalization support

## 10. Signals Strategy

State management is implemented using Angular Signals:

- Local State: Component-level signals for UI state
- Feature State: Feature-level signals for shared feature data
- Global State: Application-level signals for cross-feature data

Signals are preferred over traditional Observables for simpler state management.

## 11. REST Communication Strategy

REST communication follows these principles:

- Centralized HTTP service with interceptors
- Typed request/response models
- Consistent error handling
- Request caching where appropriate
- Authentication headers automatically added

## 12. WebSocket Strategy

WebSocket is used for real-time features:

- Order Book: Real-time updates
- Asset Prices: Live price changes
- Portfolio: Real-time balance updates
- Notifications: Real-time notification delivery

A centralized WebSocket service manages connections and message handling.

## 13. Error Handling Strategy

Error handling is centralized:

- HTTP error interceptor for API errors
- Global error handler for uncaught exceptions
- User-friendly error messages
- Error logging service for debugging

## 14. Authentication Strategy

Authentication is handled through:

- Keycloak integration
- JWT token management
- Route guards for protected routes
- Automatic token refresh
- User session management

## 15. Theme Strategy

Themes are implemented using:

- CSS custom properties for theme variables
- Dark theme as default
- Light theme as alternative
- Theme service for runtime switching
- Component-level theme awareness

## 16. Internationalization Strategy

Internationalization supports:

- French (default) and English
- Arabic readiness
- Translation service for dynamic content
- Language switcher component
- Translation files organized by feature

## 17. Naming Conventions

- Components: PascalCase (UserProfileComponent)
- Services: PascalCase with "Service" suffix (AuthService)
- Interfaces: PascalCase with "I" prefix (IUser)
- Files: Kebab-case (user-profile.component.ts)
- Selectors: Kebab-case (app-user-profile)

## 18. Angular Coding Conventions

- Standalone components preferred
- Signals for state management
- Zoneless change detection
- Strict typing enforced
- OnPush change detection strategy
- RxJS for asynchronous operations where needed

## 19. PrimeNG Usage Conventions

- Use PrimeNG components when available for consistency
- Customize themes through CSS variables
- Extend components rather than overriding styles
- Follow PrimeNG accessibility guidelines
- Use PrimeIcons for iconography

## 20. Tailwind Usage Conventions

- Utility-first approach for layout and styling
- Custom CSS for complex components
- Theme variables integrated with Tailwind config
- Responsive design using Tailwind breakpoints
- CSS layers for proper style precedence

## 21. Reusability Rules

- Components should have single responsibility
- Prefer composition over inheritance
- Extract shared functionality into services
- Use content projection for flexible components
- Parameterize components for reuse

## 22. Performance Guidelines

- Lazy-load feature modules
- Implement OnPush change detection
- Use trackBy for *ngFor loops
- Optimize images and assets
- Minimize bundle size through tree-shaking
- Implement virtual scrolling for large datasets

## 23. Future Extensibility Guidelines

- Design components with extension in mind
- Use configuration objects for complex components
- Implement plugin architecture for optional features
- Abstract external dependencies behind service interfaces
- Document extension points clearly

## Architecture Decision Record (ADR)

### ADR-001: Feature-Based Architecture

Status: Accepted
Decision: Organize the application using Feature-Based Architecture to improve maintainability and scalability.
Consequences: Clear separation of concerns, easier feature development, but requires careful planning of shared components.

### ADR-002: Signals for State Management

Status: Accepted
Decision: Use Angular Signals instead of NgRx for state management to reduce complexity and boilerplate.
Consequences: Simpler state management, better performance, but requires discipline in state organization.

### ADR-003: Standalone Components

Status: Accepted
Decision: Use Angular Standalone Components to reduce module overhead and improve modularity.
Consequences: Cleaner component structure, but requires understanding of standalone component patterns.

### ADR-004: Zoneless Change Detection

Status: Accepted
Decision: Implement zoneless change detection to improve performance.
Consequences: Better performance, but requires explicit change detection management.

### ADR-005: PrimeNG and Tailwind Combination

Status: Accepted
Decision: Use PrimeNG for UI components and Tailwind for layout and styling.
Consequences: Rapid UI development with consistent design, but requires careful CSS layer management.

### ADR-006: Lazy Loading

Status: Accepted
Decision: Implement lazy loading for feature modules to improve initial load time.
Consequences: Better performance and reduced initial bundle size, but requires careful route planning.

### ADR-007: Internationalization Support

Status: Accepted
Decision: Implement i18n support with French as default and English as alternative.
Consequences: Better accessibility for international users, but adds complexity to development.

### ADR-008: Dark Theme Default

Status: Accepted
Decision: Use dark theme as default with light theme option.
Consequences: Better user experience in low-light conditions, but requires careful color design.

### ADR-009: WebSocket for Real-time Features

Status: Accepted
Decision: Use WebSocket for real-time updates in order book, prices, portfolio, and notifications.
Consequences: Better user experience with real-time updates, but adds complexity to state management.

### ADR-010: Keycloak Integration

Status: Accepted
Decision: Integrate Keycloak for authentication and authorization.
Consequences: Enterprise-grade security, but requires Keycloak infrastructure.

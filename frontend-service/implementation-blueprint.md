# Trading Platform Frontend Implementation Blueprint

## 1. Application Layout Implementation

### 1.1 Sidebar Component

Responsibilities:

- Navigation menu with collapsible/expandable sections
- User profile quick access
- Theme toggle
- Language selector
- Application logo display
- Collapsed rail state by default

Interactions:

- Communicates with Topbar to synchronize collapse state
- Emits navigation events to Workspace
- Receives theme/language updates from Settings

### 1.2 Topbar Component

Responsibilities:

- User profile dropdown with logout functionality
- Notification indicator with count
- Quick search functionality
- Theme toggle button
- Mobile menu toggle for responsive design

Interactions:

- Controls Sidebar collapse/expand state
- Receives notification count updates from Notifications service
- Communicates with Workspace for search queries

### 1.3 Workspace Component

Responsibilities:

- Main content area container
- Route outlet for feature modules
- Loading indicators during route transitions
- Error display area for feature-level errors

Interactions:

- Receives navigation events from Sidebar
- Displays components based on active route
- Communicates with Right Panel for contextual information

### 1.4 Right Panel Component

Responsibilities:

- Contextual information display
- Detailed views for selected items
- Settings panel overlay
- Notification details view

Interactions:

- Receives context from Workspace components
- Communicates with feature services for detailed data
- Toggles visibility based on user interaction

## 2. Feature Module Implementations

### 2.1 Auth Feature

Components:

- LoginComponent: Form for user authentication with Keycloak
- LogoutComponent: Handles user logout process

Services:

- AuthService: Keycloak integration, token management, user info
- AuthGuard: Protects routes requiring authentication

Models:

- User interface: User profile information
- LoginCredentials interface: Username/password structure

Utilities:

- TokenUtils: JWT token parsing and validation

### 2.2 Dashboard Feature

Components:

- DashboardComponent: Main dashboard layout
- PortfolioSummaryComponent: High-level portfolio overview
- MarketOverviewComponent: Key market indices display
- WatchlistSummaryComponent: User's watchlist highlights
- RecentActivityComponent: Recent trades/orders history

Services:

- DashboardService: Aggregates data from multiple sources

Signal Stores:

- dashboardState: Combined dashboard data state

### 2.3 Markets Feature

Components:

- MarketsListComponent: Table of available markets
- MarketSearchComponent: Search and filter functionality
- MarketCardComponent: Individual market summary card
- MarketDetailsComponent: Detailed market information

Services:

- MarketService: REST API communication for market data
- MarketWebSocketService: Real-time price updates

Models:

- Market interface: Market information structure
- PriceUpdate interface: Real-time price update structure

Shared Components Used:

- SearchComponent
- SortableTableComponent
- PriceChartComponent

### 2.4 Portfolio Feature

Components:

- PortfolioOverviewComponent: Main portfolio view
- AssetListComponent: List of held assets
- PositionDetailsComponent: Detailed position information
- PerformanceChartComponent: Portfolio performance visualization

Services:

- PortfolioService: REST API communication for portfolio data
- PortfolioWebSocketService: Real-time balance updates

Models:

- Position interface: Asset position structure
- PortfolioSummary interface: Portfolio overview data

Signal Stores:

- portfolioState: Current portfolio data

### 2.5 Assets Feature

Components:

- AssetCatalogComponent: Complete asset listing
- AssetDetailsComponent: Detailed asset information
- AssetSearchComponent: Asset search functionality

Services:

- AssetService: REST API communication for asset data

Models:

- Asset interface: Asset information structure

### 2.6 Orders Feature

Components:

- OrderFormComponent: Order creation form
- OrderBookComponent: Real-time order book display
- OrderConfirmationDialog: Order confirmation modal
- OrderHistoryComponent: Historical orders list

Services:

- OrderService: REST API communication for order operations
- OrderWebSocketService: Real-time order book updates

Models:

- Order interface: Order structure
- OrderBook interface: Order book data structure

Dialogs:

- ConfirmOrderDialog: Order confirmation
- CancelOrderDialog: Order cancellation confirmation

### 2.7 Open Orders Feature

Components:

- OpenOrdersListComponent: List of pending orders
- OpenOrderItemComponent: Individual open order display

Services:

- OpenOrdersService: REST API communication for open orders

Models:

- OpenOrder interface: Open order structure

### 2.8 Trade History Feature

Components:

- TradeHistoryComponent: Complete trade history view
- TradeDetailsComponent: Detailed trade information

Services:

- TradeHistoryService: REST API communication for trade history

Models:

- Trade interface: Trade execution structure

### 2.9 Watchlist Feature

Components:

- WatchlistManagerComponent: Watchlist creation/editing
- WatchlistItemsComponent: Watchlist items display
- WatchlistItemComponent: Individual watchlist item

Services:

- WatchlistService: REST API communication for watchlist operations

Models:

- Watchlist interface: Watchlist structure
- WatchlistItem interface: Individual watchlist item

### 2.10 Notifications Feature

Components:

- NotificationPanelComponent: Notification list display
- NotificationItemComponent: Individual notification display
- NotificationIndicatorComponent: Toolbar notification indicator

Services:

- NotificationService: WebSocket communication for notifications
- NotificationStorageService: Local storage for notification history

Models:

- Notification interface: Notification structure

Signal Stores:

- notificationsState: Current notifications

### 2.11 Settings Feature

Components:

- SettingsComponent: Main settings panel
- ThemeSettingsComponent: Theme configuration
- LanguageSettingsComponent: Language selection
- ProfileSettingsComponent: User profile management

Services:

- SettingsService: Settings persistence and management
- ThemeService: Theme switching functionality
- TranslationService: Language switching functionality

Models:

- Settings interface: User settings structure

## 3. Core Services Implementation

### 3.1 HTTP Interceptors

- AuthInterceptor: Adds JWT token to requests
- ErrorInterceptor: Centralized error handling
- LoadingInterceptor: Shows loading indicators

### 3.2 Guards

- AuthGuard: Protects authenticated routes
- RoleGuard: Protects role-specific routes

### 3.3 Utilities

- DateFormatter: Date formatting utilities
- NumberFormatter: Number formatting for financial data
- ValidationUtils: Common validation functions

## 4. Shared Components Implementation

### 4.1 Tables

- SortableTableComponent: Generic sortable table with pagination
- DataTableComponent: Enhanced data table with filtering

### 4.2 Cards

- DataCardComponent: Generic data display card
- SummaryCardComponent: Key metric summary card

### 4.3 Forms

- FormFieldComponent: Standardized form field wrapper
- FormSectionComponent: Form section with validation

### 4.4 Dialogs

- ConfirmationDialog: Standard confirmation dialog
- InformationDialog: Information display dialog

### 4.5 Toolbars

- FeatureToolbarComponent: Feature-specific toolbar
- SearchToolbarComponent: Toolbar with search functionality

### 4.6 Search Components

- SearchComponent: Generic search input with suggestions
- FilterComponent: Multi-filter selection component

### 4.7 Badges

- StatusBadgeComponent: Status indicator badge
- CountBadgeComponent: Numeric count indicator

### 4.8 Status Indicators

- LoadingIndicatorComponent: Standard loading spinner
- StatusIndicatorComponent: Generic status indicator

## 5. Communication Implementation

### 5.1 REST Services

- HttpService: Base HTTP service with interceptors
- Individual feature services for API communication

### 5.2 WebSocket Services

- WebSocketService: Base WebSocket service
- MarketWebSocketService: Market data updates
- PortfolioWebSocketService: Portfolio updates
- NotificationWebSocketService: Notification delivery

### 5.3 Signal Stores

- Global application state for user profile, theme, language
- Feature-level state for dashboard, portfolio, markets

### 5.4 State Management

- Local state: Component-level signals
- Feature state: Feature-level signals
- Global state: Application-level signals

## 6. Reusability Implementation

### 6.1 Generic Components

- ButtonComponent: Standardized button with variants
- InputComponent: Form input with validation
- SelectComponent: Dropdown selection component
- ChartComponent: Wrapper for charting library

### 6.2 Layout Components

- GridComponent: Responsive grid layout
- PanelComponent: Collapsible panel container
- TabComponent: Tabbed interface component

### 6.3 Utility Pipes

- CurrencyPipe: Financial currency formatting
- PercentPipe: Percentage formatting
- DatePipe: Date formatting
- NumberPipe: Number formatting

### 6.4 Directives

- PermissionDirective: Permission-based element visibility
- LoadingDirective: Loading state indicator
- TooltipDirective: Enhanced tooltip functionality

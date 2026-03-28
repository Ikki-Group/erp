# Ikki ERP Entity-Relationship Diagram (ERD)

This is the conceptual Entity-Relationship Diagram based on the `Ikki Group F&B` feature blueprints. It focuses on the core MVP Phase 1 (Layer 0 to Layer 3).

```mermaid
erDiagram
    %% ========================================
    %% LAYER 0 - Core Physical & Product Data
    %% ========================================

    LOCATIONS {
        uuid id PK
        varchar name "Outlets/Warehouses"
        varchar type "PHYSICAL|VIRTUAL"
    }

    PRODUCTS {
        uuid id PK
        varchar name "e.g., Iced Latte"
        varchar sku
        integer base_price
    }

    PRODUCT_CATEGORIES {
        uuid id PK
        varchar name "Beverage/Food"
    }

    %% ========================================
    %% LAYER 1 - Masters & Security
    %% ========================================

    USERS {
        uuid id PK
        varchar email
        varchar password_hash
        uuid role_id FK
    }

    ROLES {
        uuid id PK
        varchar name "Barista/Chef"
    }

    USER_LOCATIONS {
        uuid user_id FK
        uuid location_id FK
    }

    MATERIALS {
        uuid id PK
        varchar name "Fresh Milk"
        varchar base_uom "Liters"
    }

    MATERIAL_UOMS {
        uuid id PK
        uuid material_id FK
        varchar alt_uom "ml"
        decimal multiplier "1000"
    }

    %% ========================================
    %% LAYER 2 - Operations (Inventory & Recipes)
    %% ========================================

    RECIPES {
        uuid id PK
        uuid product_id FK
        boolean is_subrecipe
    }

    RECIPE_LINES {
        uuid id PK
        uuid recipe_id FK
        uuid material_id FK
        decimal quantity
    }

    INVENTORY_LEDGERS {
        uuid id PK
        uuid location_id FK
        uuid material_id FK
        decimal qty_changed
        varchar type "IN|OUT|TRANSFER|ADJUSTMENT"
    }

    STOCK_SUMMARIES {
        uuid location_id PK,FK
        uuid material_id PK,FK
        decimal current_qty
        decimal wac "Weighted Avg Cost"
    }

    %% ========================================
    %% LAYER 3 - External Integrations & Sales
    %% ========================================

    MOKA_SYNC_LOGS {
        uuid id PK
        uuid outlet_location_id FK
        varchar moka_trx_id
        timestamp sync_time
    }

    SALES_ORDERS {
        uuid id PK
        uuid location_id FK
        varchar moka_receipt_no
        decimal total_revenue
    }

    SO_LINES {
        uuid id PK
        uuid so_id FK
        uuid product_id FK
        integer qty
    }

    %% Relationships
    PRODUCTS }|--|| PRODUCT_CATEGORIES : "belongs_to"
    USERS }|--|| ROLES : "has"
    USERS ||--|{ USER_LOCATIONS : "assigned_to"
    LOCATIONS ||--|{ USER_LOCATIONS : ""
    
    MATERIALS ||--|{ MATERIAL_UOMS : "has_conversions"
    
    PRODUCTS ||--|o RECIPES : "requires"
    RECIPES ||--|{ RECIPE_LINES : "contains"
    RECIPE_LINES }|--|| MATERIALS : "uses"

    LOCATIONS ||--|{ INVENTORY_LEDGERS : ""
    MATERIALS ||--|{ INVENTORY_LEDGERS : ""
    
    LOCATIONS ||--|{ STOCK_SUMMARIES : ""
    MATERIALS ||--|{ STOCK_SUMMARIES : ""

    LOCATIONS ||--o{ SALES_ORDERS : "makes_sale"
    SALES_ORDERS ||--|{ SO_LINES : "sells"
    SO_LINES }|--|| PRODUCTS : "product"
```

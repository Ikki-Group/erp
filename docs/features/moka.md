# External Integrations: Moka POS Sync Engine

The Moka POS Sync Engine module (Layer 3 - Aggregator) is the critical lifeline connecting the physical sales happening at the cashier (Ikki Coffee & Ikki Resto) with the back-office ERP system. Operating as an Aggregator it pulls data from external sources and injects it securely into the ERP's lower-level domains (Sales, Products, Inventory).

## 1. Core Objectives
- **Automated Sales Tracking**: Fetch real-time or batched transaction data without requiring baristas/cashiers to double-entry sales.
- **Auto-Deduction Trigger**: Automatically initiate the `Inventory` -> `Recipe` deduction based on items sold.
- **Accurate Margin Reporting**: Combine POS sales revenue with ERP COGS to visualize gross profit margins.

## 2. Key Features

### Product & Menu Synchronization
- Pull the Master Menu (Products, Categories, Modifiers, Base Pricing) from Moka's API into the ERP's `Product` module.
- *Value Proposition*: When a new seasonal drink is added in Moka POS, it automatically appears in Ikki ERP, ready to be linked to a Recipe by the Head Chef.

### Sales Sync & Webhooks
- **Daily Cron / Real-time Webhooks**: Captures every finalized transaction from Moka (`COMPLETED` orders).
- **Sales Order Generation**: Maps the Moka transaction into an Ikki ERP `Sales Order` (SO).

### Inventory Auto-Deduction Engine
- When the Moka Sync Engine creates an SO, it triggers a chain reaction:
  1. The ERP identifies the `Product` (e.g., Iced Matcha).
  2. The ERP pulls the attached `Recipe` (e.g., 20g Matcha Powder, 150ml Milk, 1 Cup).
  3. The ERP deducts those items from the specific `Location` the sale occurred (e.g., *Ikki Coffee - Bar*).
- This ensures physical stock counts in the ERP are inherently accurate by the end of the shift.

### Refund & Void Handling
- When a cashier voids a transaction or processes a refund in Moka, the sync engine must correctly detect it and *reverse* the inventory deduction, returning the raw materials back into the active stock pool (if applicable) or logging them straight to Waste.

## 3. Technical Architecture (Proposed)

### Aggregator Role (Layer 3)
- **Dependency Flow**: The `MokaServiceModule` has permission to depend on `iam`, `location`, `products`, `sales`, and `inventory`.
- **API Mapping**:
  - `Moka_External_ID` vs `Ikki_Product_ID`: A mapping table that connects the external POS item identifier with the internal ERP database ID.

### OAuth Authentication
- The system provides a secure portal for Owner/Admin to authorize the ERP App via Moka POS OAuth 2.0. This allows the ERP to pull data securely on behalf of the client's Moka account.

### Resiliency & Retry Logic
- **Idempotency Keys**: To prevent duplicate sales records if Moka sends the same webhook twice, all sales processing must use strict Idempotency Keys (usually the Moka Transaction ID).
- **Background Jobs**: Heavy processing (like a busy Friday night pulling 500 transactions at once) should be queued in a Redis worker (e.g., BullMQ) to avoid slowing down the ERP API.

## 4. Next Phase Recommendations
1. **Discount Tracking**: Map Moka POS discounts (e.g., "Gojek Promo 20%") specifically on the dashboard to see how promos affect the net profit margin per item.
2. **COGS Push back to Moka**: (If supported by API) push the ERP's calculated Recipe Cost back into Moka POS so Moka's own internal reports have accurate COGS numbers.

# Fixed Asset & Maintenance Management

The Fixed Asset & Maintenance module (Layer 1/2) tracks the high-value physical equipment essential to Ikki Group's daily operations. In the F&B industry, keeping tracking of Espresso Machines, Chillers/Freezers, and POS hardware ensures both operational continuity and accurate financial reporting.

## 1. Core Objectives
- **Asset Traceability**: Know exactly which outlet currently holds which expensive equipment.
- **Financial Depreciation**: Automatically reduce the book value of assets over time to reflect their true worth on the Balance Sheet and P&L.
- **Preventative Maintenance**: Ensure machines do not break down during busy hours by enforcing scheduled servicing.

## 2. Key Features

### Asset Registry & Lifecycle
- **Master List**: Record all major equipment (e.g., "La Marzocco Linea PB", "Chiller 4 Pintu").
- **Asset Tags**: Generate and trace QR Codes attached physically to the machine.
- **Location Tracking**: Track if a machine is currently at Ikki Coffee, in the warehouse, or out for repair.

### Automated Depreciation (Penyusutan)
- **Straight-Line Method**: Divide the asset's purchase price by its useful life (e.g., an Rp 150.000.000 espresso machine over 5 years loses Rp 2.500.000 per month).
- **ERP Integration**: At the end of every month, the system automatically posts a Journal Entry to the `Finance` module, legally reducing tax liability without manual spreadsheet work.

### Maintenance Logs (Service & Calibration)
- **Scheduled Maintenance**: Set automated reminders (e.g., Clean Grinder burrs every 2 weeks, full Espresso Machine service every 6 months).
- **Repair Logging**: Track the history and cost of repairs for specific machines to determine if buying a new one is cheaper than fixing a broken one.

## 3. Technical Architecture (Proposed)
- The module interacts heavily with the `Location` module (to assign assets to branches) and the `Finance` module (for depreciation journals).
- Scheduled maintenance triggers rely on a background cron job (`Bree` or Redis queues) to generate notifications for the Outlet Manager.

## 4. Next Phase Recommendations
- **IoT Integration**: (Future stage) Connect smart espresso machines/ovens to the ERP to track actual usage cycles rather than just time-based depreciation.

# PRD: CRM & Loyalty

Specifications for Customer management, Loyalty program, and Promotions.

## Customer

### Fields

| Field         | Type       | Description                             |
| ------------- | ---------- | --------------------------------------- |
| code          | string     | Auto-generated                          |
| name          | string     | Customer name                           |
| phone         | string     | Phone (primary identifier at POS)       |
| email         | string?    | Email                                   |
| birthDate     | date?      | For birthday promos                     |
| tier          | enum       | `regular`, `silver`, `gold`, `platinum` |
| totalPoints   | integer    | Lifetime points earned                  |
| currentPoints | integer    | Available redeemable balance            |
| registeredAt  | timestamp  | Registration date                       |
| lastVisitAt   | timestamp? | Last purchase date                      |
| notes         | string?    | Internal notes                          |

### Business Rules

- Phone is unique — primary lookup key at POS.
- Customer link at POS is optional (transactions can be anonymous).
- Tier is derived from `totalPoints` (lifetime, not balance).
- `lastVisitAt` updates automatically on each linked transaction.

## Loyalty Program

### Tier Thresholds

| Tier     | Lifetime Points | Benefits                                      |
| -------- | --------------- | --------------------------------------------- |
| regular  | 0+              | Earn points                                   |
| silver   | 500+            | 1.2× earn multiplier                          |
| gold     | 2000+           | 1.5× earn multiplier, birthday reward         |
| platinum | 5000+           | 2× earn multiplier, birthday reward, priority |

Thresholds are configurable.

### Earning

```
points = floor(order_total / earn_ratio) × tier_multiplier
```

- `earn_ratio`: configurable (default Rp 10.000 = 1 point).
- Points earned on `completed` orders only.
- Voided orders reverse earned points.

### Redemption

| Field         | Type    | Description            |
| ------------- | ------- | ---------------------- |
| customerId    | FK      | Customer               |
| orderId       | FK?     | Applied to which order |
| pointsUsed    | integer | Points redeemed        |
| discountValue | decimal | Rupiah equivalent      |

### Redemption Rules

- Conversion: configurable (default 1 point = Rp 1.000).
- Minimum redemption: 10 points.
- Max redemption cap: 50% of order total (configurable).
- Redemption creates a discount on the order.

### Points Transaction Log

| Field       | Type    | Description                            |
| ----------- | ------- | -------------------------------------- |
| customerId  | FK      | Customer                               |
| orderId     | FK?     | Related order                          |
| type        | enum    | `earn`, `redeem`, `expire`, `adjust`   |
| points      | integer | Positive for earn, negative for redeem |
| description | string  | What happened                          |

Append-only log — full history of points movement.

## Promotions

### Fields

| Field       | Type    | Description                                                          |
| ----------- | ------- | -------------------------------------------------------------------- |
| name        | string  | Promo name                                                           |
| description | string? | Details                                                              |
| type        | enum    | `discount_percentage`, `discount_fixed`, `bonus_points`, `free_item` |
| value       | decimal | Discount amount or multiplier                                        |
| targetTier  | enum?   | Target tier (null = all)                                             |
| locationId  | FK?     | Specific location (null = all)                                       |
| validFrom   | date    | Start                                                                |
| validUntil  | date    | End                                                                  |
| isActive    | boolean | Toggle                                                               |

### Business Rules

- Promos are evaluated automatically at POS when a customer is linked.
- Multiple promos can stack (but max 1 voucher code per order).
- Expired promos auto-deactivate.
- Promo usage tracked for ROI analysis.

## Customer Insights

Analytics on customer data:

- Visit frequency
- Average order value per tier
- Top customers by revenue
- Churn detection (no visit in X days)
- Birthday list (upcoming birthdays this week/month)

---

**Next:** [10-workflows.md](./10-workflows.md) — Business workflows.

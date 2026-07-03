import { pgEnum } from 'drizzle-orm/pg-core'

/**
 * Cross-domain shared enums.
 *
 * Only enums genuinely reused by two or more *unrelated* domains belong here.
 * If an enum is only ever used within one domain (even across files inside
 * that domain's folder), define it next to its primary table instead.
 */

/**
 * Shared by `purchasing/invoice.ts` (purchase invoices, payable) and
 * `sales/invoice.ts` (sales invoices, receivable). Both represent the same
 * document lifecycle (draft → open → paid → void), just on opposite sides of
 * the ledger — kept as one enum so the two domains don't drift apart, and so
 * neither has to import the other purely to reuse a type.
 */
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'open', 'paid', 'void'])

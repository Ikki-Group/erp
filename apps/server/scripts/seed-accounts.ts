import { db } from '../src/db'
import { accountsTable } from '../src/db/schema/finance'
import { stampCreate } from '../src/core/database'
import { and, eq, isNull } from 'drizzle-orm'

// System
const actorId = 1

const accounts = [
	// Assets
	{ code: '1101', name: 'Cash', type: 'ASSET' as const, isGroup: false },
	{ code: '1102', name: 'Accounts Receivable', type: 'ASSET' as const, isGroup: false },
	{ code: '1201', name: 'Inventory - Raw Materials', type: 'ASSET' as const, isGroup: false },

	// Liabilities
	{ code: '2101', name: 'Accounts Payable', type: 'LIABILITY' as const, isGroup: false },
	{ code: '2102', name: 'Salary Payable', type: 'LIABILITY' as const, isGroup: false },
	{ code: '2103', name: 'Service Charge Payable', type: 'LIABILITY' as const, isGroup: false },
	{ code: '2104', name: 'Taxes Payable', type: 'LIABILITY' as const, isGroup: false },

	// Equity
	{ code: '3101', name: 'Retained Earnings', type: 'EQUITY' as const, isGroup: false },

	// Revenue
	{ code: '4101', name: 'Sales Revenue', type: 'REVENUE' as const, isGroup: false },

	// Expenses
	{ code: '5101', name: 'Cost of Goods Sold', type: 'EXPENSE' as const, isGroup: false },
	{ code: '5201', name: 'Salary Expense', type: 'EXPENSE' as const, isGroup: false },
]

async function seed() {
	for (const acc of accounts) {
		const existing = await db
			.select()
			.from(accountsTable)
			.where(and(eq(accountsTable.code, acc.code), isNull(accountsTable.deletedAt)))

		if (existing.length === 0) {
			await db.insert(accountsTable).values({ ...acc, ...stampCreate(actorId) })
			console.log(`Seeded account: ${acc.code} - ${acc.name}`)
		} else {
			console.log(`Account ${acc.code} already exists`)
		}
	}
}

await seed()
process.exit()

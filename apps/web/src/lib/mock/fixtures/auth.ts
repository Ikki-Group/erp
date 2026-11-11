export interface MockUser {
	id: number
	username: string
	password: string
	name: string
	email: string
	isOwner: boolean
	permissions: string[]
}

/**
 * Mock credentials — mirrors the e2e seed usernames (`owner`/`cashier`) for
 * familiarity, but this is a fully local fixture with no relation to the
 * real database.
 */
export const mockUsers: MockUser[] = [
	{
		id: 1,
		username: 'owner',
		password: 'password123',
		name: 'Budi Santoso',
		email: 'owner@ikki.test',
		isOwner: true,
		permissions: [],
	},
	{
		id: 2,
		username: 'cashier',
		password: 'password123',
		name: 'Siti Aminah',
		email: 'cashier@ikki.test',
		isOwner: false,
		permissions: ['pos.order.create', 'pos.order.read'],
	},
]

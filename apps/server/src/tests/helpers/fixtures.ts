/**
 * Centralized Test Fixtures
 *
 * Predefined test data for common scenarios.
 * Use these to ensure consistency across tests.
 */

import { Factory } from './factory'

// ==================== IAM Fixtures ====================

export const IamFixtures = {
	/**
	 * Standard admin user with all permissions
	 */
	adminUser: () =>
		Factory.user({
			email: 'admin@test.com',
			username: 'admin',
			fullname: 'System Administrator',
			isActive: true,
		}),

	/**
	 * Standard regular user
	 */
	regularUser: () =>
		Factory.user({
			email: 'user@test.com',
			username: 'user',
			fullname: 'Regular User',
			isActive: true,
		}),

	/**
	 * Inactive user (for testing auth failures)
	 */
	inactiveUser: () =>
		Factory.user({
			email: 'inactive@test.com',
			username: 'inactive',
			fullname: 'Inactive User',
			isActive: false,
		}),

	/**
	 * Admin role with full permissions
	 */
	adminRole: () =>
		Factory.role({
			name: 'Administrator',
			code: 'ADMIN',
			isSystem: true,
		}),

	/**
	 * Regular user role
	 */
	userRole: () =>
		Factory.role({
			name: 'User',
			code: 'USER',
			isSystem: false,
		}),
} as const

// ==================== Location Fixtures ====================

export const LocationFixtures = {
	/**
	 * Main warehouse location
	 */
	mainWarehouse: () =>
		Factory.location({
			code: 'WH-MAIN',
			name: 'Main Warehouse',
			type: 'warehouse',
			isActive: true,
		}),

	/**
	 * Store location
	 */
	storeLocation: () =>
		Factory.location({
			code: 'STORE-01',
			name: 'Store One',
			type: 'store',
			isActive: true,
		}),

	/**
	 * Inactive location (for filtering tests)
	 */
	inactiveLocation: () =>
		Factory.location({
			code: 'INACTIVE-LOC',
			name: 'Inactive Location',
			type: 'warehouse',
			isActive: false,
		}),
} as const

// ==================== Material Fixtures ====================

export const MaterialFixtures = {
	/**
	 * Raw material (e.g., coffee beans)
	 */
	rawMaterial: (overrides: { categoryId: number; baseUomId: number }) =>
		Factory.material({
			sku: 'RAW-001',
			name: 'Raw Material',
			type: 'raw',
			...overrides,
		}),

	/**
	 * Semi-finished goods (e.g., roasted beans)
	 */
	semiFinished: (overrides: { categoryId: number; baseUomId: number }) =>
		Factory.material({
			sku: 'SEMI-001',
			name: 'Semi Finished',
			type: 'semi',
			...overrides,
		}),

	/**
	 * Packaging material
	 */
	packaging: (overrides: { categoryId: number; baseUomId: number }) =>
		Factory.material({
			sku: 'PACK-001',
			name: 'Packaging',
			type: 'packaging',
			...overrides,
		}),
} as const

// ==================== UOM Fixtures ====================

export const UomFixtures = {
	kilogram: () => Factory.uom({ code: 'KG' }),
	gram: () => Factory.uom({ code: 'G' }),
	piece: () => Factory.uom({ code: 'PCS' }),
	liter: () => Factory.uom({ code: 'L' }),
	milliliter: () => Factory.uom({ code: 'ML' }),
} as const

// ==================== Category Fixtures ====================

export const CategoryFixtures = {
	/**
	 * Root material category
	 */
	materialRoot: () =>
		Factory.materialCategory({
			name: 'Raw Materials',
		}),

	/**
	 * Child category with parent
	 */
	materialChild: (parentId: number) =>
		Factory.materialCategory({
			name: 'Coffee Beans',
			parentId,
		}),
} as const

// ==================== Auth Fixtures ====================

export const AuthFixtures = {
	/**
	 * Valid login credentials
	 */
	validCredentials: {
		email: 'admin@test.com',
		password: 'password123',
	},

	/**
	 * Invalid login credentials
	 */
	invalidCredentials: {
		email: 'nonexistent@test.com',
		password: 'wrongpassword',
	},

	/**
	 * Weak password (for validation tests)
	 */
	weakPassword: {
		email: 'new@test.com',
		password: '123',
	},
} as const

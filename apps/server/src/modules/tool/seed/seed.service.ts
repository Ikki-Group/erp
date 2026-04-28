import { record } from '@elysiajs/opentelemetry'

import type { DbClient } from '@/core/database'

import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'
import type { MaterialServiceModule } from '@/modules/material'
import type { ProductServiceModule } from '@/modules/product'

import { SEED_CONFIG } from '@/config/seed-config'

export class SeedService {
	constructor(
		private readonly db: DbClient,
		private readonly iamSvc: IamServiceModule,
		private readonly locationSvc: LocationServiceModule,
		private readonly productSvc: ProductServiceModule,
		private readonly materialSvc: MaterialServiceModule,
	) {}

	async seed(): Promise<void> {
		return record('SeedService.seed', async () => {
			// Use Drizzle transaction for the entire seed process
			await this.db.transaction(async (_db) => {
				const SYSTEM_ACTOR_ID = 1

				// 1. Seed Roles
				await this.iamSvc.role.seed([
					{
						code: SEED_CONFIG.ROLE_SUPERADMIN_CODE,
						name: 'Administrator',
						description: 'Super administrator',
						permissions: ['*'],
						isSystem: true,
						createdBy: SYSTEM_ACTOR_ID,
					},
					{
						code: 'MANAGER',
						name: 'Manager',
						description: null,
						permissions: [],
						isSystem: false,
						createdBy: SYSTEM_ACTOR_ID,
					},
				])

				// 2. Seed Users
				const superAdminPasswordHash = await Bun.password.hash(SEED_CONFIG.USER_SUPERADMIN_PASSWORD)
				await this.iamSvc.user.seed([
					{
						email: SEED_CONFIG.USER_SUPERADMIN_EMAIL,
						username: SEED_CONFIG.USER_SUPERADMIN_USERNAME,
						fullname: 'Administrator',
						password: SEED_CONFIG.USER_SUPERADMIN_PASSWORD,
						passwordHash: superAdminPasswordHash,
						isRoot: true,
						pinCode: null,
						isActive: true,
						defaultLocationId: null,
						createdBy: SYSTEM_ACTOR_ID,
						assignments: [],
					},
				])

				// 3. Seed Locations
				await this.locationSvc.master.seed(
					SEED_CONFIG.LOCATIONS.map((l) => ({
						code: l.code,
						name: l.name,
						type: l.type,
						address: null,
						phone: null,
						isActive: true,
						description: null,
						createdBy: SYSTEM_ACTOR_ID,
					})),
				)

				// 4. Seed Sales Types
				await this.productSvc.salesType.seed(
					SEED_CONFIG.SALES_TYPES.map((st) => ({
						code: st.code,
						name: st.name,
						isSystem: st.isSystem,
						createdBy: SYSTEM_ACTOR_ID,
					})),
				)

				// 5. Seed UOMs
				await this.materialSvc.uom.seed(
					SEED_CONFIG.UOMS.map((u) => ({ code: u.code, createdBy: SYSTEM_ACTOR_ID })),
				)
			})
		})
	}

	async seedDev(): Promise<void> {
		return record('SeedService.seedDev', async () => {
			const SYSTEM_ACTOR_ID = 1

			const uoms = await this.db.query.uomsTable.findMany()
			const getUom = (code: string) => uoms.find((u) => u.code === code)?.id ?? 1

			// 1. Create categories
			const { id: categoryCoffee } = await this.materialSvc.category.handleCreate(
				{ name: 'Coffee Beans', description: 'Premium selected coffee beans', parentId: null },
				SYSTEM_ACTOR_ID,
			)
			const { id: categoryDairy } = await this.materialSvc.category.handleCreate(
				{ name: 'Dairy & Milk', description: 'Milk-based products', parentId: null },
				SYSTEM_ACTOR_ID,
			)
			const { id: categoryPackaging } = await this.materialSvc.category.handleCreate(
				{ name: 'Packaging', description: 'Product packaging materials', parentId: null },
				SYSTEM_ACTOR_ID,
			)

			// 2. Create materials
			const materialsData = [
				{
					name: 'Arabica Beans - Flores',
					sku: 'RAW-COF-001',
					type: 'raw' as const,
					categoryId: categoryCoffee,
					baseUomId: getUom('GR'),
				},
				{
					name: 'Robusta Beans - Dampit',
					sku: 'RAW-COF-002',
					type: 'raw' as const,
					categoryId: categoryCoffee,
					baseUomId: getUom('GR'),
				},
				{
					name: 'Fresh Milk',
					sku: 'RAW-MILK-001',
					type: 'raw' as const,
					categoryId: categoryDairy,
					baseUomId: getUom('ML'),
				},
				{
					name: 'Espresso Shot (House Blend)',
					sku: 'SEMI-COF-001',
					type: 'semi' as const,
					categoryId: categoryCoffee,
					baseUomId: getUom('ML'),
				},
				{
					name: 'Paper Cup Hot 8oz',
					sku: 'PCK-CUP-001',
					type: 'packaging' as const,
					categoryId: categoryPackaging,
					baseUomId: getUom('PCS'),
				},
				{
					name: 'Plastic Cup Cold 16oz',
					sku: 'PCK-CUP-002',
					type: 'packaging' as const,
					categoryId: categoryPackaging,
					baseUomId: getUom('PCS'),
				},
			]

			for (const m of materialsData) {
				try {
					await this.materialSvc.master.handleCreate(
						{ ...m, conversions: [], description: null, locationIds: [] },
						SYSTEM_ACTOR_ID,
					)
				} catch (error) {
					console.log(`[SeedDev] Skipped ${m.name}: already exists or error`, error)
				}
			}
		})
	}
}

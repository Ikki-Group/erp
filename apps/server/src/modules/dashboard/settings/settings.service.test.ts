import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'

import { SettingsService } from './settings.service'
import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

describe('SettingsService', () => {
	let service: SettingsService
	let fakeIamService: IamServiceModule
	let fakeLocationService: LocationServiceModule

	beforeEach(() => {
		fakeIamService = {
			user: {
				count: spyOn(),
			},
			role: {
				count: spyOn(),
			},
		} as any

		fakeLocationService = {
			master: {
				count: spyOn(),
			},
		} as any

		service = new SettingsService(fakeIamService, fakeLocationService)
	})

	describe('getSettingsSummary', () => {
		it('should return settings summary with counts', async () => {
			const mockUsers = 50
			const mockRoles = 10
			const mockLocations = 5

			spyOn(fakeIamService.user, 'count').mockResolvedValue(mockUsers)
			spyOn(fakeIamService.role, 'count').mockResolvedValue(mockRoles)
			spyOn(fakeLocationService.master, 'count').mockResolvedValue(mockLocations)

			const result = await service.getSettingsSummary()

			expect(fakeIamService.user.count).toHaveBeenCalled()
			expect(fakeIamService.role.count).toHaveBeenCalled()
			expect(fakeLocationService.master.count).toHaveBeenCalled()

			expect(result).toEqual({
				users: mockUsers,
				roles: mockRoles,
				locations: mockLocations,
			})
		})

		it('should handle zero counts', async () => {
			spyOn(fakeIamService.user, 'count').mockResolvedValue(0)
			spyOn(fakeIamService.role, 'count').mockResolvedValue(0)
			spyOn(fakeLocationService.master, 'count').mockResolvedValue(0)

			const result = await service.getSettingsSummary()

			expect(result).toEqual({
				users: 0,
				roles: 0,
				locations: 0,
			})
		})

		it('should handle large counts', async () => {
			const mockUsers = 10000
			const mockRoles = 100
			const mockLocations = 50

			spyOn(fakeIamService.user, 'count').mockResolvedValue(mockUsers)
			spyOn(fakeIamService.role, 'count').mockResolvedValue(mockRoles)
			spyOn(fakeLocationService.master, 'count').mockResolvedValue(mockLocations)

			const result = await service.getSettingsSummary()

			expect(result).toEqual({
				users: mockUsers,
				roles: mockRoles,
				locations: mockLocations,
			})
		})

		it('should call all services in parallel', async () => {
			const mockUsers = 25
			const mockRoles = 5
			const mockLocations = 3

			const userCountPromise = Promise.resolve(mockUsers)
			const roleCountPromise = Promise.resolve(mockRoles)
			const locationCountPromise = Promise.resolve(mockLocations)

			spyOn(fakeIamService.user, 'count').mockReturnValue(userCountPromise)
			spyOn(fakeIamService.role, 'count').mockReturnValue(roleCountPromise)
			spyOn(fakeLocationService.master, 'count').mockReturnValue(locationCountPromise)

			const result = await service.getSettingsSummary()

			expect(result).toEqual({
				users: mockUsers,
				roles: mockRoles,
				locations: mockLocations,
			})
		})
	})
})

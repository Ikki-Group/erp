import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'

import { AccountService } from './account.service'
import { AccountRepo } from './account.repo'
import { NotFoundError } from '@/core/http/errors'
import * as dto from './account.dto'

describe('AccountService', () => {
	let service: AccountService
	let fakeRepo: AccountRepo

	beforeEach(() => {
		fakeRepo = {
			getById: mock(),
			findByCode: mock(),
			getListPaginated: mock(),
			create: mock(),
			update: mock(),
			softDelete: mock(),
			hasChildren: mock(),
		} as any

		service = new AccountService(fakeRepo)
	})

	describe('getById', () => {
		it('should return account when found', async () => {
			const mockAccount: dto.AccountDto = {
				id: 1,
				code: '1001',
				name: 'Cash Account',
				type: 'asset',
				parentId: null,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'getById').mockResolvedValue(mockAccount)

			const result = await service.getById(1)

			expect(fakeRepo.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockAccount)
		})

		it('should throw NotFoundError when account not found', async () => {
			spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

			await expect(service.getById(999)).rejects.toThrow(
				new NotFoundError('Account 999 not found', 'ACCOUNT_NOT_FOUND')
			)
		})
	})

	describe('findByCode', () => {
		it('should return account by code', async () => {
			const mockAccount: dto.AccountDto = {
				id: 1,
				code: '1001',
				name: 'Cash Account',
				type: 'asset',
				parentId: null,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'findByCode').mockResolvedValue(mockAccount)

			const result = await service.findByCode('1001')

			expect(fakeRepo.findByCode).toHaveBeenCalledWith('1001')
			expect(result).toEqual(mockAccount)
		})

		it('should return undefined when account not found by code', async () => {
			spyOn(fakeRepo, 'findByCode').mockResolvedValue(undefined)

			const result = await service.findByCode('9999')

			expect(result).toBeUndefined()
		})
	})

	describe('handleList', () => {
		it('should return paginated list', async () => {
			const filter: dto.AccountFilterDto = { page: 1, limit: 10 }
			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						code: '1001',
						name: 'Cash Account',
						type: 'asset',
						parentId: null,
						isActive: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			spyOn(fakeRepo, 'getListPaginated').mockResolvedValue(mockPaginatedResult)

			const result = await service.handleList(filter)

			expect(fakeRepo.getListPaginated).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockPaginatedResult)
		})
	})

	describe('handleDetail', () => {
		it('should return account detail', async () => {
			const mockAccount: dto.AccountDto = {
				id: 1,
				code: '1001',
				name: 'Cash Account',
				type: 'asset',
				parentId: null,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(service, 'getById').mockResolvedValue(mockAccount)

			const result = await service.handleDetail(1)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockAccount)
		})
	})

	describe('handleCreate', () => {
		it('should create account successfully', async () => {
			const createData: dto.AccountCreateDto = {
				code: '2001',
				name: 'Revenue Account',
				type: 'revenue',
				parentId: null,
			}

			const actorId = 1
			const newAccountId = 123

			spyOn(fakeRepo, 'create').mockResolvedValue(newAccountId)

			const result = await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
			expect(result).toEqual(newAccountId)
		})
	})

	describe('handleUpdate', () => {
		it('should update account successfully', async () => {
			const updateData: dto.AccountUpdateDto = {
				name: 'Updated Account Name',
			}

			const actorId = 1
			const accountId = 1
			const updatedAccountId = 1

			spyOn(fakeRepo, 'update').mockResolvedValue(updatedAccountId)

			const result = await service.handleUpdate(accountId, updateData, actorId)

			expect(fakeRepo.update).toHaveBeenCalledWith(accountId, updateData, actorId)
			expect(result).toEqual(updatedAccountId)
		})
	})

	describe('handleRemove', () => {
		it('should remove account successfully', async () => {
			const accountId = 1
			const actorId = 1

			spyOn(fakeRepo, 'hasChildren').mockResolvedValue(false)
			spyOn(fakeRepo, 'softDelete').mockResolvedValue(accountId)

			const result = await service.handleRemove(accountId, actorId)

			expect(fakeRepo.hasChildren).toHaveBeenCalledWith(accountId)
			expect(fakeRepo.softDelete).toHaveBeenCalledWith(accountId, actorId)
			expect(result).toEqual(accountId)
		})

		it('should throw error when account has children', async () => {
			const accountId = 1
			const actorId = 1

			spyOn(fakeRepo, 'hasChildren').mockResolvedValue(true)

			await expect(service.handleRemove(accountId, actorId)).rejects.toThrow(
				'Account has children, cannot delete'
			)

			expect(fakeRepo.hasChildren).toHaveBeenCalledWith(accountId)
			expect(fakeRepo.softDelete).not.toHaveBeenCalled()
		})
	})
})

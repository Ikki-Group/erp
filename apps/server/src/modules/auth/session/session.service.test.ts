import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionService } from './session.service'
import { SessionRepo } from './session.repo'
import * as dto from './session.dto'
import type { UserDto } from '@/modules/iam'

// Mock JWT module
vi.mock('jsonwebtoken', () => ({
	sign: vi.fn(),
	verify: vi.fn(),
}))

// Mock cache module
vi.mock('@/core/cache', () => ({
	bento: {
		namespace: () => ({
			getOrSet: vi.fn(),
			deleteMany: vi.fn(),
		}),
	},
	CACHE_KEY_DEFAULT: {
		byId: (id: number) => `${id}`,
	},
}))

// Mock logger
vi.mock('@/core/logger', () => ({
	logger: {
		error: vi.fn(),
	},
}))

// Mock env
vi.mock('@/config/env', () => ({
	env: {
		JWT_SECRET: 'test-secret',
		JWT_EXPIRES_IN: 3600000, // 1 hour in ms
	},
}))

import jwt from 'jsonwebtoken'
import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import { logger } from '@/core/logger'
import { env } from '@/config/env'

describe('SessionService', () => {
	let service: SessionService
	let fakeRepo: SessionRepo
	let mockCache: any

	beforeEach(() => {
		fakeRepo = {
			getById: vi.fn(),
			create: vi.fn(),
			invalidate: vi.fn(),
			cleanupExpired: vi.fn(),
		} as any

		mockCache = {
			getOrSet: vi.fn(),
			deleteMany: vi.fn(),
		}

		vi.mocked(bento.namespace).mockReturnValue(mockCache)

		service = new SessionService(fakeRepo)
	})

	describe('getById', () => {
		it('should return session from cache', async () => {
			const sessionId = 1
			const mockSession: dto.SessionDto = {
				id: 1,
				userId: 1,
				createdAt: new Date(),
				expiredAt: new Date(),
			}

			vi.mocked(mockCache.getOrSet).mockImplementation(async ({ factory }) => {
				return await factory()
			})
			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(mockSession)

			const result = await service.getById(sessionId)

			expect(mockCache.getOrSet).toHaveBeenCalledWith({
				key: CACHE_KEY_DEFAULT.byId(sessionId),
				factory: expect.any(Function),
			})
			expect(result).toEqual(mockSession)
		})

		it('should return undefined when session not found', async () => {
			const sessionId = 999

			vi.mocked(mockCache.getOrSet).mockImplementation(async ({ factory }) => {
				return await factory()
			})
			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

			const result = await service.getById(sessionId)

			expect(result).toBeUndefined()
		})
	})

	describe('createSession', () => {
		it('should create session and return token', async () => {
			const mockUser: UserDto = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				passwordHash: 'hashed',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockSession: dto.SessionDto = {
				id: 1,
				userId: 1,
				createdAt: new Date(),
				expiredAt: new Date(Date.now() + env.JWT_EXPIRES_IN),
			}

			const mockToken = 'jwt-token'

			vi.spyOn(fakeRepo, 'create').mockResolvedValue(mockSession)
			vi.mocked(jwt.sign).mockReturnValue(mockToken)

			const result = await service.createSession(mockUser)

			expect(fakeRepo.create).toHaveBeenCalledWith({
				userId: 1,
				createdAt: expect.any(Date),
				expiredAt: expect.any(Date),
			})
			expect(jwt.sign).toHaveBeenCalledWith(
				{
					id: 1,
					userId: 1,
					email: 'test@example.com',
					username: 'testuser',
				},
				env.JWT_SECRET,
				{ expiresIn: env.JWT_EXPIRES_IN }
			)
			expect(result).toEqual({
				session: mockSession,
				token: mockToken,
			})
		})
	})

	describe('verifySession', () => {
		it('should verify valid token and return session', async () => {
			const token = 'valid-token'
			const mockDecoded = {
				id: 1,
				userId: 1,
				email: 'test@example.com',
				username: 'testuser',
			}

			const mockSession: dto.SessionDto = {
				id: 1,
				userId: 1,
				createdAt: new Date(),
				expiredAt: new Date(Date.now() + 3600000), // 1 hour from now
			}

			vi.mocked(jwt.verify).mockReturnValue(mockDecoded)
			vi.spyOn(service, 'getById').mockResolvedValue(mockSession)

			const result = await service.verifySession(token)

			expect(jwt.verify).toHaveBeenCalledWith(token, env.JWT_SECRET)
			expect(service.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockSession)
		})

		it('should return null when token is invalid', async () => {
			const token = 'invalid-token'

			vi.mocked(jwt.verify).mockImplementation(() => {
				throw new Error('Invalid token')
			})

			const result = await service.verifySession(token)

			expect(logger.error).toHaveBeenCalledWith(expect.any(Error), 'Failed to verify session')
			expect(result).toBeNull()
		})

		it('should return null when session not found', async () => {
			const token = 'valid-token'
			const mockDecoded = {
				id: 1,
				userId: 1,
				email: 'test@example.com',
				username: 'testuser',
			}

			vi.mocked(jwt.verify).mockReturnValue(mockDecoded)
			vi.spyOn(service, 'getById').mockResolvedValue(undefined)

			const result = await service.verifySession(token)

			expect(result).toBeNull()
		})

		it('should delete expired session and return null', async () => {
			const token = 'valid-token'
			const mockDecoded = {
				id: 1,
				userId: 1,
				email: 'test@example.com',
				username: 'testuser',
			}

			const mockSession: dto.SessionDto = {
				id: 1,
				userId: 1,
				createdAt: new Date(),
				expiredAt: new Date(Date.now() - 3600000), // 1 hour ago (expired)
			}

			vi.mocked(jwt.verify).mockReturnValue(mockDecoded)
			vi.spyOn(service, 'getById').mockResolvedValue(mockSession)
			vi.spyOn(service, 'deleteSession').mockResolvedValue(undefined)

			const result = await service.verifySession(token)

			expect(service.deleteSession).toHaveBeenCalledWith(1)
			expect(result).toBeNull()
		})
	})

	describe('deleteSession', () => {
		it('should delete session and invalidate cache', async () => {
			const sessionId = 1

			await service.deleteSession(sessionId)

			expect(fakeRepo.invalidate).toHaveBeenCalledWith(sessionId)
			expect(mockCache.deleteMany).toHaveBeenCalledWith({ keys: ['1'] })
		})
	})

	describe('cleanupExpired', () => {
		it('should cleanup expired sessions', async () => {
			await service.cleanupExpired()

			expect(fakeRepo.cleanupExpired).toHaveBeenCalled()
		})
	})
})

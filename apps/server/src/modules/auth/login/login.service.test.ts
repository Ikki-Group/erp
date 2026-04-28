import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { LoginService } from './login.service'
import { UnauthorizedError } from '@/core/http/errors'
import { verifyPassword } from '@/core/password'
import * as dto from './login.dto'
import type { UserService, UserDetailDto, UserDto } from '@/modules/iam'
import type { SessionService } from '../session/session.service'

// Mock the password module
vi.mock('@/core/password', () => ({
	verifyPassword: spyOn(),
}))

describe('LoginService', () => {
	let service: LoginService
	let fakeUserService: UserService
	let fakeSessionService: SessionService

	beforeEach(() => {
		fakeUserService = {
			getByIdentifier: spyOn(),
			getDetailById: spyOn(),
		} as any

		fakeSessionService = {
			createSession: spyOn(),
			verifySession: spyOn(),
		} as any

		service = new LoginService({
			user: fakeUserService,
			session: fakeSessionService,
		})
	})

	describe('login', () => {
		it('should login successfully with valid credentials', async () => {
			const loginData: dto.LoginDto = {
				identifier: 'test@example.com',
				password: 'password123',
			}

			const mockUser: UserDto = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				passwordHash: 'hashedPassword',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockUserDetail: UserDetailDto = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				fullName: 'Test User',
				roles: [],
				assignments: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockSession = {
				token: 'jwt-token',
				userId: 1,
				expiresAt: new Date(),
			}

			spyOn(fakeUserService, 'getByIdentifier').mockResolvedValue(mockUser)
			; (verifyPassword as any).mockResolvedValue(true)
			spyOn(fakeSessionService, 'createSession').mockResolvedValue(mockSession)
			spyOn(fakeUserService, 'getDetailById').mockResolvedValue(mockUserDetail)

			const result = await service.login(loginData)

			expect(fakeUserService.getByIdentifier).toHaveBeenCalledWith('test@example.com')
			expect(verifyPassword).toHaveBeenCalledWith('password123', 'hashedPassword')
			expect(fakeSessionService.createSession).toHaveBeenCalledWith(mockUser)
			expect(fakeUserService.getDetailById).toHaveBeenCalledWith(1)
			expect(result).toEqual({
				user: mockUserDetail,
				token: 'jwt-token',
			})
		})

		it('should throw error when user not found', async () => {
			const loginData: dto.LoginDto = {
				identifier: 'nonexistent@example.com',
				password: 'password123',
			}

			spyOn(fakeUserService, 'getByIdentifier').mockResolvedValue(undefined)

			await expect(service.login(loginData)).rejects.toThrow(
				new UnauthorizedError('User not found', 'AUTH_USER_NOT_FOUND')
			)
		})

		it('should throw error when user is inactive', async () => {
			const loginData: dto.LoginDto = {
				identifier: 'inactive@example.com',
				password: 'password123',
			}

			const mockUser: UserDto = {
				id: 1,
				email: 'inactive@example.com',
				username: 'inactive',
				passwordHash: 'hashedPassword',
				isActive: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeUserService, 'getByIdentifier').mockResolvedValue(mockUser)

			await expect(service.login(loginData)).rejects.toThrow(
				new UnauthorizedError('User not found', 'AUTH_USER_NOT_FOUND')
			)
		})

		it('should throw error when password is invalid', async () => {
			const loginData: dto.LoginDto = {
				identifier: 'test@example.com',
				password: 'wrongpassword',
			}

			const mockUser: UserDto = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				passwordHash: 'hashedPassword',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeUserService, 'getByIdentifier').mockResolvedValue(mockUser)
			; (verifyPassword as any).mockResolvedValue(false)

			await expect(service.login(loginData)).rejects.toThrow(
				new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS')
			)
		})
	})

	describe('verifyToken', () => {
		it('should verify token and return user', async () => {
			const token = 'valid-jwt-token'
			const mockSession = {
				userId: 1,
				token: 'valid-jwt-token',
				expiresAt: new Date(),
			}

			const mockUser: UserDetailDto = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				fullName: 'Test User',
				roles: [],
				assignments: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeSessionService, 'verifySession').mockResolvedValue(mockSession)
			spyOn(fakeUserService, 'getDetailById').mockResolvedValue(mockUser)

			const result = await service.verifyToken(token)

			expect(fakeSessionService.verifySession).toHaveBeenCalledWith(token)
			expect(fakeUserService.getDetailById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockUser)
		})

		it('should throw error when token is invalid', async () => {
			const token = 'invalid-jwt-token'

			spyOn(fakeSessionService, 'verifySession').mockResolvedValue(undefined)

			await expect(service.verifyToken(token)).rejects.toThrow(
				new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS')
			)
		})
	})

	describe('getById', () => {
		it('should return user detail by id', async () => {
			const userId = 1
			const mockUser: UserDetailDto = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				fullName: 'Test User',
				roles: [],
				assignments: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeUserService, 'getDetailById').mockResolvedValue(mockUser)

			const result = await service.getById(userId)

			expect(fakeUserService.getDetailById).toHaveBeenCalledWith(userId)
			expect(result).toEqual(mockUser)
		})
	})
})

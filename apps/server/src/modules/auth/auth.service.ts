import { record } from '@/infra/otel/otel.ts'
import { invalidateAuthCache } from '@/shared/auth/access-cache.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import type { SessionStore } from '@/shared/auth/session.port.ts'
import { SESSION_TTL_DAYS } from '@/shared/config/index.ts'
import { verifyPassword } from '@/shared/utils/index.ts'

import type { AssignmentService } from '@/modules/iam/assignment/assignment.service.ts'
import type { IUserRepo } from '@/modules/iam/user/user.repo.ts'
import type { LocationService } from '@/modules/location/location.service.ts'

import type { LoginDto, LoginResponseDto, MeResponseDto } from './auth.contract.ts'
import { AuthError } from './auth.internal.ts'

// ─── Dependencies ───

export interface AuthServiceDeps {
	userRepo: IUserRepo
	assignmentService: AssignmentService
	locationService: LocationService
	sessionStore: SessionStore
}

// ─── Internal Result ───

export interface LoginResult {
	sessionId: string
	expiresAt: Date
	response: LoginResponseDto
}

// ─── Service ───

export class AuthService {
	constructor(private readonly deps: AuthServiceDeps) {}

	// ─── Login ───

	async handleLogin(data: LoginDto): Promise<LoginResult> {
		return record('auth.login', async () => {
			// 1. Find user by username
			const user = await this.deps.userRepo.findByUsername(data.username)
			if (!user) throw AuthError.invalidCredentials()

			// 2. Check if user is active
			if (!user.isActive) throw AuthError.userDeactivated()

			// 3. Verify password
			const valid = await verifyPassword(data.password, user.passwordHash)
			if (!valid) throw AuthError.invalidCredentials()

			// 4. Resolve user's assigned locations
			const assignments = await this.deps.assignmentService.findByUserId(user.id)
			const locationIds = [
				...new Set(assignments.map((a) => a.locationId).filter((id): id is number => id !== null)),
			]

			const validLocations = assignments.some((assignment) => assignment.locationId === null)
				? await this.deps.locationService.getAll()
				: await this.deps.locationService.getByIds(locationIds)

			// 5. Create session
			const sessionId = crypto.randomUUID()
			const expiresAt = new Date()
			expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS)

			await this.deps.sessionStore.create({
				id: sessionId,
				userId: user.id,
				expiresAt,
			})

			return {
				sessionId,
				expiresAt,
				response: {
					user: {
						id: user.id,
						username: user.username,
						name: user.name,
						email: user.email,
					},
					locations: validLocations.map((loc) => ({
						id: loc.id,
						code: loc.code,
						name: loc.name,
						type: loc.type,
					})),
					activeLocationId: null,
				},
			}
		})
	}

	// ─── Logout ───

	async handleLogout(sessionId: string): Promise<void> {
		const session = await this.deps.sessionStore.get(sessionId)
		await this.deps.sessionStore.delete(sessionId)
		if (session) await invalidateAuthCache(session.userId)
	}

	// ─── Me ───

	async handleMe(auth: AuthContext): Promise<MeResponseDto> {
		// Resolve user info
		const userRow = await this.deps.userRepo.findByIdRaw(auth.userId)
		if (!userRow) throw AuthError.sessionExpired()

		const locations = auth.isOwner
			? await this.deps.locationService.getAll()
			: await this.deps.locationService.getByIds(
					Object.keys(auth.access ?? {}).map((locationId) => Number(locationId)),
				)

		// Resolve active location
		let activeLocation: MeResponseDto['activeLocation'] = null
		if (auth.locationId) {
			const loc = await this.deps.locationService.getById(auth.locationId)
			if (loc) {
				activeLocation = {
					id: loc.id,
					code: loc.code,
					name: loc.name,
					type: loc.type,
				}
			}
		}

		return {
			user: {
				id: userRow.id,
				username: userRow.username,
				name: userRow.name,
				email: userRow.email,
			},
			locations: locations.map((loc) => ({
				id: loc.id,
				code: loc.code,
				name: loc.name,
				type: loc.type,
			})),
			activeLocation,
			permissions: auth.permissions,
			globalPermissions: auth.globalPermissions ?? auth.permissions,
			access: auth.access ?? {},
			isOwner: auth.isOwner,
		}
	}
}

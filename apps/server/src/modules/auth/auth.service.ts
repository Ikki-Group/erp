import { record } from '@/infra/otel/otel.ts'
import type { sessionStore as SessionStore } from '@/infra/session/index.ts'
import { invalidateAuthCache } from '@/server/plugins/auth.plugin.ts'
import { SESSION_TTL_DAYS } from '@/shared/config/index.ts'
import { verifyPassword } from '@/shared/utils/index.ts'

import type { AssignmentService } from '@/modules/iam/assignment/assignment.service.ts'
import type { IUserRepo } from '@/modules/iam/user/user.repo.ts'
import type { LocationService } from '@/modules/location/location.service.ts'

import type {
	LoginDto,
	LoginResponseDto,
	MeResponseDto,
	SwitchLocationResponseDto,
} from './auth.contract.ts'
import { AuthError } from './auth.internal.ts'

// ─── Dependencies ───

export interface AuthServiceDeps {
	userRepo: IUserRepo
	assignmentService: AssignmentService
	locationService: LocationService
	sessionStore: typeof SessionStore
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

			const locations = await Promise.all(
				locationIds.map((id) => this.deps.locationService.getById(id)),
			)
			const validLocations = locations.filter(
				(loc): loc is NonNullable<typeof loc> => loc !== undefined,
			)

			// 5. Create session
			const sessionId = crypto.randomUUID()
			const expiresAt = new Date()
			expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS)

			await this.deps.sessionStore.create({
				id: sessionId,
				userId: user.id,
				locationId: null,
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
		await this.deps.sessionStore.delete(sessionId)
		await invalidateAuthCache(sessionId)
	}

	// ─── Switch Location ───

	async handleSwitchLocation(
		sessionId: string,
		locationId: number,
		userId: number,
	): Promise<SwitchLocationResponseDto> {
		// 1. Verify user has access to this location (or is owner)
		const assignments = await this.deps.assignmentService.findByUserId(userId)
		const isOwner = assignments.some((a) => a.locationId === null) // global assignment = potential owner

		if (!isOwner) {
			const hasAccess = assignments.some((a) => a.locationId === locationId)
			if (!hasAccess) throw AuthError.locationNotAuthorized(locationId)
		}

		// 2. Verify location exists
		const location = await this.deps.locationService.getById(locationId)
		if (!location) throw AuthError.locationNotAuthorized(locationId)

		// 3. Update session
		await this.deps.sessionStore.updateLocation(sessionId, locationId)
		await invalidateAuthCache(sessionId)

		return {
			activeLocation: {
				id: location.id,
				code: location.code,
				name: location.name,
				type: location.type,
			},
		}
	}

	// ─── Me ───

	async handleMe(auth: {
		userId: number
		locationId: number | null
		permissions: string[]
		isOwner: boolean
	}): Promise<MeResponseDto> {
		// Resolve user info
		const userRow = await this.deps.userRepo.findByIdRaw(auth.userId)
		if (!userRow) throw AuthError.sessionExpired()

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
			activeLocation,
			permissions: auth.permissions,
			isOwner: auth.isOwner,
		}
	}
}

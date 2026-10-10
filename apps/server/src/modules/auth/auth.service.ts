import { record } from '@/infra/otel/otel.ts'
import { getUserAccess, invalidateUserAccess } from '@/server/auth/access.ts'
import type { UserAccess } from '@/server/auth/access.ts'
import { forgetSessions, newSessionToken } from '@/server/auth/session.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import { hashPassword, verifyPassword } from '@/shared/utils/index.ts'

import type { UserService } from '@/modules/iam/index.ts'
import type { LocationService } from '@/modules/location/index.ts'

import { AuthError } from './auth.internal.ts'
import type { SessionRepo } from './session/session.repo.ts'
import type { LoginDto, LoginResponseDto, MeResponseDto } from '@ikki/contract/auth'
import type { RevokeSessionResultDto, SessionDto } from '@ikki/contract/auth/session'
import type { UserDetailDto } from '@ikki/contract/iam/composed'
import type { LocationDto } from '@ikki/contract/location'

export interface AuthServiceDeps {
	users: Pick<UserService, 'findCredentials'> & {
		handleUserDetail(id: number): Promise<UserDetailDto>
	}
	locations: Pick<LocationService, 'getAll' | 'getByIds'>
	sessions: SessionRepo
}

export interface LoginDevice {
	userAgent?: string | undefined
	ipAddress?: string | undefined
}

function toLoginLocation(location: LocationDto) {
	return { id: location.id, code: location.code, name: location.name, type: location.type }
}

export class AuthService {
	constructor(private readonly deps: AuthServiceDeps) {}

	handleLogin(data: LoginDto, device: LoginDevice = {}): Promise<LoginResponseDto> {
		return record('auth.login', async () => {
			const user = await this.deps.users.findCredentials(data.username)
			// Verify even for unknown users so response time doesn't leak which usernames exist.
			const valid = await verifyPassword(data.password, user?.passwordHash ?? (await dummyHash))
			if (!user || !valid) throw AuthError.invalidCredentials()
			if (!user.isActive) throw AuthError.userDeactivated()

			const { token, id, expiresAt } = newSessionToken()
			await this.deps.sessions.insert({
				id,
				userId: user.id,
				userAgent: device.userAgent?.slice(0, 500) ?? null,
				ipAddress: device.ipAddress?.slice(0, 100) ?? null,
				expiresAt,
			})

			const locations = await this.#accessibleLocations(await getUserAccess(user.id))
			return {
				token,
				user: { id: user.id, username: user.username, name: user.name, email: user.email },
				locations: locations.map(toLoginLocation),
			}
		})
	}

	async handleLogout(auth: AuthContext): Promise<void> {
		await this.deps.sessions.revoke(auth.sessionId)
		await forgetSessions([auth.sessionId])
		await invalidateUserAccess(auth.userId)
	}

	async handleListSessions(auth: AuthContext): Promise<SessionDto[]> {
		const rows = await this.deps.sessions.findActiveByUserId(auth.userId)
		return rows.map((row) => ({
			id: row.id,
			userAgent: row.userAgent,
			ipAddress: row.ipAddress,
			createdAt: row.createdAt,
			lastSeenAt: row.lastSeenAt,
			expiresAt: row.expiresAt,
			isCurrent: row.id === auth.sessionId,
		}))
	}

	async handleRevokeSession(auth: AuthContext, sessionId: string): Promise<void> {
		const session = await this.deps.sessions.findById(sessionId)
		if (!session || session.userId !== auth.userId) throw AuthError.sessionNotFound()
		await this.deps.sessions.revoke(sessionId)
		await forgetSessions([sessionId])
	}

	async handleRevokeOtherSessions(auth: AuthContext): Promise<RevokeSessionResultDto> {
		const revoked = await this.deps.sessions.revokeAllForUser(auth.userId, auth.sessionId)
		await forgetSessions(revoked)
		return { revoked: revoked.length }
	}

	async handleMe(auth: AuthContext): Promise<MeResponseDto> {
		const [user, access] = await Promise.all([
			this.deps.users.handleUserDetail(auth.userId),
			getUserAccess(auth.userId),
		])
		const locations = await this.#accessibleLocations(access)
		return {
			user,
			locations: locations.map(toLoginLocation),
			permissions: auth.permissions,
			globalPermissions: auth.globalPermissions,
			access: auth.access,
			isOwner: auth.isOwner,
		}
	}

	#accessibleLocations(access: UserAccess): Promise<LocationDto[]> {
		if (access.isOwner || access.hasGlobalAssignment) return this.deps.locations.getAll()
		return this.deps.locations.getByIds(Object.keys(access.access).map(Number))
	}
}

/** Hash of a random secret; only used to equalize timing for unknown usernames. */
const dummyHash = hashPassword(crypto.randomUUID())

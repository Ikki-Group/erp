import { record } from '@/infra/otel/otel.ts'
import { invalidateAuthCache } from '@/shared/auth/access-cache.ts'
import { effectivePermissions } from '@/shared/auth/permission.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import type { SessionStore } from '@/shared/auth/session.port.ts'
import { SESSION_TTL_DAYS } from '@/shared/config/index.ts'
import { verifyPassword } from '@/shared/utils/index.ts'

import type { AssignmentService, ComposedService } from '@/modules/iam'
import type { IUserRepo } from '@/modules/iam/user/user.repo.ts'
import type { LocationService } from '@/modules/location/location.service.ts'

import type { LoginDto, LoginResponseDto, MeResponseDto } from './auth.contract.ts'
import { AuthError } from './auth.internal.ts'
import type { RevokeSessionResultDto, SessionDto } from './session/session.contract.ts'
import type { ISessionRepo, SessionRow } from './session/session.repo.ts'

// ─── Dependencies ───

export interface AuthServiceDeps {
	userRepo: IUserRepo
	assignmentService: AssignmentService
	composedService: ComposedService
	locationService: LocationService
	sessionStore: SessionStore
	sessionRepo: ISessionRepo
}

// ─── Internal Result ───

export interface LoginResult {
	sessionId: string
	expiresAt: Date
	response: LoginResponseDto
}

export interface LoginDeviceContext {
	userAgent?: string | undefined
	ipAddress?: string | undefined
}

// ─── Service ───

function locationIdsFromAssignments(
	assignments: ReadonlyArray<{ locationId: number | null }>,
): number[] {
	return [
		...new Set(
			assignments
				.map((assignment) => assignment.locationId)
				.filter((locationId): locationId is number => locationId !== null),
		),
	]
}

function hasGlobalAssignment(
	assignments: ReadonlyArray<{ locationId: number | null }>,
	isOwner = false,
): boolean {
	return isOwner || assignments.some((assignment) => assignment.locationId === null)
}

function toSessionDto(row: SessionRow, currentSessionId: string): SessionDto {
	return {
		id: row.id,
		userAgent: row.userAgent,
		ipAddress: row.ipAddress,
		createdAt: row.createdAt,
		lastSeenAt: row.lastSeenAt,
		expiresAt: row.expiresAt,
		isCurrent: row.id === currentSessionId,
	}
}

export class AuthService {
	constructor(private readonly deps: AuthServiceDeps) {}

	// ─── Login ───

	async handleLogin(data: LoginDto, device: LoginDeviceContext = {}): Promise<LoginResult> {
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
			const locationIds = locationIdsFromAssignments(assignments)
			const validLocations = hasGlobalAssignment(assignments)
				? await this.deps.locationService.getAll()
				: await this.deps.locationService.getByIds(locationIds)

			// 5. Create session — DB is the source of truth, cache is the fast-path lookup.
			const sessionId = crypto.randomUUID()
			const expiresAt = new Date()
			expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS)

			await this.deps.sessionRepo.insert({
				id: sessionId,
				userId: user.id,
				userAgent: device.userAgent ?? null,
				ipAddress: device.ipAddress ?? null,
				expiresAt,
			})
			await this.deps.sessionStore.create({
				id: sessionId,
				userId: user.id,
				expiresAt,
			})

			return {
				sessionId,
				expiresAt,
				response: {
					token: sessionId,
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
				},
			}
		})
	}

	// ─── Logout ───

	async handleLogout(auth: AuthContext): Promise<void> {
		await this.deps.sessionRepo.revoke(auth.sessionId)
		await this.deps.sessionStore.delete(auth.sessionId)
		await invalidateAuthCache(auth.userId)
	}

	// ─── Session management (device list / revoke) ───

	async handleListSessions(auth: AuthContext): Promise<SessionDto[]> {
		const rows = await this.deps.sessionRepo.findActiveByUserId(auth.userId)
		return rows.map((row) => toSessionDto(row, auth.sessionId))
	}

	async handleRevokeSession(auth: AuthContext, sessionId: string): Promise<void> {
		const session = await this.deps.sessionRepo.findById(sessionId)
		if (!session || session.userId !== auth.userId) throw AuthError.sessionNotFound()

		await this.deps.sessionRepo.revoke(sessionId)
		await this.deps.sessionStore.delete(sessionId)
	}

	async handleRevokeOtherSessions(auth: AuthContext): Promise<RevokeSessionResultDto> {
		const revokedIds = await this.deps.sessionRepo.revokeAllForUser(auth.userId, auth.sessionId)
		await Promise.all(revokedIds.map((id) => this.deps.sessionStore.delete(id)))
		return { revoked: revokedIds.length }
	}

	// ─── Me ───

	async handleMe(auth: AuthContext): Promise<MeResponseDto> {
		// Use the IAM domain projection so /me stays aligned with user detail.
		const user = await this.deps.composedService.handleUserDetail(auth.userId)

		const globalPermissions = [
			...new Set(auth.globalPermissions ?? (auth.locationId === null ? auth.permissions : [])),
		]
		const access = auth.access ?? {}
		const hasGlobal = hasGlobalAssignment(user.assignments, auth.isOwner)
		const assignedLocationIds = locationIdsFromAssignments(user.assignments)

		const locations = hasGlobal
			? await this.deps.locationService.getAll()
			: await this.deps.locationService.getByIds(assignedLocationIds)
		const permissions = effectivePermissions({ ...auth, globalPermissions, access })

		return {
			user,
			locations: locations.map((loc) => ({
				id: loc.id,
				code: loc.code,
				name: loc.name,
				type: loc.type,
			})),
			permissions,
			globalPermissions,
			access,
			isOwner: auth.isOwner,
		}
	}
}

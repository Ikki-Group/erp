import { requirePermission } from '@/shared/auth/index.ts'
import type { AuthContext } from '@/shared/auth/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type { AuditLogDetailDto, AuditLogDto, AuditLogFilterDto } from './audit.contract.ts'
import { AuditError } from './audit.internal.ts'
import type { IAuditRepo } from './audit.repo.ts'

// ─── Constants ───

const PERMISSION_READ = 'core:audit:read'

// ─── Service ───

export class AuditService {
	constructor(private readonly repo: IAuditRepo) {}

	async handleList(
		filter: AuditLogFilterDto,
		auth: AuthContext,
	): Promise<WithPaginationResult<AuditLogDto>> {
		requirePermission(auth, PERMISSION_READ)
		return this.repo.findPage(filter)
	}

	async handleDetail(id: number, auth: AuthContext): Promise<AuditLogDetailDto> {
		requirePermission(auth, PERMISSION_READ)
		const entry = await this.repo.findById(id)
		if (!entry) throw AuditError.notFound(id)
		return entry
	}

	async handleByEntity(
		entity: string,
		entityId: number,
		auth: AuthContext,
	): Promise<AuditLogDto[]> {
		requirePermission(auth, PERMISSION_READ)
		return this.repo.findByEntity(entity, entityId)
	}
}

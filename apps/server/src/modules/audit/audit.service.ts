import type { WithCursorResult, WithPaginationResult } from '@/shared/types/pagination.ts'

import type {
	AuditLogCursorFilterDto,
	AuditLogDetailDto,
	AuditLogDto,
	AuditLogFilterDto,
} from './audit.contract.ts'
import { AuditError } from './audit.internal.ts'
import type { IAuditRepo } from './audit.repo.ts'

// ─── Service ───

/** Company-wide, read-only audit feed; routes gate it behind `audit.read`. */
export class AuditService {
	constructor(private readonly repo: IAuditRepo) {}

	handleList(filter: AuditLogFilterDto): Promise<WithPaginationResult<AuditLogDto>> {
		return this.repo.findPage(filter)
	}

	handleCursorList(filter: AuditLogCursorFilterDto): Promise<WithCursorResult<AuditLogDto>> {
		return this.repo.findCursorPage(filter)
	}

	async handleDetail(id: number): Promise<AuditLogDetailDto> {
		const entry = await this.repo.findById(id)
		if (!entry) throw AuditError.notFound(id)
		return entry
	}

	handleByEntity(entity: string, entityId: number): Promise<AuditLogDto[]> {
		return this.repo.findByEntity(entity, entityId)
	}
}

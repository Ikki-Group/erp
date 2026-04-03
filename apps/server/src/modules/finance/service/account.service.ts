import { record } from '@elysiajs/opentelemetry'
import { and, eq, ilike, count, isNull, or } from 'drizzle-orm'

import { checkConflict, paginate, sortBy, stampCreate, stampUpdate, takeFirstOrThrow } from '@/core/database'
import { NotFoundError, BadRequestError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'
import { db } from '@/db'
import { accountsTable } from '@/db/schema/finance'

import { AccountDto, type AccountCreateDto, type AccountFilterDto, type AccountUpdateDto } from '../dto/account.dto'

export class AccountService {
  async handleList(filter: AccountFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<AccountDto>> {
    return record('AccountService.handleList', async () => {
      const { search, type, parentId } = filter

      const searchCondition = search
        ? or(ilike(accountsTable.name, `%${search}%`), ilike(accountsTable.code, `%${search}%`))
        : undefined

      const where = and(
        isNull(accountsTable.deletedAt),
        searchCondition,
        type ? eq(accountsTable.type, type) : undefined,
        parentId !== undefined ? eq(accountsTable.parentId, parentId) : undefined,
      )

      const result = await paginate({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(accountsTable)
            .where(where)
            .orderBy(sortBy(accountsTable.code, 'asc')) // Accounts generally ordered by code
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(accountsTable).where(where),
      })

      return { data: result.data.map((row) => AccountDto.parse(row)), meta: result.meta }
    })
  }

  async handleDetail(id: number): Promise<AccountDto> {
    return record('AccountService.handleDetail', async () => {
      const rows = await db
        .select()
        .from(accountsTable)
        .where(and(eq(accountsTable.id, id), isNull(accountsTable.deletedAt)))
      if (rows.length === 0) throw new NotFoundError(`Account ${id} not found`, 'ACCOUNT_NOT_FOUND')
      return AccountDto.parse(takeFirstOrThrow(rows, 'Account detail not found', 'ACCOUNT_NOT_FOUND'))
    })
  }

  async handleCreate(data: AccountCreateDto, userId: number): Promise<{ id: number }> {
    return record('AccountService.handleCreate', async () => {
      await checkConflict({
        table: accountsTable,
        pkColumn: accountsTable.id,
        fields: [{ field: 'code', column: accountsTable.code, message: 'Account code already exists', code: 'ACCOUNT_CODE_IN_USE' }],
        input: data,
      })

      if (data.parentId) {
        const parent = await this.handleDetail(data.parentId)
        if (!parent.isGroup) {
          throw new BadRequestError('Parent account must be a group account', 'INVALID_PARENT_ACCOUNT')
        }
      }

      const stamps = stampCreate(userId)
      const rows = await db.insert(accountsTable).values({ ...data, ...stamps }).returning({ id: accountsTable.id })
      
      return takeFirstOrThrow(rows, 'Failed to return account data on create', 'ACCOUNT_CREATE_ERROR')
    })
  }

  async handleUpdate(id: number, data: Omit<AccountUpdateDto, 'id'>, userId: number): Promise<{ id: number }> {
    return record('AccountService.handleUpdate', async () => {
      const existing = await this.handleDetail(id)

      await checkConflict({
        table: accountsTable,
        pkColumn: accountsTable.id,
        fields: [{ field: 'code', column: accountsTable.code, message: 'Account code already exists', code: 'ACCOUNT_CODE_IN_USE' }],
        input: data,
        existing,
      })

      if (data.parentId && data.parentId !== existing.parentId) {
        if (data.parentId === id) throw new BadRequestError('Account cannot be its own parent', 'INVALID_PARENT_ACCOUNT')
        const parent = await this.handleDetail(data.parentId)
        if (!parent.isGroup) {
          throw new BadRequestError('Parent account must be a group account', 'INVALID_PARENT_ACCOUNT')
        }
      }

      const stamps = stampUpdate(userId)
      const rows = await db
        .update(accountsTable)
        .set({ ...data, ...stamps })
        .where(eq(accountsTable.id, id))
        .returning({ id: accountsTable.id })

      return takeFirstOrThrow(rows, `Account ${id} not found on update`, 'ACCOUNT_NOT_FOUND')
    })
  }

  async handleRemove(id: number, userId: number): Promise<{ id: number }> {
    return record('AccountService.handleRemove', async () => {
      // Check if it has any children
      const children = await db.select({ id: accountsTable.id }).from(accountsTable).where(and(eq(accountsTable.parentId, id), isNull(accountsTable.deletedAt))).limit(1)
      if (children.length > 0) {
        throw new BadRequestError('Cannot delete account with existing sub-accounts', 'ACCOUNT_HAS_CHILDREN')
      }

      const rows = await db
        .update(accountsTable)
        .set({ deletedAt: new Date(), deletedBy: userId })
        .where(eq(accountsTable.id, id))
        .returning({ id: accountsTable.id })

      return takeFirstOrThrow(rows, `Account ${id} not found on remove`, 'ACCOUNT_NOT_FOUND')
    })
  }
}

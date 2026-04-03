import { record } from '@elysiajs/opentelemetry'
import { and, eq, ilike, count, isNull, or } from 'drizzle-orm'

import { checkConflict, paginate, sortBy, stampCreate, stampUpdate, takeFirstOrThrow } from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'
import { db } from '@/db'
import { employeesTable } from '@/db/schema/employee'

import { EmployeeDto, type EmployeeCreateDto, type EmployeeFilterDto, type EmployeeUpdateDto } from '../dto/employee.dto'

export class EmployeeService {
  async handleList(filter: EmployeeFilterDto, pq: PaginationQuery): Promise<WithPaginationResult<EmployeeDto>> {
    return record('EmployeeService.handleList', async () => {
      const { search } = filter

      const searchCondition = search
        ? or(ilike(employeesTable.name, `%${search}%`), ilike(employeesTable.code, `%${search}%`))
        : undefined

      const where = and(isNull(employeesTable.deletedAt), searchCondition)

      const result = await paginate({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(employeesTable)
            .where(where)
            .orderBy(sortBy(employeesTable.updatedAt, 'desc'))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(employeesTable).where(where),
      })

      return { data: result.data.map((row) => EmployeeDto.parse(row)), meta: result.meta }
    })
  }

  async handleDetail(id: number): Promise<EmployeeDto> {
    return record('EmployeeService.handleDetail', async () => {
      const rows = await db
        .select()
        .from(employeesTable)
        .where(and(eq(employeesTable.id, id), isNull(employeesTable.deletedAt)))
      if (rows.length === 0) throw new NotFoundError(`Employee ${id} not found`, 'EMPLOYEE_NOT_FOUND')
      return EmployeeDto.parse(takeFirstOrThrow(rows, `Employee ${id} not found`, 'EMPLOYEE_NOT_FOUND'))
    })
  }

  async handleCreate(data: EmployeeCreateDto, userId: number): Promise<{ id: number }> {
    return record('EmployeeService.handleCreate', async () => {
      await checkConflict({
        table: employeesTable,
        pkColumn: employeesTable.id,
        fields: [{ field: 'code', column: employeesTable.code, message: 'Employee code already exists', code: 'EMPLOYEE_CODE_ALREADY_EXISTS' }],
        input: data,
      })

      const stamps = stampCreate(userId)
      const rows = await db.insert(employeesTable).values({ ...data, ...stamps }).returning({ id: employeesTable.id })
      
      return takeFirstOrThrow(rows, 'Failed to return employee data on create', 'EMPLOYEE_CREATE_ERROR')
    })
  }

  async handleUpdate(id: number, data: Omit<EmployeeUpdateDto, 'id'>, userId: number): Promise<{ id: number }> {
    return record('EmployeeService.handleUpdate', async () => {
      const existing = await this.handleDetail(id)

      await checkConflict({
        table: employeesTable,
        pkColumn: employeesTable.id,
        fields: [{ field: 'code', column: employeesTable.code, message: 'Employee code already exists', code: 'EMPLOYEE_CODE_ALREADY_EXISTS' }],
        input: data,
        existing,
      })

      const stamps = stampUpdate(userId)
      const rows = await db
        .update(employeesTable)
        .set({ ...data, ...stamps })
        .where(eq(employeesTable.id, id))
        .returning({ id: employeesTable.id })

      return takeFirstOrThrow(rows, `Employee ${id} not found on update`, 'EMPLOYEE_NOT_FOUND')
    })
  }

  async handleRemove(id: number, userId: number): Promise<{ id: number }> {
    return record('EmployeeService.handleRemove', async () => {
      const rows = await db
        .update(employeesTable)
        .set({ deletedAt: new Date(), deletedBy: userId })
        .where(eq(employeesTable.id, id))
        .returning({ id: employeesTable.id })

      return takeFirstOrThrow(rows, `Employee ${id} not found on remove`, 'EMPLOYEE_NOT_FOUND')
    })
  }
}

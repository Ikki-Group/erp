import type { PgSelect } from 'drizzle-orm/pg-core'

import { users } from '@/database/schema'
import { db } from '@/database'

interface Filter {
  search?: string
  isActive?: boolean
}

export class IamUsersService {
  queryBuilder(filter: Filter) {
    const a = db.select().from(users).$dynamic()
    const res = withPagination(a).prepare('list')

    return res
  }

  async list(filter: Filter) {
    const q = await this.queryBuilder(filter).execute()
    console.log(q)
  }

  async listPaginated(filter: Filter) {}

  async count(filter: Filter) {}

  async create() {}

  async update(id: number) {}

  async delete(id: number) {}
}

function withPagination<T extends PgSelect>(qb: T, page = 1, pageSize = 10) {
  return qb.limit(pageSize).offset((page - 1) * pageSize)
}

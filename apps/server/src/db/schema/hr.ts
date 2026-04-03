import {
  integer,
  pgTable,
  text,
  timestamp,
  pgEnum,
  time,
} from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'
import { employeesTable } from './employee'
import { locationsTable } from './location'

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present',
  'absent',
  'late',
  'on_leave',
])

export const shiftsTable = pgTable(
  'shifts',
  {
    ...pk,
    name: text().notNull(), // e.g., 'Morning Shift', 'Night Shift'
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    note: text(),
    ...auditColumns,
  }
)

export const attendancesTable = pgTable(
  'attendances',
  {
    ...pk,
    employeeId: integer('employee_id')
      .notNull()
      .references(() => employeesTable.id),
    locationId: integer('location_id')
      .notNull()
      .references(() => locationsTable.id),
    shiftId: integer('shift_id')
      .references(() => shiftsTable.id),
    
    date: timestamp({ mode: 'date' }).notNull().defaultNow(),
    clockIn: timestamp('clock_in', { mode: 'date' }),
    clockOut: timestamp('clock_out', { mode: 'date' }),
    
    status: attendanceStatusEnum().notNull().default('present'),
    note: text(),
    
    ...auditColumns,
  }
)

import { record } from '@elysiajs/opentelemetry'
import { and, eq, isNull, sql } from 'drizzle-orm'

import {
  stampCreate,
  stampUpdate,
  takeFirstOrThrow,
} from '@/core/database'
import { ConflictError, NotFoundError } from '@/core/http/errors'
import { db } from '@/db'
import {
  employeesTable,
  payrollAdjustmentsTable,
  payrollBatchesTable,
  payrollItemsTable,
} from '@/db/schema'

import type {
  PayrollBatchCreateDto,
  PayrollBatchDto,
  PayrollAdjustmentCreateDto,
  PayrollAdjustmentDto,
} from '../dto/payroll.dto'

export class PayrollService {
  async handleBatchCreate(data: PayrollBatchCreateDto, actorId: number): Promise<PayrollBatchDto> {
    return record('PayrollService.handleBatchCreate', async () => {
      // 1. Check if batch for this period already exists and is not cancelled
      const existing = await db
        .select()
        .from(payrollBatchesTable)
        .where(
          and(
            eq(payrollBatchesTable.periodMonth, data.periodMonth),
            eq(payrollBatchesTable.periodYear, data.periodYear),
            isNull(payrollBatchesTable.deletedAt),
          )
        )
      
      if (existing.length > 0) {
          throw new ConflictError(`Payroll batch for ${data.periodMonth}/${data.periodYear} already exists`)
      }

      return db.transaction(async (tx) => {
        const metadata = stampCreate(actorId)
        
        // 2. Create batch
        const [batch] = await tx
          .insert(payrollBatchesTable)
          .values({
            name: data.name,
            periodMonth: data.periodMonth,
            periodYear: data.periodYear,
            status: 'draft',
            totalAmount: '0',
            note: data.note ?? null,
            ...metadata,
          })
          .returning()

        // 3. Get all active employees
        const employees = await tx
          .select()
          .from(employeesTable)
          .where(isNull(employeesTable.deletedAt))

        // 4. Create payroll items for each employee
        let totalAmount = 0
        for (const emp of employees) {
          totalAmount += Number(emp.baseSalary)
          await tx.insert(payrollItemsTable).values({
            batchId: batch.id,
            employeeId: emp.id,
            baseSalary: emp.baseSalary,
            adjustmentsAmount: '0',
            serviceChargeAmount: '0',
            totalAmount: emp.baseSalary,
            ...metadata,
          })
        }

        // 5. Update batch total amount
        const result = await tx
          .update(payrollBatchesTable)
          .set({ totalAmount: totalAmount.toString() })
          .where(eq(payrollBatchesTable.id, batch.id))
          .returning()

        return result[0] as unknown as PayrollBatchDto
      })
    })
  }

  async handleAddAdjustment(data: PayrollAdjustmentCreateDto, actorId: number): Promise<PayrollAdjustmentDto> {
    return record('PayrollService.handleAddAdjustment', async () => {
       return db.transaction(async (tx) => {
         const metadata = stampCreate(actorId)
         
         // 1. Create adjustment
         const [adjustment] = await tx
           .insert(payrollAdjustmentsTable)
           .values({
             payrollItemId: data.payrollItemId,
             type: data.type,
             amount: data.amount,
             reason: data.reason,
             ...metadata
           })
           .returning()
         
         // 2. Update item totals
         const [item] = await tx
           .select()
           .from(payrollItemsTable)
           .where(eq(payrollItemsTable.id, data.payrollItemId))
         
         if (!item) throw new NotFoundError('Payroll item not found')

         const currentAdjustments = Number(item.adjustmentsAmount)
         const adjustmentAmount = data.type === 'addition' ? Number(data.amount) : -Number(data.amount)
         const newAdjustments = currentAdjustments + adjustmentAmount
         const newTotal = Number(item.baseSalary) + newAdjustments + Number(item.serviceChargeAmount)

         await tx
           .update(payrollItemsTable)
           .set({
             adjustmentsAmount: newAdjustments.toString(),
             totalAmount: newTotal.toString(),
             ...stampUpdate(actorId)
           })
           .where(eq(payrollItemsTable.id, item.id))
         
         // 3. Update batch total
         const [batch] = await tx
           .select()
           .from(payrollBatchesTable)
           .where(eq(payrollBatchesTable.id, item.batchId))
         
         const newBatchTotal = Number(batch.totalAmount) + adjustmentAmount
         await tx
           .update(payrollBatchesTable)
           .set({
             totalAmount: newBatchTotal.toString(),
             ...stampUpdate(actorId)
           })
           .where(eq(payrollBatchesTable.id, batch.id))

         return adjustment as unknown as PayrollAdjustmentDto
       })
    })
  }
}

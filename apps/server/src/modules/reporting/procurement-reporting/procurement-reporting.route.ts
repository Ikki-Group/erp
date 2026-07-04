import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './procurement-reporting.contract'
import type { ProcurementReportingModule } from './procurement-reporting.module'

export function createProcurementReportingRoute(m: ProcurementReportingModule) {
	return new Elysia({ prefix: '/procurement' })
		.use(authPluginMacro)
		.get(
			'/purchases',
			async ({ query }) => {
				const result = await m.handleGetPurchasesReport(query)
				return res.ok(result)
			},
			{
				query: dto.ProcurementReportRequestDto,
				response: createSuccessResponseDto(dto.PurchaseReportResponseDto),
				auth: true,
			},
		)
		.get(
			'/suppliers',
			async ({ query }) => {
				const result = await m.handleGetSuppliersReport(query)
				return res.ok(result)
			},
			{
				query: dto.ProcurementReportRequestDto,
				response: createSuccessResponseDto(dto.SupplierReportResponseDto),
				auth: true,
			},
		)
		.get(
			'/transfers',
			async ({ query }) => {
				const result = await m.handleGetTransfersReport(query)
				return res.ok(result)
			},
			{
				query: dto.ProcurementReportRequestDto,
				response: createSuccessResponseDto(dto.TransferReportResponseDto),
				auth: true,
			},
		)
		.get(
			'/costs',
			async ({ query }) => {
				const result = await m.handleGetCostsReport(query)
				return res.ok(result)
			},
			{
				query: dto.ProcurementReportRequestDto,
				response: createSuccessResponseDto(dto.CostReportResponseDto),
				auth: true,
			},
		)
}

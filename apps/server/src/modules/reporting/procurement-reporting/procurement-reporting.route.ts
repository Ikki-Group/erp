import { createSuccessResponseSchema } from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import * as dto from './procurement-reporting.dto'
import type { ProcurementReportingService } from './procurement-reporting.service'

export function initProcurementReportingRoute(service: ProcurementReportingService) {
	return new Elysia({ prefix: '/procurement' })
		.use(authPluginMacro)
		.get(
			'/purchases',
			async ({ query }: { query: dto.ProcurementReportRequestDto }) => {
				const result = await service.getPurchasesReport(query)
				return res.ok(result)
			},
			{
				query: dto.ProcurementReportRequestDto,
				response: createSuccessResponseSchema(dto.PurchaseReportResponseDto),
				auth: true,
			},
		)
		.get(
			'/suppliers',
			async ({ query }: { query: dto.ProcurementReportRequestDto }) => {
				const result = await service.getSuppliersReport(query)
				return res.ok(result)
			},
			{
				query: dto.ProcurementReportRequestDto,
				response: createSuccessResponseSchema(dto.SupplierReportResponseDto),
				auth: true,
			},
		)
		.get(
			'/transfers',
			async ({ query }: { query: dto.ProcurementReportRequestDto }) => {
				const result = await service.getTransfersReport(query)
				return res.ok(result)
			},
			{
				query: dto.ProcurementReportRequestDto,
				response: createSuccessResponseSchema(dto.TransferReportResponseDto),
				auth: true,
			},
		)
		.get(
			'/costs',
			async ({ query }: { query: dto.ProcurementReportRequestDto }) => {
				const result = await service.getCostsReport(query)
				return res.ok(result)
			},
			{
				query: dto.ProcurementReportRequestDto,
				response: createSuccessResponseSchema(dto.CostReportResponseDto),
				auth: true,
			},
		)
}

import { createSuccessResponseDto } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import * as dto from './procurement-reporting.contract'
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
				response: createSuccessResponseDto(dto.PurchaseReportResponseDto),
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
				response: createSuccessResponseDto(dto.SupplierReportResponseDto),
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
				response: createSuccessResponseDto(dto.TransferReportResponseDto),
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
				response: createSuccessResponseDto(dto.CostReportResponseDto),
				auth: true,
			},
		)
}

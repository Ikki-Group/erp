import { z } from 'zod'

import { zp } from '@/lib/validation'

import { ChartTypeDto, ReportRequestDto, ReportSummaryDto } from './reporting.dto'

/* ------------------------------- SALES -------------------------------- */

export const SalesReportRequestDto = ReportRequestDto.extend({
	salesTypeId: zp.num.optional(),
})
export type SalesReportRequestDto = z.infer<typeof SalesReportRequestDto>

export const SalesRevenueDto = z.object({
	date: zp.date,
	revenue: zp.decimal,
	orderCount: zp.num,
})
export type SalesRevenueDto = z.infer<typeof SalesRevenueDto>

export const SalesRevenueChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(SalesRevenueDto),
	summary: ReportSummaryDto,
})
export type SalesRevenueChartResponseDto = z.infer<typeof SalesRevenueChartResponseDto>

export const TopProductDto = z.object({
	productId: zp.num,
	productName: zp.str,
	sku: zp.str,
	totalQuantity: zp.num,
	totalRevenue: zp.decimal,
})
export type TopProductDto = z.infer<typeof TopProductDto>

export const TopProductsChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(TopProductDto),
	summary: ReportSummaryDto,
})
export type TopProductsChartResponseDto = z.infer<typeof TopProductsChartResponseDto>

export const SalesByLocationDto = z.object({
	locationId: zp.num,
	locationName: zp.str,
	revenue: zp.decimal,
	orderCount: zp.num,
})
export type SalesByLocationDto = z.infer<typeof SalesByLocationDto>

export const SalesByLocationChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(SalesByLocationDto),
	summary: ReportSummaryDto,
})
export type SalesByLocationChartResponseDto = z.infer<typeof SalesByLocationChartResponseDto>

export const SalesByTypeDto = z.object({
	salesTypeId: zp.num,
	salesTypeName: zp.str,
	revenue: zp.decimal,
	orderCount: zp.num,
	percentage: zp.decimal,
})
export type SalesByTypeDto = z.infer<typeof SalesByTypeDto>

export const SalesByTypeChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(SalesByTypeDto),
	summary: ReportSummaryDto,
})
export type SalesByTypeChartResponseDto = z.infer<typeof SalesByTypeChartResponseDto>

/* ------------------------------- FINANCE -------------------------------- */

export const FinanceReportRequestDto = ReportRequestDto.extend({
	accountId: zp.num.optional(),
})
export type FinanceReportRequestDto = z.infer<typeof FinanceReportRequestDto>

export const CashFlowDataPointDto = z.object({
	date: zp.date,
	inflow: zp.decimal,
	outflow: zp.decimal,
	net: zp.decimal,
})
export type CashFlowDataPointDto = z.infer<typeof CashFlowDataPointDto>

export const CashFlowChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(CashFlowDataPointDto),
	summary: ReportSummaryDto,
})
export type CashFlowChartResponseDto = z.infer<typeof CashFlowChartResponseDto>

export const AccountBalanceDto = z.object({
	accountId: zp.num,
	accountName: zp.str,
	accountCode: zp.str,
	balance: zp.decimal,
})
export type AccountBalanceDto = z.infer<typeof AccountBalanceDto>

export const AccountBalanceResponseDto = z.object({
	data: z.array(AccountBalanceDto),
	summary: ReportSummaryDto,
})
export type AccountBalanceResponseDto = z.infer<typeof AccountBalanceResponseDto>

export const ExpenditureByCategoryDto = z.object({
	categoryId: zp.num,
	categoryName: zp.str,
	totalAmount: zp.decimal,
	percentage: zp.decimal,
})
export type ExpenditureByCategoryDto = z.infer<typeof ExpenditureByCategoryDto>

export const ExpenditureByCategoryResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(ExpenditureByCategoryDto),
	summary: ReportSummaryDto,
})
export type ExpenditureByCategoryResponseDto = z.infer<typeof ExpenditureByCategoryResponseDto>

/* ------------------------------- INVENTORY -------------------------------- */

export const InventoryReportRequestDto = ReportRequestDto.extend({
	locationId: zp.num.optional(),
	productId: zp.num.optional(),
})
export type InventoryReportRequestDto = z.infer<typeof InventoryReportRequestDto>

export const StockLevelDto = z.object({
	productId: zp.num,
	productName: zp.str,
	sku: zp.str,
	currentStock: zp.num,
	reorderLevel: zp.num,
	unit: zp.str,
})
export type StockLevelDto = z.infer<typeof StockLevelDto>

export const StockLevelResponseDto = z.object({
	data: z.array(StockLevelDto),
	summary: ReportSummaryDto,
})
export type StockLevelResponseDto = z.infer<typeof StockLevelResponseDto>

export const InventoryMovementDto = z.object({
	date: zp.date,
	quantityIn: zp.num,
	quantityOut: zp.num,
	netMovement: zp.num,
})
export type InventoryMovementDto = z.infer<typeof InventoryMovementDto>

export const InventoryMovementChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(InventoryMovementDto),
	summary: ReportSummaryDto,
})
export type InventoryMovementChartResponseDto = z.infer<typeof InventoryMovementChartResponseDto>

export const StockValueDto = z.object({
	productId: zp.num,
	productName: zp.str,
	sku: zp.str,
	quantity: zp.num,
	unitCost: zp.decimal,
	totalValue: zp.decimal,
})
export type StockValueDto = z.infer<typeof StockValueDto>

export const StockValueResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(StockValueDto),
	summary: ReportSummaryDto,
})
export type StockValueResponseDto = z.infer<typeof StockValueResponseDto>

export const LowStockItemDto = z.object({
	productId: zp.num,
	productName: zp.str,
	sku: zp.str,
	currentStock: zp.num,
	reorderLevel: zp.num,
	shortage: zp.num,
})
export type LowStockItemDto = z.infer<typeof LowStockItemDto>

export const LowStockResponseDto = z.object({
	data: z.array(LowStockItemDto),
	summary: ReportSummaryDto,
})
export type LowStockResponseDto = z.infer<typeof LowStockResponseDto>

/* ------------------------------- PAYMENT -------------------------------- */

export const PaymentReportRequestDto = ReportRequestDto.extend({
	accountId: zp.num.optional(),
	method: zp.str.optional(),
	type: z.enum(['payable', 'receivable']).optional(),
})
export type PaymentReportRequestDto = z.infer<typeof PaymentReportRequestDto>

export const PaymentByMethodDto = z.object({
	method: zp.str,
	category: zp.str,
	totalAmount: zp.decimal,
	count: zp.num,
	percentage: zp.decimal,
})
export type PaymentByMethodDto = z.infer<typeof PaymentByMethodDto>

export const PaymentByMethodResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(PaymentByMethodDto),
	summary: ReportSummaryDto,
})
export type PaymentByMethodResponseDto = z.infer<typeof PaymentByMethodResponseDto>

export const PaymentOverTimeDto = z.object({
	date: zp.date,
	payableAmount: zp.decimal,
	receivableAmount: zp.decimal,
	totalAmount: zp.decimal,
})
export type PaymentOverTimeDto = z.infer<typeof PaymentOverTimeDto>

export const PaymentOverTimeResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(PaymentOverTimeDto),
	summary: ReportSummaryDto,
})
export type PaymentOverTimeResponseDto = z.infer<typeof PaymentOverTimeResponseDto>

export const PaymentByAccountDto = z.object({
	accountId: zp.num,
	accountName: zp.str,
	accountCode: zp.str,
	totalAmount: zp.decimal,
	count: zp.num,
})
export type PaymentByAccountDto = z.infer<typeof PaymentByAccountDto>

export const PaymentByAccountResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(PaymentByAccountDto),
	summary: ReportSummaryDto,
})
export type PaymentByAccountResponseDto = z.infer<typeof PaymentByAccountResponseDto>

/* ------------------------------- CRM -------------------------------- */

export const CrmReportRequestDto = ReportRequestDto.extend({
	tierId: zp.num.optional(),
})
export type CrmReportRequestDto = z.infer<typeof CrmReportRequestDto>

export const CustomerGrowthDto = z.object({
	date: zp.date,
	newCustomers: zp.num,
	totalCustomers: zp.num,
})
export type CustomerGrowthDto = z.infer<typeof CustomerGrowthDto>

export const CustomerGrowthChartResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(CustomerGrowthDto),
	summary: ReportSummaryDto,
})
export type CustomerGrowthChartResponseDto = z.infer<typeof CustomerGrowthChartResponseDto>

export const CustomerByTierDto = z.object({
	tierId: zp.num.optional(),
	tierName: zp.str,
	customerCount: zp.num,
	percentage: zp.decimal,
})
export type CustomerByTierDto = z.infer<typeof CustomerByTierDto>

export const CustomerByTierResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(CustomerByTierDto),
	summary: ReportSummaryDto,
})
export type CustomerByTierResponseDto = z.infer<typeof CustomerByTierResponseDto>

export const TopCustomerDto = z.object({
	customerId: zp.num,
	customerName: zp.str,
	email: zp.str,
	totalSpent: zp.decimal,
	orderCount: zp.num,
})
export type TopCustomerDto = z.infer<typeof TopCustomerDto>

export const TopCustomersResponseDto = z.object({
	chartType: ChartTypeDto,
	data: z.array(TopCustomerDto),
	summary: ReportSummaryDto,
})
export type TopCustomersResponseDto = z.infer<typeof TopCustomersResponseDto>

export const LoyaltyPointsSummaryDto = z.object({
	totalPointsIssued: zp.decimal,
	totalPointsRedeemed: zp.decimal,
	pointsBalance: zp.decimal,
})
export type LoyaltyPointsSummaryDto = z.infer<typeof LoyaltyPointsSummaryDto>

export const LoyaltyPointsResponseDto = z.object({
	data: LoyaltyPointsSummaryDto,
})
export type LoyaltyPointsResponseDto = z.infer<typeof LoyaltyPointsResponseDto>

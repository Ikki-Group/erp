import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema } from '@/lib/validation'

import {
	SalesReportRequestDto,
	SalesRevenueChartResponseDto,
	TopProductsChartResponseDto,
	SalesByLocationChartResponseDto,
	SalesByTypeChartResponseDto,
	FinanceReportRequestDto,
	CashFlowChartResponseDto,
	AccountBalanceResponseDto,
	ExpenditureByCategoryResponseDto,
	InventoryReportRequestDto,
	StockLevelResponseDto,
	InventoryMovementChartResponseDto,
	StockValueResponseDto,
	LowStockResponseDto,
	CrmReportRequestDto,
	CustomerGrowthChartResponseDto,
	CustomerByTierResponseDto,
	TopCustomersResponseDto,
	LoyaltyPointsResponseDto,
	PaymentReportRequestDto,
	PaymentByMethodResponseDto,
	PaymentOverTimeResponseDto,
	PaymentByAccountResponseDto,
} from '../dto'

export const salesReportApi = {
	revenue: apiFactory({
		method: 'get',
		url: endpoint.reporting.sales.revenue,
		params: SalesReportRequestDto,
		result: createSuccessResponseSchema(SalesRevenueChartResponseDto),
	}),
	topProducts: apiFactory({
		method: 'get',
		url: endpoint.reporting.sales.topProducts,
		params: SalesReportRequestDto,
		result: createSuccessResponseSchema(TopProductsChartResponseDto),
	}),
	byLocation: apiFactory({
		method: 'get',
		url: endpoint.reporting.sales.byLocation,
		params: SalesReportRequestDto,
		result: createSuccessResponseSchema(SalesByLocationChartResponseDto),
	}),
	byType: apiFactory({
		method: 'get',
		url: endpoint.reporting.sales.byType,
		params: SalesReportRequestDto,
		result: createSuccessResponseSchema(SalesByTypeChartResponseDto),
	}),
}

export const financeReportApi = {
	cashFlow: apiFactory({
		method: 'get',
		url: endpoint.reporting.finance.cashFlow,
		params: FinanceReportRequestDto,
		result: createSuccessResponseSchema(CashFlowChartResponseDto),
	}),
	accountBalances: apiFactory({
		method: 'get',
		url: endpoint.reporting.finance.accountBalances,
		params: FinanceReportRequestDto,
		result: createSuccessResponseSchema(AccountBalanceResponseDto),
	}),
	expenditureByCategory: apiFactory({
		method: 'get',
		url: endpoint.reporting.finance.expenditureByCategory,
		params: FinanceReportRequestDto,
		result: createSuccessResponseSchema(ExpenditureByCategoryResponseDto),
	}),
}

export const inventoryReportApi = {
	stockLevels: apiFactory({
		method: 'get',
		url: endpoint.reporting.inventory.stockLevels,
		params: InventoryReportRequestDto,
		result: createSuccessResponseSchema(StockLevelResponseDto),
	}),
	movements: apiFactory({
		method: 'get',
		url: endpoint.reporting.inventory.movements,
		params: InventoryReportRequestDto,
		result: createSuccessResponseSchema(InventoryMovementChartResponseDto),
	}),
	stockValue: apiFactory({
		method: 'get',
		url: endpoint.reporting.inventory.stockValue,
		params: InventoryReportRequestDto,
		result: createSuccessResponseSchema(StockValueResponseDto),
	}),
	lowStock: apiFactory({
		method: 'get',
		url: endpoint.reporting.inventory.lowStock,
		params: InventoryReportRequestDto,
		result: createSuccessResponseSchema(LowStockResponseDto),
	}),
}

export const paymentReportApi = {
	byMethod: apiFactory({
		method: 'get',
		url: endpoint.reporting.payment.byMethod,
		params: PaymentReportRequestDto,
		result: createSuccessResponseSchema(PaymentByMethodResponseDto),
	}),
	overTime: apiFactory({
		method: 'get',
		url: endpoint.reporting.payment.overTime,
		params: PaymentReportRequestDto,
		result: createSuccessResponseSchema(PaymentOverTimeResponseDto),
	}),
	byAccount: apiFactory({
		method: 'get',
		url: endpoint.reporting.payment.byAccount,
		params: PaymentReportRequestDto,
		result: createSuccessResponseSchema(PaymentByAccountResponseDto),
	}),
}

export const crmReportApi = {
	customerGrowth: apiFactory({
		method: 'get',
		url: endpoint.reporting.crm.customerGrowth,
		params: CrmReportRequestDto,
		result: createSuccessResponseSchema(CustomerGrowthChartResponseDto),
	}),
	customersByTier: apiFactory({
		method: 'get',
		url: endpoint.reporting.crm.customersByTier,
		params: CrmReportRequestDto,
		result: createSuccessResponseSchema(CustomerByTierResponseDto),
	}),
	topCustomers: apiFactory({
		method: 'get',
		url: endpoint.reporting.crm.topCustomers,
		params: CrmReportRequestDto,
		result: createSuccessResponseSchema(TopCustomersResponseDto),
	}),
	loyaltyPoints: apiFactory({
		method: 'get',
		url: endpoint.reporting.crm.loyaltyPoints,
		params: CrmReportRequestDto,
		result: createSuccessResponseSchema(LoyaltyPointsResponseDto),
	}),
}

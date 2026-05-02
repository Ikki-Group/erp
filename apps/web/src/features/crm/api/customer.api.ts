import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'

import {
	CustomerDto,
	CustomerCreateDto,
	CustomerUpdateDto,
	CustomerFilterDto,
	CustomerGetByPhoneDto,
	CustomerAddPointsDto,
	CustomerRedeemPointsDto,
	CustomerLoyaltyTransactionDto,
} from '../dto'

export const customerApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.crm.customer.list,
		params: CustomerFilterDto,
		result: createPaginatedResponseSchema(CustomerDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.crm.customer.detail,
		params: zc.recordId,
		result: createSuccessResponseSchema(CustomerDto),
	}),
	byPhone: apiFactory({
		method: 'post',
		url: endpoint.crm.customer.byPhone,
		body: CustomerGetByPhoneDto,
		result: createSuccessResponseSchema(CustomerDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.crm.customer.create,
		body: CustomerCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.crm.customer.update,
		body: CustomerUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.crm.customer.remove,
		params: zc.recordId,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	addPoints: apiFactory({
		method: 'post',
		url: endpoint.crm.customer.points.add,
		body: CustomerAddPointsDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	redeemPoints: apiFactory({
		method: 'post',
		url: endpoint.crm.customer.points.redeem,
		body: CustomerRedeemPointsDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	loyaltyHistory: apiFactory({
		method: 'get',
		url: endpoint.crm.customer.loyaltyHistory,
		params: zc.recordId,
		result: createSuccessResponseSchema(CustomerLoyaltyTransactionDto.array()),
	}),
}

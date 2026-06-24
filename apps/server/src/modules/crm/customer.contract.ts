import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

/** Customer loyalty tier levels */
export const CustomerTierEnum = z.enum(['bronze', 'silver', 'gold', 'platinum'])
export type CustomerTier = z.infer<typeof CustomerTierEnum>

/** Loyalty transaction types */
export const LoyaltyTransactionTypeEnum = z.enum(['earned', 'redeemed', 'adjusted', 'expired'])
export type LoyaltyTransactionType = z.infer<typeof LoyaltyTransactionTypeEnum>

export const CustomerDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	email: zp.strNullable,
	phone: zp.strNullable,
	address: zp.strNullable,
	taxId: zp.strNullable,
	dateOfBirth: zp.date.nullable(),
	tier: CustomerTierEnum,
	pointsBalance: zp.id,
	totalPointsEarned: zp.id,
	registeredAt: zp.date,
	lastVisitAt: zp.date.nullable(),
	...zc.AuditBasic.shape,
})
export type CustomerDto = z.infer<typeof CustomerDto>

export const CustomerCreateDto = z.object({
	code: zc.strTrim.transform((v) => v.toUpperCase()).min(3).max(20),
	name: zc.strTrim.min(2).max(100),
	email: zc.strTrim.email().optional().or(z.literal('')), // eslint-disable-line @typescript-eslint/no-deprecated
	phone: zc.strTrim.min(10).max(20).optional().or(z.literal('')),
	address: zc.strTrim.min(5).max(255).optional().or(z.literal('')),
	taxId: zc.strTrim.min(10).max(30).optional().or(z.literal('')),
	dateOfBirth: zp.date.optional(),
})
export type CustomerCreateDto = z.infer<typeof CustomerCreateDto>

export const CustomerUpdateDto = z.object({
	...zc.RecordId.shape,
	name: zc.strTrim.min(2).max(100).optional(),
	email: zc.strTrim.email().optional().or(z.literal('')), // eslint-disable-line @typescript-eslint/no-deprecated
	phone: zc.strTrim.min(10).max(20).optional().or(z.literal('')),
	address: zc.strTrim.min(5).max(255).optional().or(z.literal('')),
	taxId: zc.strTrim.min(10).max(30).optional().or(z.literal('')),
	dateOfBirth: zp.date.optional(),
	tier: CustomerTierEnum.optional(),
})
export type CustomerUpdateDto = z.infer<typeof CustomerUpdateDto>

export const CustomerFilterDto = z.object({
	q: zq.search,
	tier: CustomerTierEnum.optional(),
	phone: zc.strTrim.optional(),
	...zq.pagination.shape,
})
export type CustomerFilterDto = z.infer<typeof CustomerFilterDto>

/** Loyalty transaction DTO */
export const CustomerLoyaltyTransactionDto = z.object({
	...zc.RecordId.shape,
	customerId: zp.id,
	type: LoyaltyTransactionTypeEnum,
	points: zp.id,
	balanceAfter: zp.id,
	referenceType: zp.strNullable,
	referenceId: zp.id.nullable(),
	description: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type CustomerLoyaltyTransactionDto = z.infer<typeof CustomerLoyaltyTransactionDto>

/** Add points to customer */
export const CustomerAddPointsDto = z.object({
	customerId: zp.id,
	points: zp.id.min(1).max(100000),
	description: zc.strTrim.min(5).max(255),
	referenceType: zp.str.optional(),
	referenceId: zp.id.optional(),
})
export type CustomerAddPointsDto = z.infer<typeof CustomerAddPointsDto>

/** Redeem points for discount */
export const CustomerRedeemPointsDto = z.object({
	customerId: zp.id,
	points: zp.id.min(1).max(100000),
	description: zc.strTrim.min(5).max(255),
	referenceType: zp.str.optional(),
	referenceId: zp.id.optional(),
})
export type CustomerRedeemPointsDto = z.infer<typeof CustomerRedeemPointsDto>

/** Get customer by phone */
export const CustomerGetByPhoneDto = z.object({
	phone: zc.strTrim.min(10).max(20),
})
export type CustomerGetByPhoneDto = z.infer<typeof CustomerGetByPhoneDto>

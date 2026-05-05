/**
 * Example usage of @ikki/api-contract
 * This demonstrates how to use the shared types and validators
 */

import { PaginationQuery, AuditFull } from '../src/core'
import { zc, zp } from '../src/validation'

// Example 1: Using core types
const pagination: PaginationQuery = {
	page: 1,
	limit: 10,
}

// Example 2: Using Zod primitives
const idSchema = zp.id

// Example 3: Using common validators
const emailSchema = zc.email

// Example 4: Creating a DTO with shared types
// const UserCreateSchema = zc.RecordId.extend({
// 	email: zc.email,
// 	username: zc.username,
// 	fullname: zc.fullname,
// })

// Example 5: Using audit types
const audit: AuditFull = {
	createdAt: new Date(),
	updatedAt: new Date(),
	createdBy: 1,
	updatedBy: 1,
	deletedBy: null,
	deletedAt: null,
}

console.log('api-contract usage examples:', {
	pagination,
	idSchema: idSchema.safeParse(123),
	emailSchema: emailSchema.safeParse('test@example.com'),
	audit,
})

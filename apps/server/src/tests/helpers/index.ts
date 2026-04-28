// Test Helpers - Main Export
// Re-export all test utilities from a single entry point

// Database & Setup
export { getTestDatabase, setupTestDatabase, resetTestDatabase, teardownTestDatabase } from './db'

export { setupIntegrationTests, setupUnitTests } from './setup'

// Factories
export {
	Factory,
	createUser,
	createRole,
	createLocation,
	createMaterialCategory,
	createUom,
	createMaterial,
	createProductCategory,
	createProduct,
} from './factory'

// Fixtures
export {
	IamFixtures,
	LocationFixtures,
	MaterialFixtures,
	UomFixtures,
	CategoryFixtures,
	AuthFixtures,
} from './fixtures'

// Auth
export {
	createMockAuthPlugin,
	createUnauthenticatedPlugin,
	mockAuthenticatedUser,
	authHeaders,
} from './auth'

// HTTP
export { createRouteTestApp, jsonRequest } from './http'
export { createTestApp } from './app'

// Response Assertions
export {
	expectSuccessResponse,
	expectPaginatedResponse,
	expectValidationError,
	expectUnauthorizedError,
	expectNotFoundError,
} from './response'

// Cache
export { clearTestCache, createTestCache } from './cache'

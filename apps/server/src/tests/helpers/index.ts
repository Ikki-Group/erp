// Test Helpers - Main Export
// Re-export all test utilities from a single entry point

// Database & Setup
export * from './app-builder'
export * from './auth'
export * from './db'
export * from './setup'

// Factories (reorganized by module)
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
} from './factories'

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

// HTTP & App Builders
export {
	createTestApp,
	createRouteTestApp,
	createIntegrationTestApp,
	jsonRequest,
	authenticatedJsonRequest,
} from './app-builder'

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

// JWT
export { generateTestToken, generateTestUserToken } from './jwt'

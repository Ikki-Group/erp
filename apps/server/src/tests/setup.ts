/**
 * Test preload — loaded before every test file via bunfig.toml.
 * Guards against running tests against non-test databases.
 */
import { env, isTest } from '@/shared/config/env.ts'

if (!isTest) {
	throw new Error('Tests must run with NODE_ENV=test')
}

if (!env.DATABASE_URL.includes('test')) {
	throw new Error('Refusing to run tests — DATABASE_URL must contain "test"')
}

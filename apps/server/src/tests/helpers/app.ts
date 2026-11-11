/**
 * Test app factory — re-exports the Elysia app instance.
 * Elysia handles requests via app.handle(Request) without .listen().
 */
import { app } from '@/app.ts'

export const testApp = app

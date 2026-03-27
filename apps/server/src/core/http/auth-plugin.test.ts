import { describe, expect, it } from 'bun:test'

import { Elysia } from 'elysia'

import { HttpError } from '@/core/http/errors'

import { authPluginMacro, createAuthPlugin } from './auth-plugin'

describe('auth-plugin', () => {
  const mockUser = { id: 1, email: 'test@example.com' } as any
  const mockIam = {
    auth: {
      verifyToken: async (token: string) => {
        if (token === 'valid-token') return mockUser
        throw new Error('Invalid token')
      },
    },
  } as any

  const createTestApp = () => {
    return new Elysia()
      .onError(({ error, set }) => {
        if (error instanceof HttpError) {
          set.status = error.statusCode
          return { code: error.code, message: error.message }
        }
        return { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' }
      })
      .use(createAuthPlugin(mockIam))
      .use(authPluginMacro)
  }

  it('should allow access with valid token', async () => {
    const app = createTestApp().get('/protected', ({ auth }) => auth.user, { auth: true })

    const req = new Request('http://localhost/protected', { headers: { authorization: 'Bearer valid-token' } })
    const res = await app.handle(req)
    const data = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(data.id).toBe(1)
  })

  it('should deny access with invalid token', async () => {
    const app = createTestApp().get('/protected', () => 'secret', { auth: true })

    const req = new Request('http://localhost/protected', { headers: { authorization: 'Bearer invalid-token' } })
    const res = await app.handle(req)

    expect(res.status).toBe(401)
  })

  it('should deny access without token', async () => {
    const app = createTestApp().get('/protected', () => 'secret', { auth: true })

    const req = new Request('http://localhost/protected')
    const res = await app.handle(req)

    expect(res.status).toBe(401)
  })

  it('should respect isAuthenticated macro', async () => {
    const app = createTestApp().get('/macro-protected', () => 'secret', { isAuthenticated: true })

    const req = new Request('http://localhost/macro-protected')
    const res = await app.handle(req)

    expect(res.status).toBe(401)
  })

  it('should allow anonymous access if auth is not required', async () => {
    const app = createTestApp().get('/public', () => 'public')

    const req = new Request('http://localhost/public')
    const res = await app.handle(req)

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('public')
  })
})

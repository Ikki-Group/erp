// import Elysia from 'elysia'

// class AuthPlugin {
//   constructor(public val: string) {}

//   getUser() {
//     return {
//       id: 1,
//       isRoot: true,
//       isActive: true,
//       val: this.val,
//     }
//   }
// }

// function initAuthPlugin(val: string) {
//   const authPlugin = new Elysia({ name: 'auth' })
//     //
//     .decorate('auth', new AuthPlugin(val))
//     .as('global')

//   return authPlugin
// }

// const authGuardPlugin = new Elysia({ name: 'auth-guard' })
//   //
//   .decorate('auth', null! as AuthPlugin)
//   .as('global')

// const nestedRoute = new Elysia()
//   //
//   // .use(authGuardPlugin)
//   .use(initAuthPlugin('nested'))
//   .get('/', ({ auth }) => auth.getUser())

// const root = new Elysia()
//   //
//   .use(initAuthPlugin('root'))
//   .use(nestedRoute)
//   .listen(3000)

// console.log('🦊 Server running at http://localhost:3000')

// // plugins/auth.plugin.ts
// import Elysia, { status, t } from 'elysia'

// export interface User {
//   id: number
//   isRoot: boolean
//   isActive: boolean
//   locations: string[] // ['LOK-1', 'LOK-2']
//   roles: string[] // ['admin', 'viewer']
// }

// const MOCK_USER: Record<string, User> = {
//   root: {
//     id: 1,
//     isRoot: true,
//     isActive: true,
//     locations: ['LOK-1', 'LOK-2'],
//     roles: ['admin', 'viewer'],
//   },
//   user: {
//     id: 2,
//     isRoot: false,
//     isActive: true,
//     locations: ['LOK-1', 'LOK-2'],
//     roles: ['admin', 'viewer'],
//   },
// }

// export class AuthService {
//   constructor(private secret: string) {
//     console.log('Init Auth Service')
//   }

//   async verifyToken(token: string): Promise<User | null> {
//     // verify JWT, query DB, etc.
//     return MOCK_USER[token] || null
//   }
// }

// export const authPluginType = new Elysia({ name: 'auth' })
//   .decorate('auth', null! as AuthService)
//   .derive({ as: 'global' }, async ({ auth, headers, set }) => {
//     const token = headers['authorization']?.slice(7)
//     if (!token) return status(401, 'Unauthorized')

//     const user = await auth.verifyToken(token)
//     if (!user || !user.isActive) return status(401, 'Unauthorized')

//     set.headers['X-Custom'] = JSON.stringify(user)

//     return { user }
//   })

// export function createAuthPlugin(secret: string) {
//   return new Elysia({ name: 'auth' }).decorate('auth', new AuthService(secret))
// }

// // plugins/rbac.plugin.ts
// // import Elysia, { t } from 'elysia'
// // import { authPluginType, type User } from './auth.plugin'

// type AssertFn = (user: User, ctx: Record<string, any>) => boolean | string

// interface GuardOptions {
//   // static checks
//   requireRoot?: boolean
//   requireRoles?: string[]
//   requireLocations?: string[] // user harus punya SALAH SATU dari ini

//   // dynamic check — return true = allowed, string = custom error message
//   assert?: AssertFn
// }

// export function rbac(options: GuardOptions) {
//   return (
//     new Elysia({ name: `rbac-${JSON.stringify(options)}` })
//       .use(authPluginType)
//       // .macro(() => ({
//       //   // bisa dipakai langsung di route definition
//       //   checkAccess: true,
//       // }))
//       .macro({
//         checkAccess: (enabled: boolean) => ({
//           resolve: () => {
//             console.log('checkAccess', enabled)
//           },
//         }),
//         user: (enabled: true) => ({
//           resolve: () => ({
//             user: 'Pardofelis',
//           }),
//         }),
//       })
//       .derive(({ user }) => ({
//         // helper untuk dynamic assert di dalam handler
//         can: (fn: AssertFn, ctx: Record<string, any> = {}) => {
//           const result = fn(user as User, ctx)
//           if (result !== true) {
//             return status(403, typeof result === 'string' ? result : 'Forbidden')
//           }

//           return
//         },
//       }))
//       .onBeforeHandle(({ user, body, params, query }) => {
//         const u = user as User

//         // console.log('user', u)
//         // 1. root bypass semua
//         if (u.isRoot) return

//         // 2. static requireRoot
//         if (options.requireRoot) {
//           return status(403, 'Root access required')
//         }

//         // 3. role check
//         if (options.requireRoles?.length) {
//           const hasRole = options.requireRoles.some((r) => u.roles.includes(r))
//           if (!hasRole) {
//             return status(403, `Required roles: ${options.requireRoles.join(', ')}`)
//           }
//         }

//         // 4. location check
//         if (options.requireLocations?.length) {
//           const hasLocation = options.requireLocations.some((l) => u.locations.includes(l))
//           if (!hasLocation) {
//             return status(403, `No access to location`)
//           }
//         }

//         // 5. dynamic assert
//         if (options.assert) {
//           const result = options.assert(u, { body, params, query })
//           if (result !== true) {
//             return status(403, typeof result === 'string' ? result : 'Forbidden')
//           }
//         }

//         return
//       })
//       .as('global')
//   )
// }

// // routes/location.route.ts
// // import Elysia, { t } from 'elysia'
// // import { authPluginType } from '../plugins/auth.plugin'
// // import { rbac } from '../plugins/rbac.plugin'

// export const locationRoute = new Elysia({ prefix: '/location' })

//   .use(createAuthPlugin('secret'))

//   // ✅ Simple — hanya root
//   .use(rbac({ requireRoot: true }))
//   .delete('/:id', ({ params }) => `deleted ${params.id}`, {
//     checkAccess: true,
//   })

//   // ✅ Role-based
//   // .use(rbac({ requireRoles: ['admin'] }))
//   .post('/', ({ body }) => body, {
//     body: t.Object({ name: t.String() }),
//   })

//   // ✅ Location-based — user harus punya akses ke LOK-1 atau LOK-2
//   .use(rbac({ requireLocations: ['LOK-1', 'LOK-2'] }))
//   .get('/', ({ user }) => user)

//   // ✅ Dynamic assert — validasi lokasi dari params vs user.locations
//   .use(
//     rbac({
//       assert: (user, { params }) => {
//         if (!user.locations.includes(params.locationId)) {
//           return `No access to location ${params.locationId}`
//         }
//         return true
//       },
//     })
//   )
//   .get('/:locationId/detail', ({ params }) => `detail of ${params.locationId}`)

//   // ✅ Dynamic assert — validasi dari body
//   .use(
//     rbac({
//       requireRoles: ['admin'],
//       assert: (user, { body }) => {
//         // admin hanya bisa update lokasi yang dia punya
//         if (!user.locations.includes(body.locationId)) {
//           return 'You can only update your own locations'
//         }
//         return true
//       },
//     })
//   )
//   .patch('/update', ({ body }) => body, {
//     body: t.Object({
//       locationId: t.String(),
//       name: t.String(),
//     }),
//   })

//   // ✅ In-handler dynamic check dengan `can()`
//   .use(rbac({}))
//   .post(
//     '/transfer',
//     ({ body, user, can }) => {
//       // cek runtime berdasarkan kondisi kompleks
//       can(
//         (u, ctx) => {
//           if (!u.locations.includes(ctx.from)) return `No access to ${ctx.from}`
//           if (!u.locations.includes(ctx.to)) return `No access to ${ctx.to}`
//           return true
//         },
//         { from: body.fromLocation, to: body.toLocation }
//       )

//       return `transferred from ${body.fromLocation} to ${body.toLocation}`
//     },
//     {
//       body: t.Object({
//         fromLocation: t.String(),
//         toLocation: t.String(),
//       }),
//     }
//   )
//   .listen(3000)

// console.log('🦊 Server running at http://localhost:3000')

import { Elysia, status } from 'elysia'

interface User {
  id: number
  isRoot: boolean
}

const MOCK_USER: Record<string, User> = {
  root: {
    id: 1,
    isRoot: true,
  },
  user: {
    id: 2,
    isRoot: false,
  },
}

class AuthPlugin {
  constructor(public secret: string) {}

  getUser(token: string) {
    return MOCK_USER[token] || null
  }
}

function initAuthPlugin(secret: string) {
  const authPlugin = new Elysia({ name: 'auth' })
    // .onRequest((ctx) => {
    //   console.log('onRequest.initAuthPlugin')
    // })
    .decorate('auth', new AuthPlugin(secret))
    .as('global')

  return authPlugin
}

const authPluginDecorator = new Elysia({ name: 'auth' })
  .decorate('auth', null! as AuthPlugin)
  .derive(({ auth, request }) => {
    const token = request.headers.get('authorization')?.slice(7)
    const user = auth.getUser(token!)
    return {
      user,
    }
  })
  .macro({
    isAdmin: (enabled: boolean) => ({
      resolve: (p) => {
        if (!enabled) return

        if (!p.user || !p.user.isRoot) return status(401, 'Unauthorized')
        console.log('user', p.user)
      },
    }),
  })
  .as('global')

const router = new Elysia()
  //
  .use(authPluginDecorator)
  .get('/', ({ auth, user }) => user, { isAdmin: true })
  .get('/public', ({ auth, user }) => user, { isAdmin: false })

const app = new Elysia()
  //
  .onError((err) => {
    console.log('onError', err)
  })
  .use(initAuthPlugin('secret'))
  .use(router)

  .listen(3000)

console.log('🦊 Server running at http://localhost:3000')

import { z } from "zod"

/**
 * Auth module schemas following Elysia best practices
 * Using namespace pattern for grouping related schemas
 */
export namespace AuthModel {
  // ============ Sign In ============
  export const signInBody = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  })
  export type SignInBody = z.infer<typeof signInBody>

  export const signInResponse = z.object({
    user: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      name: z.string().nullable(),
    }),
    accessToken: z.string(),
    expiresAt: z.number(),
  })
  export type SignInResponse = z.infer<typeof signInResponse>

  // ============ Sign Up ============
  export const signUpBody = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2).optional(),
  })
  export type SignUpBody = z.infer<typeof signUpBody>

  export const signUpResponse = z.object({
    user: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      name: z.string().nullable(),
    }),
    message: z.string(),
  })
  export type SignUpResponse = z.infer<typeof signUpResponse>

  // ============ Profile ============
  export const profileResponse = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    createdAt: z.string().datetime(),
  })
  export type ProfileResponse = z.infer<typeof profileResponse>

  // ============ Errors ============
  export const invalidCredentials = z.literal("Invalid email or password")
  export type InvalidCredentials = z.infer<typeof invalidCredentials>

  export const emailExists = z.literal("Email already exists")
  export type EmailExists = z.infer<typeof emailExists>
}

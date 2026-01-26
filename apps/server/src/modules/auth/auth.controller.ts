import { Elysia } from "elysia"
import { authPlugin } from "@/common/plugins"
import { success, successSchema } from "@/common/models"
import { NotFoundError } from "@/core/errors"
import { AuthModel } from "./auth.model"
import { authService } from "./auth.service"

/**
 * Auth controller - HTTP routing and validation
 * Following Elysia best practice: Elysia instance as controller
 */
export const authController = new Elysia({ prefix: "/auth", tags: ["Auth"] })
  .use(authPlugin)
  // Sign In
  .post(
    "/sign-in",
    async ({ body }) => {
      const data = await authService.signIn(body)
      return success(data)
    },
    {
      body: AuthModel.signInBody,
      response: {
        200: successSchema(AuthModel.signInResponse),
      },
      detail: {
        summary: "Sign in",
        description: "Authenticate user with email and password",
      },
    },
  )
  // Sign Up
  .post(
    "/sign-up",
    async ({ body, set }) => {
      const data = await authService.signUp(body)
      set.status = 201
      return success(data)
    },
    {
      body: AuthModel.signUpBody,
      response: {
        201: successSchema(AuthModel.signUpResponse),
      },
      detail: {
        summary: "Sign up",
        description: "Register a new user account",
      },
    },
  )
  // Get Profile (protected)
  .get(
    "/profile",
    async ({ user }) => {
      const profile = await authService.getProfile(user.id)

      if (!profile) {
        throw new NotFoundError("User not found")
      }

      return success(profile)
    },
    {
      requireAuth: true,
      response: {
        200: successSchema(AuthModel.profileResponse),
      },
      detail: {
        summary: "Get profile",
        description: "Get authenticated user profile",
      },
    },
  )

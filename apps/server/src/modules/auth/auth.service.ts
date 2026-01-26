import { status } from "elysia"
import { signJwt } from "@/common/plugins/auth.plugin"
import { success } from "@/common/models"
import { config } from "@/core/config"
import { ConflictError, UnauthorizedError } from "@/core/errors"
import { TimeUtils } from "@/utils/time"
import { AuthRepository, authRepository } from "./auth.repository"
import type { AuthModel } from "./auth.model"

/**
 * Auth service - Business logic for authentication
 */
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Sign in with email and password
   */
  async signIn({
    email,
    password,
  }: AuthModel.SignInBody): Promise<AuthModel.SignInResponse> {
    const user = await this.authRepository.findUserByEmail(email)

    if (!user) {
      throw new UnauthorizedError("Invalid email or password")
    }

    const isValidPassword = await Bun.password.verify(
      password,
      user.passwordHash,
    )

    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password")
    }

    const accessToken = await signJwt({
      sub: user.id,
      email: user.email,
    })

    const expiresIn = TimeUtils.parseExpiresIn(config.JWT_EXPIRES_IN)
    const expiresAt = TimeUtils.now() + expiresIn

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      expiresAt,
    }
  }

  /**
   * Sign up a new user
   */
  async signUp({
    email,
    password,
    name,
  }: AuthModel.SignUpBody): Promise<AuthModel.SignUpResponse> {
    const emailExists = await this.authRepository.emailExists(email)

    if (emailExists) {
      throw new ConflictError("Email already exists")
    }

    const passwordHash = await Bun.password.hash(password, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 3,
    })

    const user = await this.authRepository.createUser({
      email,
      passwordHash,
      name,
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: "User created successfully",
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<AuthModel.ProfileResponse | null> {
    const user = await this.authRepository.findUserById(userId)

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    }
  }
}

export const authService = new AuthService(authRepository)

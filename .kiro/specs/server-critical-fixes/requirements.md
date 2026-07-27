# Requirements Document

## Introduction

Fix critical and high-priority issues found during the `apps/server` code review. These include TypeScript type errors that break compilation, a JWT expiration bug that could cause tokens to live ~19 years instead of 7 days, a wide-open CORS policy in production, and lint errors that block the `bun run verify` gate.

## Glossary

- **Server**: The Elysia-based API application in `apps/server`
- **IamAuthPort**: The narrow interface used by `AuthService` to access IAM user detail functionality
- **SessionService**: The service responsible for creating JWT tokens and managing user sessions
- **JWT_EXPIRES_IN**: The environment variable controlling JWT token lifetime, transformed from a duration string (e.g. `"7d"`) via the `ms` library
- **CORS_Policy**: The Cross-Origin Resource Sharing configuration applied to the Elysia app
- **Verify_Gate**: The `bun run verify` script (lint + typecheck + knip + check-deps) that must pass before code is merged

## Requirements

### Requirement 1: Fix IamAuthPort return type mismatch

**User Story:** As a developer, I want the `IamAuthPort.getUserDetail` return type to match the actual implementation and the `AuthOutputDto` contract, so that TypeScript compilation succeeds without type errors.

#### Acceptance Criteria

1. THE IamAuthPort interface SHALL declare `getUserDetail` with return type `Promise<UserDetailDto>` instead of `Promise<UserDto>`
2. WHEN `handleLogin` returns an `AuthOutputDto`, THE AuthService SHALL provide a `user` field that includes the `assignments` array required by `UserDetailDto`
3. WHEN `verifyToken` is called, THE AuthService SHALL return a `UserDetailDto` (with assignments) to match the updated port signature

### Requirement 2: Fix JWT expiresIn units bug

**User Story:** As a system operator, I want JWT tokens to expire at the intended duration (e.g. 7 days), so that sessions do not remain valid for unintended periods (~19 years).

#### Acceptance Criteria

1. WHEN a JWT token is signed, THE SessionService SHALL pass `expiresIn` as a value in seconds (not milliseconds) to the `jsonwebtoken` library
2. WHEN `JWT_EXPIRES_IN` is set to `"7d"`, THE SessionService SHALL produce tokens that expire in approximately 7 days
3. THE env configuration SHALL expose the raw duration string or a seconds-based numeric value suitable for `jsonwebtoken`

### Requirement 3: Restrict CORS policy for production

**User Story:** As a security engineer, I want the CORS policy to restrict allowed origins in production, so that only the known web frontend can make cross-origin requests to the API.

#### Acceptance Criteria

1. WHILE the application is running in production, THE CORS_Policy SHALL restrict `origin` to a configured list of allowed domains
2. WHILE the application is running in development or test, THE CORS_Policy SHALL allow all origins for developer convenience
3. IF no allowed origin environment variable is set in production, THEN THE Server SHALL fall back to a sensible default (reject unknown origins or use a known frontend URL)

### Requirement 4: Fix lint errors blocking verify gate

**User Story:** As a developer, I want all lint errors resolved, so that `bun run verify` passes cleanly and code can be merged.

#### Acceptance Criteria

1. THE goods-receipt contract SHALL resolve the `no-underscore-dangle` lint violation (either rename the variable or add an oxlint-disable comment with justification)
2. THE customer repo, stock-transaction repo, procurement-reporting repo, and crm-reporting repo SHALL resolve `no-unsafe-type-assertion` violations by using proper type narrowing or oxlint-disable comments with justification
3. THE database-helpers test SHALL resolve `await-thenable` violations by removing unnecessary `await` on non-thenable expressions
4. THE stock-summary service test SHALL resolve the `no-underscore-dangle` violation

### Requirement 5: Fix TypeScript error in recipe service test

**User Story:** As a developer, I want the recipe service test to compile without TypeScript errors, so that tests can run and the typecheck gate passes.

#### Acceptance Criteria

1. WHEN mock data is created in the recipe service test, THE test mock SHALL provide `createdAt` as a `Date` value (not `Date | undefined`)
2. THE recipe service test SHALL pass TypeScript strict type checking without errors

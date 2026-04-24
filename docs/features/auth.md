# Authentication (Auth)

**Layer**: 1.5 (Security - Depends on IAM)  
**Status**: MVP - Critical for system access  
**Complexity**: Medium (JWT tokens, password security, session management)

---

## 1. Overview

The Authentication module handles user login, token issuance, and session validation. It is the gateway to Ikki ERP—every API request must pass through authentication to verify the user's identity and issue a valid JWT token for subsequent requests.

**Key Design**: Stateless JWT tokens (no server session store) with short-lived access tokens + long-lived refresh tokens for secure, scalable session management.

---

## 2. Core Objectives

- **Secure Identity Verification**: Cryptographically verify users with Argon2id password hashing
- **Stateless Sessions**: JWT tokens eliminate database lookups on every request
- **Token Lifecycle**: Access tokens (short TTL) + Refresh tokens (long TTL) + Token revocation
- **Account Safety**: Password reset flows, first-login enforcement, brute-force protection
- **Security Best Practices**: HttpOnly cookies, HTTPS-only tokens, rate limiting

---

## 3. Key Entities & Relationships

```
AuthSession (Active Session)
├─ user_id: FK → User
├─ access_token: "eyJhbGc..." (JWT, 2-hour TTL)
├─ refresh_token: "rt_abc123..." (JWT, 7-day TTL)
├─ ip_address: "192.168.1.100" (session tracking)
├─ user_agent: "Mozilla/5.0..." (device tracking)
├─ expires_at: 2026-04-25T17:30:00Z
└─ created_at: 2026-04-24T15:30:00Z

TokenBlocklist (Revoked Tokens)
├─ token: "eyJhbGc..." (hashed token)
├─ revoked_at: 2026-04-24T15:45:00Z
├─ reason: "user_logout" (logout, password_change, admin_revoke)
└─ expires_at: 2026-04-26T15:30:00Z (cleanup based on original TTL)

JWT Token Structure (Access Token)
├─ sub: "user:1" (subject - user ID)
├─ iat: 1682333400 (issued at)
├─ exp: 1682337000 (expires - 2 hours from iat)
├─ roles: ["outlet_manager"] (role for quick permission checks)
├─ locations: [1, 2] (assigned locations for LBAC)
└─ email: "budi@ikki.co.id"

JWT Token Structure (Refresh Token)
├─ sub: "user:1"
├─ iat: 1682333400
├─ exp: 1682938200 (expires - 7 days from iat)
├─ type: "refresh"
└─ rotation_key: "rt_v1_abc..." (prevent token reuse attacks)

Relationships:
- AuthSession → User (many-to-one: multiple sessions per user)
- TokenBlocklist → (reference token directly, not FK)
```

---

## 4. Use Cases & Workflows

### UC-001: User Login (Daily staff entry)

**Actors**: Barista, Manager, Staff  
**Precondition**: User account exists and is active

**Steps**:
1. Barista opens login page: /login
2. Enters: Username ("adi_barista"), Password ("SecurePass123!")
3. Frontend POST /auth/login
4. Backend service:
   - Finds user by username
   - Compares entered password against password_hash (Argon2id verify)
   - If password invalid → throw UnauthorizedError "INVALID_CREDENTIALS"
   - If user status "suspended" → throw ForbiddenError "ACCOUNT_SUSPENDED"
   - If user status "locked" → throw ForbiddenError "ACCOUNT_LOCKED"
5. Password valid → Generate tokens:
   - Access Token: User ID + roles + locations, 2-hour expiry
   - Refresh Token: User ID + rotation key, 7-day expiry
6. Create AuthSession record (for audit/session tracking)
7. Return to frontend:
   - Access token in response body (stored in memory)
   - Refresh token in HttpOnly cookie (cannot be accessed by JavaScript)
8. Frontend stores access token in memory (RAM, NOT localStorage)
9. Barista now authenticated, can access dashboard

**Business Rules**:
- Failed login attempts tracked (5 failures → lock for 15 min)
- Password check is case-sensitive
- Username check is case-insensitive (flexibility)
- Last login timestamp updated
- Session created with IP address + user agent for auditing

---

### UC-002: Automatic Token Refresh (Background, transparent to user)

**Actors**: System, Frontend  
**Precondition**: Access token near expiry, refresh token valid

**Steps**:
1. Access token issued at 15:00, expires at 17:00 (2-hour TTL)
2. User continues working without logging out
3. At 16:55, token has < 5 min remaining
4. Frontend detects expiry (via token decode), automatically:
   - POST /auth/refresh with current access token
5. Backend validates:
   - Refresh token in cookie is valid and not revoked
   - Refresh token has not expired (7 days)
   - Rotation key matches (prevent token reuse attacks)
6. Generates new access token (same user, roles, locations)
7. Returns new access token to frontend
8. Frontend silently updates stored token
9. User doesn't notice—continues working uninterrupted

**Business Rules**:
- Refresh token can only be used ONCE (consumed after use)
- New refresh token issued with each refresh (rotation)
- If rotation key doesn't match → reject (token reuse attack)
- If refresh token expired → force new login
- Refresh attempt is logged for security audit

---

### UC-003: User Logout (End of shift)

**Actors**: User  
**Precondition**: User authenticated with valid session

**Steps**:
1. Manager clicks "Logout" button
2. Frontend sends: POST /auth/logout
3. Backend service:
   - Extracts current access token from header
   - Adds token to TokenBlocklist with reason "user_logout"
   - Clears refresh token cookie (response header: Set-Cookie with MaxAge=0)
   - Deletes AuthSession record
4. Frontend:
   - Clears stored access token from memory
   - Redirects to /login page
5. If token is used again → middleware checks blocklist, rejects with 401

**Business Rules**:
- Logout is explicit (user action) - not forced timeout in MVP
- Both access and refresh tokens revoked
- Session data cleaned up immediately
- Logout logged for audit trail

---

### UC-004: Forced Password Change (First login or admin-required)

**Actors**: New staff member, Admin  
**Precondition**: Admin created account with temporary password

**Steps**:
1. Admin creates user "adi_barista" with temporary password "Temp123!Temp"
2. Adi tries to login:
   - Login succeeds
   - But system detects `password_change_required = true` flag
3. Instead of redirecting to dashboard, redirects to /password-change
4. Adi enters:
   - Current password: "Temp123!Temp"
   - New password: "MySecure456!"
   - Confirm: "MySecure456!"
5. Backend validates:
   - Current password correct
   - New password strong (8+ chars, uppercase, number, symbol)
   - New password ≠ old password
   - New password not in last 5 passwords (phase 2)
6. Updates User.password_hash with Argon2id(new password)
7. Sets flag `password_change_required = false`
8. Invalidates old tokens (forces re-login with new password)
9. Redirects to /login or auto-logs in with new session

**Business Rules**:
- Flag set on admin-created accounts automatically
- Admin-forced password change can be triggered anytime
- Old password required to change (security)
- Password change invalidates all existing sessions

---

### UC-005: Password Reset (Forgotten password)

**Actors**: User who forgot password  
**Precondition**: Account exists, user can access email

**Steps**:
1. User on /login, clicks "Forgot Password"
2. Enters email: "budi@ikki.co.id"
3. Backend:
   - Finds user by email
   - Generates reset token (short TTL: 30 min)
   - Sends email with link: /password-reset?token=abc123
   - Creates PasswordResetToken record with expiry
4. User clicks email link → /password-reset form
5. Enters new password + confirm
6. Backend validates:
   - Reset token valid and not expired
   - Token not used before (one-time use)
   - New password strong
7. Updates User.password_hash
8. Marks token as used
9. Invalidates all existing sessions
10. Redirects to login with message: "Password reset successful, please login"

**Business Rules**:
- Reset token valid for 30 minutes only
- Each reset token can only be used once
- Reset invalidates all existing sessions (logout everywhere)
- Email address must match registered account

---

## 5. Data Model

### User (auth fields only, rest in IAM module)

```sql
-- See IAM module for full User table
-- Auth-specific fields:
CREATE TABLE users (
  ...
  password_hash VARCHAR(255) NOT NULL, -- Argon2id hash
  password_change_required BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP, -- If 5 failed attempts
  ...
)

CREATE INDEX idx_users_locked_until ON users(locked_until);
```

### AuthSession Table

```sql
CREATE TABLE auth_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token_hash VARCHAR(255) NOT NULL, -- Hashed for storage
  refresh_token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_refresh_token_hash UNIQUE(refresh_token_hash)
)

CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at);
```

### TokenBlocklist Table

```sql
CREATE TABLE token_blocklist (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(255) UNIQUE NOT NULL, -- Hashed token
  revoked_at TIMESTAMP DEFAULT NOW(),
  reason VARCHAR(50) CHECK (reason IN ('user_logout', 'password_change', 'admin_revoke', 'token_reuse_attempt')),
  expires_at TIMESTAMP NOT NULL, -- When to delete from blocklist
  created_at TIMESTAMP DEFAULT NOW()
)

CREATE INDEX idx_token_blocklist_expires ON token_blocklist(expires_at);
```

### PasswordResetToken Table

```sql
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
```

---

## 6. Business Rules & Validations

**Login Rules**:
- Case-insensitive username lookup
- Case-sensitive password check (cryptographic hash)
- 5 failed attempts → lock account for 15 minutes
- Last login timestamp updated on success
- Session created with IP + user agent for tracking

**Token Rules**:
- Access token: 2-hour expiry
- Refresh token: 7-day expiry
- Tokens are JWTs with cryptographic signature
- Token validation checks: signature, expiry, not in blocklist
- Refresh token can only be used once (rotation)

**Password Rules**:
- Minimum 8 characters
- Must include: uppercase letter + lowercase + number + special char
- Cannot reuse last 5 passwords (phase 2)
- Password change requires current password
- Cannot contain username or email address

**Session Rules**:
- One session per user (phase 2: multiple sessions possible)
- Session expires when refresh token expires (7 days)
- Old sessions cleaned up on logout or expiry
- IP address + user agent logged (for fraud detection)

---

## 7. API Endpoints & Routes

### POST `/auth/login`
**Description**: Authenticate user and issue tokens  
**Auth**: None (public endpoint)  
**Body**:
```typescript
{
  username: "budi_manager",
  password: "SecurePass123!"
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "access_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "username": "budi_manager",
      "email": "budi@ikki.co.id",
      "roles": ["outlet_manager"],
      "locations": [1, 2]
    }
  }
}
```
**Note**: Refresh token set as HttpOnly cookie automatically

**Error Responses**:
- 401 Unauthorized: Invalid username/password → "INVALID_CREDENTIALS"
- 403 Forbidden: Account suspended → "ACCOUNT_SUSPENDED"
- 403 Forbidden: Account locked → "ACCOUNT_LOCKED" (15 min cooldown)

---

### POST `/auth/refresh`
**Description**: Get new access token using refresh token  
**Auth**: None (uses refresh token cookie)  
**Body**: (empty)  
**Response** (200 OK):
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "access_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 7200
  }
}
```

**Error Responses**:
- 401 Unauthorized: Refresh token expired → "TOKEN_EXPIRED"
- 401 Unauthorized: Refresh token invalid/revoked → "TOKEN_INVALID"

---

### POST `/auth/logout`
**Description**: Revoke current session and logout user  
**Auth**: Required  
**Body**: (empty)  
**Response**: 204 No Content

---

### POST `/auth/change-password`
**Description**: Authenticated user changes own password  
**Auth**: Required  
**Body**:
```typescript
{
  current_password: "OldPass123!",
  new_password: "NewPass456!",
  confirm_password: "NewPass456!"
}
```
**Response**: 200 OK with message "Password changed successfully"

---

### POST `/auth/forgot-password`
**Description**: Request password reset link (via email)  
**Auth**: None (public)  
**Body**:
```typescript
{
  email: "budi@ikki.co.id"
}
```
**Response**: 200 OK (always, for security - don't leak email existence)
**Email**: Sends /password-reset?token=abc123

---

### POST `/auth/reset-password`
**Description**: Complete password reset with token  
**Auth**: None (public with token)  
**Body**:
```typescript
{
  token: "abc123",
  new_password: "NewPass456!",
  confirm_password: "NewPass456!"
}
```
**Response**: 200 OK with message "Password reset successful, please login"

**Error Responses**:
- 400 Bad Request: Invalid/expired token → "TOKEN_INVALID"
- 400 Bad Request: Token already used → "TOKEN_ALREADY_USED"

---

### GET `/auth/me`
**Description**: Get current authenticated user  
**Auth**: Required  
**Response**:
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "id": 1,
    "username": "budi_manager",
    "email": "budi@ikki.co.id",
    "roles": ["outlet_manager"],
    "locations": [1, 2],
    "status": "active"
  }
}
```

---

## 8. Security Patterns

### Token Validation Flow
```typescript
// In auth middleware (every protected endpoint)
const token = extractTokenFromHeader(request)

// 1. Check blocklist first (fast Redis lookup)
if (await tokenBlocklist.isRevoked(token)) {
  throw UnauthorizedError('TOKEN_REVOKED')
}

// 2. Verify JWT signature + expiry
const payload = verifyJWT(token, SECRET_KEY)
if (!payload) throw UnauthorizedError('TOKEN_INVALID')

// 3. Extract user context
const userId = payload.sub
const locations = payload.locations
const roles = payload.roles

// 4. Attach to request
request.auth = new AuthContext(userId, { locations, roles })
```

### Argon2id Password Hashing
```typescript
// On password creation:
const passwordHash = await argon2.hash(password)
await userRepo.update(userId, { password_hash: passwordHash })

// On login:
const isValid = await argon2.verify(user.password_hash, enteredPassword)
if (!isValid) throw UnauthorizedError('INVALID_CREDENTIALS')
```

### Refresh Token Rotation
```typescript
// User refreshes token:
// 1. Check refresh token rotation_key matches
// 2. Generate new refresh token with new rotation_key
// 3. Update AuthSession with new refresh_token_hash
// 4. Return new access + refresh tokens
// 5. Old refresh token cannot be reused (different key)
```

---

## 9. Implementation Notes

### Caching Strategy
```typescript
const AUTH_CACHE_KEYS = {
  BLOCKLIST: (tokenHash: string) => `auth.blocklist.${tokenHash}`,
  SESSION: (userId: number) => `auth.session.${userId}`,
}

// Blocklist: Cache for token TTL (then auto-expire)
// Session: Cache for short time to prevent DB hit per request
```

### Performance Considerations
- Blocklist check uses fast in-memory cache (Redis)
- Token validation happens in middleware (not in service)
- JWT decoding is O(1) after signature verification
- No database lookups on every request (stateless design)
- Session cleanup (expired sessions) runs as background job

---

## 10. Future Enhancements (Phase 2+)

- **Device Fingerprinting**: Track device type, location, device ID
- **Brute Force Protection**: Graduated backoff (1s, 2s, 4s, 8s, lock)
- **Email Verification**: Verify email on signup before activation
- **Two-Factor Authentication**: TOTP or SMS OTP for sensitive ops
- **Session Management Dashboard**: View/terminate all active sessions
- **Login Activity Log**: Detailed login history with IP, device, success/fail
- **IP Whitelisting**: Restrict access by location (store WiFi only)

---

**Module Status**: ✅ MVP-Ready  
**Dependencies**: IAM (Layer 1)  
**Estimated Implementation**: 8-10 hours

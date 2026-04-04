# Authentication (Auth)

The Authentication module (Layer 1.5) is the gateway to the Ikki ERP. It sits directly above the IAM (Identity and Access Management) module to authenticate users before granting them access to the system. Since this is an internal business tool for Ikki Coffee & Ikki Resto staff, the focus is on robust session management and token security rather than external social logins.

## 1. Core Objectives
- **Secure Identity Verification**: Ensure that Baristas, Chefs, and Managers are who they say they are using cryptographic standards (Argon2id).
- **Stateless & Scalable Sessions**: Utilize JWTs (JSON Web Tokens) to quickly verify active sessions without hitting the database on every single API request.
- **Session Revocation**: The ability to forcefully log out a compromised account across all their devices.

## 2. Key Features

### JWT Strategy (Access & Refresh Tokens)
- **Access Token**: Short-lived (e.g., 15 minutes). Sent in an `Authorization: Bearer <token>` header. Contains minimal payload data (User ID, Role ID, Location ID) so the backend can instantly authorize an action without a DB lookup.
- **Refresh Token**: Long-lived (e.g., 7 days). Stored securely in an `HttpOnly`, `Secure` cookie. It is used to automatically request a new Access Token in the background so the user doesn't have to keep logging in during their shift.

### Password Security & Reset
- **Argon2id Hashing**: The highest standard for password hashing, practically immune to GPU brute-forcing.
- **First-Time Login Flow**: If the Owner creates an account for a new Barista, they are given a temporary password. The system forces the Barista to change this password immediately upon their first successful login.

## 3. Technical Architecture (Proposed)

### ElysiaJS Integration
- **Auth Middleware (`derive`)**: The application uses Elysia's `derive` pattern to extract the JWT from the header, verify the cryptographic signature using a secret key, and inject the `user` object into the request context for all protected routes.
- **Role Guards**: A custom Elysia macro (e.g., `isLoggedIn: true`, `requirePermission: 'inventory:create'`) intercepts unauthorized users *before* they even hit the core business logic in the `Service` layer.

### Redis Blocklist (Logout Strategy)
- Since JWTs are stateless, they cannot be natively "destroyed" before they expire.
- If a user clicks **Logout**, their active Access Token is added to a Redis blocklist until it naturally expires, and the Refresh Token cookie is cleared. The auth middleware checks this fast Redis cache on every request.

## 4. Next Phase Recommendations
1. **Device Fingerprinting**: Track which device (iPad Cashier vs Manager's Phone) the active session belongs to. This helps the General Manager instantly identify and kill suspicious logins.
2. **Brute Force Protection**: Temporarily lock the login form for 15 minutes if a user enters the wrong password 5 times in a row, preventing automated attacks against the restaurant's internal system.

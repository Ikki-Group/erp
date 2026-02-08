# IAM Module Specific Rules

## 1. Domain Entities
- **Users**: Core identities with `email`, `username`, and `isRoot` status.
- **Roles**: System or custom roles identified by a unique `code`.
- **User Role Assignments**: Links users to roles at specific **locations**.

## 2. Authorization Logic
- Authorization is location-aware.
- Permission checks should look for the role code assigned to the user at the current location.
- `isRoot: true` users bypass all checks (Full Access).

## 3. Password Management
- Always use `hashPassword` and `verifyPassword` from `@/lib/utils/password.util.ts`.
- Never store plain text passwords.
- Password updates should be handled in a dedicated `updatePassword` method or as part of a secure `update` flow.

## 4. Relationship Management
- When deleting a user, ensure all related role assignments are also cleaned up (handled by DB cascade, but be mindful in services).
- Protecting system roles: Prevent deletion or modification of roles where `isSystem: true`.

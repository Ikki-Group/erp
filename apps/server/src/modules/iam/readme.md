# IAM Module - API Specifications

## Authentication
- **POST `/auth/login`**
  - Authenticate user with email or username and password.
  - Returns JWT token and user details with access.
- **GET `/auth/me`**
  - Retrieve current authenticated user's information, including roles and location-based permissions.

## User Management
- **GET `/iam/user/list`**
  - List all users with pagination and filtering (search, isActive).
- **GET `/iam/user/detail?id={id}`**
  - Retrieve detailed user information, including role assignments across different locations.
- **POST `/iam/user/create`**
  - Create a new user with initial role assignments.
- **PUT `/iam/user/update`**
  - Update user information and synchronize role assignments.
- **PATCH `/iam/user/toggle-active`**
  - Toggle user's active status.
- **DELETE `/iam/user/delete`**
  - Permanently delete a user (Root users are protected).

## Role Management
- **GET `/iam/role/list`**
  - List all roles with pagination and filtering.
- **GET `/iam/role/detail?id={id}`**
  - Retrieve role details.
- **POST `/iam/role/create`**
  - Create a new role.
- **PUT `/iam/role/update`**
  - Update an existing role (System roles are protected).
- **DELETE `/iam/role/delete`**
  - Delete a role.

---
**Note:** The system ensures robust access control. User details always include permissions and location context to support multi-tenant/location operations.

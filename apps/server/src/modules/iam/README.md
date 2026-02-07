# IAM Module Documentation

## Overview

The IAM (Identity and Access Management) module provides comprehensive user, role, and permission management for the ERP system. It handles user authentication, role-based access control (RBAC), and location-based role assignments.

## Architecture

### Module Structure

```
src/modules/iam/
├── iam.dto.ts                 # Data Transfer Objects & Validation Schemas
├── iam.types.ts               # Type definitions & Response schemas
├── index.ts                   # Module exports
├── router/
│   ├── index.ts              # Route aggregator
│   ├── user.route.ts         # User endpoints
│   ├── role.route.ts         # Role endpoints
│   └── user-role-assignment.route.ts  # Assignment endpoints
└── service/
    ├── index.ts              # Service aggregator
    ├── users.service.ts      # User business logic
    ├── roles.service.ts      # Role business logic
    └── user-role-assignments.service.ts  # Assignment logic
```

## Features

### 1. User Management

#### Endpoints

- **GET** `/iam/users` - List users with pagination and filtering
- **GET** `/iam/users/:id` - Get user by ID
- **POST** `/iam/users` - Create new user
- **PUT** `/iam/users/:id` - Update user
- **DELETE** `/iam/users/:id` - Delete user
- **PATCH** `/iam/users/:id/toggle-active` - Toggle user active status

#### Features

- ✅ Email and username uniqueness validation
- ✅ Password hashing with bcrypt
- ✅ Pagination and search functionality
- ✅ Active/inactive status filtering
- ✅ Root user protection (cannot be deleted)
- ✅ Transaction support for data integrity
- ✅ Input sanitization (lowercase, trim)

#### Example Usage

```typescript
// Create a new user
POST /iam/users
{
  "email": "john.doe@example.com",
  "username": "johndoe",
  "fullname": "John Doe",
  "password": "SecurePass123!"
}

// List users with filtering
GET /iam/users?page=1&limit=10&search=john&isActive=true

// Update user
PUT /iam/users/1
{
  "fullname": "John Smith",
  "isActive": false
}
```

### 2. Role Management

#### Endpoints

- **GET** `/iam/roles` - List roles with pagination and filtering
- **GET** `/iam/roles/:id` - Get role by ID
- **POST** `/iam/roles` - Create new role
- **PUT** `/iam/roles/:id` - Update role
- **DELETE** `/iam/roles/:id` - Delete role

#### Features

- ✅ Role code and name uniqueness validation
- ✅ System role protection (cannot be updated/deleted)
- ✅ Pagination and search functionality
- ✅ Transaction support
- ✅ Automatic code normalization (uppercase)

#### Example Usage

```typescript
// Create a new role
POST /iam/roles
{
  "code": "ADMIN",
  "name": "Administrator",
  "isSystem": false
}

// List roles
GET /iam/roles?page=1&limit=10&search=admin&isSystem=false

// Update role
PUT /iam/roles/1
{
  "name": "Super Administrator"
}
```

### 3. User Role Assignments

#### Endpoints

- **GET** `/iam/user-role-assignments` - List assignments with filtering
- **GET** `/iam/user-role-assignments/:id` - Get assignment by ID
- **POST** `/iam/user-role-assignments` - Assign role to user
- **DELETE** `/iam/user-role-assignments/:id` - Revoke role assignment
- **GET** `/iam/user-role-assignments/user/:userId/location/:locationId` - Get user roles at location
- **GET** `/iam/user-role-assignments/user/:userId/role/:roleId` - Get user locations for role

#### Features

- ✅ Location-based role assignments
- ✅ Duplicate assignment prevention
- ✅ Cascade delete on user deletion
- ✅ Restrict delete on role deletion
- ✅ Flexible filtering by user, role, or location

#### Example Usage

```typescript
// Assign role to user at location
POST /iam/user-role-assignments
{
  "userId": 1,
  "roleId": 2,
  "locationId": 5
}

// Get all roles for user at specific location
GET /iam/user-role-assignments/user/1/location/5

// List all assignments for a user
GET /iam/user-role-assignments?userId=1
```

## Data Models

### User

```typescript
interface User {
  id: number
  email: string
  username: string
  fullname: string
  passwordHash: string
  isRoot: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: number
  updatedBy: number
}
```

### Role

```typescript
interface Role {
  id: number
  code: string
  name: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: number
  updatedBy: number
}
```

### User Role Assignment

```typescript
interface UserRoleAssignment {
  id: number
  userId: number
  roleId: number
  locationId: number
  assignedAt: Date
  assignedBy: number
}
```

## Validation Rules

### User Validation

- **Email**: Must be valid email format
- **Username**: 3-50 characters
- **Fullname**: 1-255 characters
- **Password**: 8-100 characters

### Role Validation

- **Code**: 2-50 characters, auto-converted to uppercase
- **Name**: 2-255 characters

### Assignment Validation

- **userId**: Positive integer
- **roleId**: Positive integer
- **locationId**: Positive integer

## Error Handling

The module uses standardized HTTP errors:

- **400 Bad Request**: Invalid input data
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate email/username/code/name or constraint violation

### Error Response Format

```json
{
  "success": false,
  "code": "EMAIL_EXISTS",
  "message": "User with this email already exists",
  "details": {
    "email": "john.doe@example.com"
  }
}
```

### Common Error Codes

#### User Errors
- `USER_NOT_FOUND` - User doesn't exist
- `EMAIL_EXISTS` - Email already in use
- `USERNAME_EXISTS` - Username already in use
- `EMAIL_USERNAME_EXISTS` - Both email and username exist
- `ROOT_USER_DELETE_FORBIDDEN` - Cannot delete root user

#### Role Errors
- `ROLE_NOT_FOUND` - Role doesn't exist
- `ROLE_CODE_EXISTS` - Role code already in use
- `ROLE_NAME_EXISTS` - Role name already in use
- `SYSTEM_ROLE_UPDATE_FORBIDDEN` - Cannot update system role
- `SYSTEM_ROLE_DELETE_FORBIDDEN` - Cannot delete system role

#### Assignment Errors
- `ASSIGNMENT_NOT_FOUND` - Assignment doesn't exist
- `ASSIGNMENT_EXISTS` - User already has this role at this location

## Service Layer

### IamUsersService

```typescript
class IamUsersService {
  async list(params: ListUsersParams): Promise<PaginatedResponse<User>>
  async getById(id: number): Promise<User>
  async getByEmail(email: string): Promise<User | null>
  async getByUsername(username: string): Promise<User | null>
  async create(dto: CreateUserDto, createdBy?: number): Promise<User>
  async update(id: number, dto: UpdateUserDto, updatedBy?: number): Promise<User>
  async delete(id: number): Promise<void>
  async toggleActive(id: number, updatedBy?: number): Promise<User>
}
```

### IamRolesService

```typescript
class IamRolesService {
  async list(params: ListRolesParams): Promise<PaginatedResponse<Role>>
  async getById(id: number): Promise<Role>
  async getByCode(code: string): Promise<Role | null>
  async create(dto: CreateRoleDto, createdBy?: number): Promise<Role>
  async update(id: number, dto: UpdateRoleDto, updatedBy?: number): Promise<Role>
  async delete(id: number): Promise<void>
}
```

### IamUserRoleAssignmentsService

```typescript
class IamUserRoleAssignmentsService {
  async list(params: ListAssignmentsParams): Promise<PaginatedResponse<UserRoleAssignment>>
  async getById(id: number): Promise<UserRoleAssignment>
  async getUserRolesAtLocation(userId: number, locationId: number): Promise<UserRoleAssignment[]>
  async getUserLocationsForRole(userId: number, roleId: number): Promise<UserRoleAssignment[]>
  async assign(dto: AssignRoleDto, assignedBy?: number): Promise<UserRoleAssignment>
  async revoke(id: number): Promise<void>
  async revokeAllAtLocation(userId: number, locationId: number): Promise<void>
  async revokeRoleFromUser(userId: number, roleId: number): Promise<void>
  async hasRole(userId: number, roleId: number, locationId: number): Promise<boolean>
}
```

## Best Practices

### 1. Always Use Transactions

The service layer automatically wraps create/update operations in transactions to ensure data integrity.

### 2. Input Sanitization

All string inputs are automatically:
- Trimmed of whitespace
- Converted to lowercase (for email, username, role code)

### 3. Password Security

- Passwords are hashed using bcrypt before storage
- Plain passwords are never stored in the database
- Password validation enforces minimum length requirements

### 4. Audit Trail

All entities track:
- `createdAt` - When the record was created
- `updatedAt` - When the record was last updated
- `createdBy` - User ID who created the record
- `updatedBy` - User ID who last updated the record

### 5. Soft Delete Consideration

Currently using hard delete. Consider implementing soft delete for:
- Better audit trails
- Data recovery capabilities
- Compliance requirements

## Future Enhancements

### Planned Features

1. **Permission System**
   - Granular permissions per role
   - Permission inheritance
   - Custom permission sets

2. **Authentication**
   - JWT token generation
   - Refresh token support
   - Session management

3. **Authorization Middleware**
   - Route-level permission checks
   - Role-based access control
   - Location-based access control

4. **Audit Logging**
   - Track all IAM operations
   - Login/logout tracking
   - Permission change history

5. **Advanced Features**
   - Multi-factor authentication (MFA)
   - Password reset functionality
   - Email verification
   - Account lockout after failed attempts
   - Password expiration policies

6. **Soft Delete**
   - Implement soft delete for users and roles
   - Add restore functionality
   - Automatic cleanup of old soft-deleted records

## Testing

### Unit Tests

```typescript
// Example test structure
describe('IamUsersService', () => {
  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      // Test implementation
    })
    
    it('should throw ConflictError if email exists', async () => {
      // Test implementation
    })
  })
})
```

### Integration Tests

```typescript
// Example API test
describe('POST /iam/users', () => {
  it('should create user and return 201', async () => {
    const response = await app.handle(
      new Request('http://localhost/iam/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          username: 'testuser',
          fullname: 'Test User',
          password: 'SecurePass123!'
        })
      })
    )
    
    expect(response.status).toBe(201)
  })
})
```

## Migration Guide

### Database Migrations

```sql
-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  fullname VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_root BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL
);

-- Create roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL UNIQUE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL
);

-- Create user_role_assignments table
CREATE TABLE user_role_assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  location_id INTEGER NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_by INTEGER NOT NULL,
  UNIQUE(user_id, location_id)
);
```

## Contributing

When contributing to the IAM module:

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include JSDoc comments
4. Write unit tests for new features
5. Update this documentation
6. Ensure all linting passes

## Support

For questions or issues related to the IAM module, please contact the development team or create an issue in the project repository.

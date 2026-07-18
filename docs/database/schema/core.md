# Schema: Core (IAM, Auth, Audit)

Source: `iam.ts`, `session.ts`, `audit.ts`

---

## `roles` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| code | text | NO | | unique |
| name | text | NO | | |
| description | text | YES | | |
| permissions | text[] | NO | [] | permission strings |
| is_system | boolean | NO | false | protected |

## `users` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| email | text | NO | | unique |
| username | text | NO | | unique |
| fullname | text | NO | | |
| pin_code | text | YES | | |
| password_hash | text | YES | | null for system accounts |
| is_root | boolean | NO | false | implicit superadmin |
| is_system | boolean | NO | false | |
| is_active | boolean | NO | true | |
| default_location_id | int | YES | | FK→locations (set null) |
| last_login_at | timestamptz | YES | | |

## `user_assignments` (no audit)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| user_id | int | NO | | FK→users (cascade) |
| role_id | int | NO | | FK→roles (restrict) |
| location_id | int | NO | | FK→locations (restrict) |
| added_at | timestamptz | NO | now() | |
| added_by | int | YES | | FK→users (set null) |

Unique: `(user_id, location_id)`

## `sessions` (no audit)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| user_id | int | NO | | FK→users (cascade) |
| location_id | int | NO | | FK→locations (restrict) |
| ip_address | text | YES | | |
| user_agent | varchar(512) | YES | | |
| revoked_at | timestamptz | YES | | explicit invalidation |
| created_at | timestamptz | NO | now() | |
| expired_at | timestamptz | NO | | absolute expiry |

## `audit_logs` (no audit)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| user_id | int | NO | | not a FK |
| action | enum | NO | | CREATE/UPDATE/DELETE/LOGIN/LOGOUT/OTHER |
| entity_type | text | NO | | table name |
| entity_id | text | YES | | record ID |
| description | text | NO | | |
| old_value | jsonb | YES | | |
| new_value | jsonb | YES | | |
| ip_address | text | YES | | |
| user_agent | text | YES | | |
| action_at | timestamptz | NO | now() | |

# ERD: Core (IAM, Auth, Audit)

```
[roles]                          [locations]
+------------------+             +------------------+
| PK id            |             | PK id            |
| * code (unique)  |             | * code (unique)  |
| * name           |             | * name (unique)  |
| * permissions[]  |             | * type           |
| * is_system      |             | * is_active      |
+------------------+             +------------------+
        |                                |
        +----------+   +----------+      |
                   |   |          |      |
            [user_assignments]    |      |
            +------------------+  |      |
            | PK id            |  |      |
            | * FK user_id -------+      |
            | * FK role_id ----+  |      |
            | * FK location_id ----------+
            | * added_at       |         |
            +------------------+         |
                   |                     |
[users]            |                     |
+------------------+                     |
| PK id            |                     |
| * email (unique) |                     |
| * username (uniq)|                     |
| * fullname       |                     |
|   password_hash  |                     |
| * is_root        |                     |
| * is_system      |                     |
| * is_active      |                     |
|   FK default_location_id -------------+
+------------------+
        |
[sessions]                    [audit_logs]
+------------------+          +------------------+
| PK id            |          | PK id            |
| * FK user_id     |          | * user_id        |
| * FK location_id |          | * action (enum)  |
|   ip_address     |          | * entity_type    |
|   revoked_at     |          | * description    |
| * created_at     |          |   old/new_value  |
| * expired_at     |          | * action_at      |
+------------------+          +------------------+
```

## Relationships

| Parent | Child | FK | On Delete |
|--------|-------|-----|-----------|
| users | sessions | user_id | cascade |
| users | user_assignments | user_id | cascade |
| roles | user_assignments | role_id | restrict |
| locations | user_assignments | location_id | restrict |
| locations | sessions | location_id | restrict |
| locations | users | default_location_id | set null |

Unique: `user_assignments(user_id, location_id)` — one role per user per location.

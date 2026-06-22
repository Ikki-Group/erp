# Schema Review: session.ts

**Date:** 2026-06-23  
**Reviewer:** AI + Solo Developer  
**Status:** 🔄 IN REVIEW

---

## 📊 Current Schema

```typescript
export const sessionsTable = pgTable(
  'sessions',
  {
    ...pk,
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    revokedAt: timestamp('revoked_at', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    expiredAt: timestamp('expired_at', { mode: 'date', withTimezone: true })
      .notNull(),
  },
  (t) => [
    index('sessions_expired_at_idx').on(t.expiredAt),
    index('sessions_user_revoked_idx').on(t.userId, t.revokedAt),
  ],
)
```

---

## ✅ Strengths

### 1. **Excellent Documentation** ⭐⭐⭐⭐⭐

```typescript
/**
 * Sessions Table
 *
 * Active authentication sessions. High-churn — no auditBasicColumns.
 *
 * `locationId` — the location context this session is active in.
 *               Required for LBAC: permission checks are resolved against
 *               the (user, location) pair, not the user alone.
 *               Switching locations requires creating a new session or
 *               an explicit location-switch flow (your choice).
 *               onDelete: 'restrict' — retiring a location must clear its
 *               sessions first (service layer responsibility).
 *
 * `revokedAt`  — explicit invalidation (password change, forced logout,
 *               role change). Null = not revoked. The auth layer must
 *               treat revokedAt IS NOT NULL as equivalent to expired.
 *               Retains the row for audit purposes.
 *
 * `ipAddress`  — captured at session creation. Used for anomaly detection
 *               and user-facing "active sessions" display.
 *
 * `userAgent`  — raw UA string at session creation. Truncated to 512 chars
 *               to avoid unbounded storage from malformed clients.
 */
```

**✅ Very detailed:** Business rules, security patterns, cleanup responsibilities

---

### 2. **Proper Cascade Behavior** ⭐⭐⭐⭐⭐

```typescript
userId: integer('user_id')
  .references(() => usersTable.id, { onDelete: 'cascade' })
```

**✅ Perfect:** User deleted → sessions auto-deleted

---

### 3. **Audit & Security Fields** ⭐⭐⭐⭐⭐

```typescript
ipAddress: text('ip_address'),      // Security monitoring
userAgent: text('user_agent'),      // Device tracking
revokedAt: timestamp('revoked_at'), // Explicit revocation
```

**✅ Excellent:** Complete audit trail for security analysis

---

### 4. **Performance Indexes** ⭐⭐⭐⭐

```typescript
index('sessions_expired_at_idx').on(t.expiredAt),
index('sessions_user_revoked_idx').on(t.userId, t.revokedAt),
```

**✅ Good:** Cleanup job optimization and user session queries

---

### 5. **High-Churn Optimization** ⭐⭐⭐⭐⭐

```typescript
// No auditBasicColumns (createdBy, updatedBy)
// Sessions are high-churn, don't need full audit
```

**✅ Smart design:** Avoids unnecessary overhead on frequent writes

---

## ⚠️ Issues & Improvements

### **CRITICAL: Missing locationId Column** 🔴

**Documentation Says:**
```typescript
/**
 * `locationId` — the location context this session is active in.
 *               Required for LBAC: permission checks are resolved against
 *               the (user, location) pair, not the user alone.
 */
```

**But Schema Has:**
```typescript
// ❌ NO locationId column defined!
```

**Impact:**
- **LBAC broken** - Can't resolve permissions per location
- Documentation describes feature that doesn't exist
- Business logic expects locationId but schema missing

---

**Solution:**

```typescript
export const sessionsTable = pgTable(
  'sessions',
  {
    ...pk,
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    
    // ✅ ADD THIS:
    locationId: integer('location_id')
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'restrict' }),

    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    // ...
  },
  (t) => [
    index('sessions_expired_at_idx').on(t.expiredAt),
    index('sessions_user_revoked_idx').on(t.userId, t.revokedAt),
    
    // ✅ ADD INDEX:
    index('sessions_location_idx').on(t.locationId),
  ],
)
```

**Why `notNull`:**
- LBAC requires location context for every session
- Permission checks need (user, location) pair
- No valid use case for session without location

**Why `onDelete: 'restrict'`:**
- Matches documentation: "retiring a location must clear its sessions first"
- Prevents orphaned sessions
- Forces explicit cleanup

---

### **MINOR: Missing Composite Index for Common Query** 🟡

**Common Query Pattern:**
```sql
-- Get user's active sessions
SELECT * FROM sessions
WHERE user_id = ? 
  AND revoked_at IS NULL 
  AND expired_at > NOW();

-- Cleanup expired sessions
SELECT * FROM sessions
WHERE expired_at < NOW();
```

**Current Indexes:**
```typescript
index('sessions_expired_at_idx').on(t.expiredAt),
index('sessions_user_revoked_idx').on(t.userId, t.revokedAt),
```

**✅ Already Good!** Both patterns covered.

---

### **MINOR: userAgent Field Size Limit** 🟡

**Documentation Says:**
> "raw UA string at session creation. Truncated to 512 chars"

**But Schema Has:**
```typescript
userAgent: text('user_agent'),  // No size limit!
```

**Issue:**
- `text` type = unlimited storage
- Malicious client could send huge UA string
- Documentation claims truncation but schema doesn't enforce

**Solutions:**

#### Option A: Database Constraint
```typescript
userAgent: varchar('user_agent', { length: 512 })
```

**Pros:** DB-level enforcement  
**Cons:** Can't store longer UAs even if needed

---

#### Option B: Application-Level (Current)
```typescript
// In service layer
userAgent: text('user_agent')

// Contract validation:
userAgent: z.string().max(512)
```

**Pros:** Flexible, can log/warn on truncation  
**Cons:** Relies on application enforcement

---

**Recommendation:** **Option A** (varchar constraint)
- Prevents malicious payloads at DB level
- Matches documentation
- 512 chars is sufficient for any real UA

---

### **DESIGN: Session Expiry Strategy** 🟢

**Current Schema:**
```typescript
expiredAt: timestamp('expired_at').notNull()
```

**Questions:**

1. **How is expiry set?**
   - Fixed duration (e.g., 24h from creation)?
   - Sliding window (extends on activity)?
   - Configurable per user/role?

2. **Cleanup strategy:**
   - Background job to delete expired rows?
   - Keep for audit trail?

**Recommendations:**

#### For Fixed Expiry (Simple)
```typescript
// Set at creation:
expiredAt = createdAt + 24h
```

**Cleanup Job:**
```sql
-- Delete sessions expired >30 days ago
DELETE FROM sessions 
WHERE expired_at < NOW() - INTERVAL '30 days';
```

---

#### For Sliding Window (Complex)
```typescript
// Add lastActivityAt column
lastActivityAt: timestamp('last_activity_at')
  .notNull()
  .defaultNow()

// Update on each request
UPDATE sessions 
SET last_activity_at = NOW() 
WHERE id = ?;

// Expire if inactive >30min
WHERE last_activity_at < NOW() - INTERVAL '30 minutes';
```

**Trade-off:** More writes, but better UX

---

**Current Design:** Appears to be fixed expiry (simple, efficient)  
**✅ Good choice** for high-churn table

---

### **DESIGN: Revocation Pattern** ⭐⭐⭐⭐⭐

**Current:**
```typescript
revokedAt: timestamp('revoked_at')  // Soft revoke
```

**✅ Excellent pattern:**
- Preserves audit trail
- Can analyze revocation patterns
- "Unrevoke" is possible (set to null)

**Alternative (not recommended):**
```typescript
// Hard delete on revoke
DELETE FROM sessions WHERE id = ?;
```

**Why soft revoke is better:**
- Security audit ("when was this session revoked?")
- Forensics (suspicious activity analysis)
- Rollback capability

---

## 📝 Summary

| Category | Rating | Notes |
|----------|--------|-------|
| **Documentation** | ⭐⭐⭐⭐⭐ | Excellent security & LBAC notes |
| **Security Fields** | ⭐⭐⭐⭐⭐ | IP, UA, revocation complete |
| **Performance** | ⭐⭐⭐⭐ | Good indexes for cleanup |
| **Design** | ⭐⭐⭐⭐⭐ | High-churn optimization |
| **Completeness** | ⭐⭐ | **CRITICAL: Missing locationId!** |
| **Overall** | ⭐⭐⭐ | Excellent design, one critical field missing |

---

## 🎯 Recommended Actions

### **Priority 1: Add locationId Column** 🔴

**Action:** Add missing locationId for LBAC

```typescript
locationId: integer('location_id')
  .notNull()
  .references(() => locationsTable.id, { onDelete: 'restrict' }),

// Add index:
index('sessions_location_idx').on(t.locationId),
```

**Effort:** 2 minutes  
**Impact:** ⭐⭐⭐⭐⭐ (Critical for LBAC, unblocks permission system)

---

### **Priority 2: Add userAgent Size Limit** 🟡

**Action:** Change text to varchar(512)

```typescript
userAgent: varchar('user_agent', { length: 512 })
```

**Effort:** 1 minute  
**Impact:** ⭐⭐⭐ (Security hardening)

---

### **Priority 3: Consider Cleanup Strategy** 🟢

**Action:** Document expiry and cleanup approach

**Questions to answer:**
1. When to delete expired sessions? (immediately, 30d retention, never?)
2. Background job needed? (cron, pg_cron, application?)
3. Audit requirements? (security team needs retention?)

**Effort:** Planning only  
**Impact:** ⭐⭐ (Operational clarity)

---

## 💡 Schema Best Practices Applied

✅ **Soft Revocation** - Preserves audit trail  
✅ **Cascade Delete** - User gone = sessions gone  
✅ **Security Fields** - IP/UA for monitoring  
✅ **Performance Indexes** - Cleanup optimized  
✅ **High-Churn Design** - No unnecessary audit columns  
❌ **LBAC Column** - Missing locationId (critical!)

---

## 🔗 LBAC Design Context

**From IAM Schema Review:**
> "Users are granted roles **per location**. Permission checks resolve against (user, location) pair."

**Session Must Include:**
- `userId` - WHO is authenticated ✅
- `locationId` - WHERE they are authenticated ❌ **MISSING!**

**Without locationId:**
- Can't determine user's permissions at current location
- LBAC system incomplete
- Security boundary unclear

---

## 🎯 Example Use Case

**Login Flow (Expected):**
```typescript
// User logs in to specific location
POST /auth/login
{
  email: "user@example.com",
  password: "***",
  locationId: 1  // Jakarta Store
}

// Create session with location context
const session = await sessionRepo.create({
  userId: user.id,
  locationId: 1,  // ❌ Currently missing in schema!
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  expiredAt: addHours(new Date(), 24)
})
```

**Permission Check:**
```typescript
// Check if user can read products at current location
const canRead = await authz.check({
  userId: session.userId,
  locationId: session.locationId,  // ❌ Currently undefined!
  permission: 'product.read'
})
```

---

**Status:** ✅ Schema is well-designed except one critical missing field  
**Next:** Add locationId and apply fixes

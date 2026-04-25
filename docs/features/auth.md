# Authentication (Auth)

**Layer**: 1.5 (Security) | **Status**: MVP | **Priority**: Critical | **Estimate**: 16 hours

---

## 1. Overview

Every staff member needs to login to Ikki ERP. Authentication handles user login, issues secure tokens, and validates every API request. UMKM owners need simple login (username/password), fast access, and account security (password reset, logout, account locking).

---

## 2. Core Objectives

- **Secure Login**: Verify user identity with cryptographic password hashing (prevent unauthorized access)
- **Fast Session Management**: JWT tokens eliminate database lookups on every request (scalable, quick)
- **Account Safety**: Password reset for forgotten passwords, force password change on first login, account locking after failed attempts
- **Session Control**: Users can logout, old sessions invalidated, brute-force protection
- **Audit Trail**: Track who logged in, when, from where (IP address, device)

---

## 3. Use Cases & Workflows

### UC-001: Staff Login (Daily entry)

**Who**: Barista, Manager, Staff  
**When**: Start of shift  
**Goal**: Gain access to system

**Steps**:
1. Staff opens login page → enters username "adi_barista" + password
2. System validates credentials (case-sensitive password, case-insensitive username)
3. If correct → issues tokens (fast access, 2-hour expiry)
4. If incorrect → error message, failed attempt tracked
5. After 5 failed attempts → account locked for 15 minutes (prevent brute force)
6. Staff now logged in, can access dashboard

**Why it matters**: 
- Security (only authorized staff access)
- Account protection (auto-lock prevents password guessing)
- Fast login (no delays, minimal friction)

---

### UC-002: Staff Forgot Password (Account recovery)

**Who**: Any staff member  
**When**: "I forgot my password"  
**Goal**: Reset password without calling admin

**Steps**:
1. On login screen, clicks "Forgot Password"
2. Enters email address
3. System sends reset link (expires in 30 minutes)
4. Staff checks email, clicks link
5. Sets new password (must meet strength: 8+ chars, uppercase, number, symbol)
6. Next login uses new password

**Why it matters**: 
- Self-service (no need to call IT/owner)
- Security (temporary link expires, password reset invalidates old sessions)
- User autonomy (quick recovery)

---

### UC-003: First Login - Force Password Change

**Who**: New staff member  
**When**: First time logging in (admin created account with temp password)  
**Goal**: Set permanent password

**Steps**:
1. Admin creates new account: "budi_coffee" with temporary password "Temp123!Xyz"
2. Budi logs in with temp password
3. System detects "password_change_required" flag
4. Redirects to password change form (not dashboard)
5. Budi enters: current password (temp), new password, confirm
6. System validates new password is strong + different from old
7. Password changed → flag cleared → redirects to dashboard

**Why it matters**: 
- Security (ensures only real user knows password)
- Compliance (admin can't see staff password)
- Clean onboarding (no default passwords lingering)

---

## 4. Recommended Enhancements (Phase 2+)

- **Brute Force Graduated Backoff**: Increase wait time after each failed attempt (1s → 2s → 4s → lock)
  - Priority: Important (stronger attack prevention)
  - Why: Current 15-min lock is harsh; gradual backoff is more user-friendly
  - Estimate: 6 hours

- **Two-Factor Authentication**: SMS or authenticator app for sensitive operations
  - Priority: Nice-to-have (high security for managers/owners)
  - Why: Prevent account compromise even with password leak
  - Estimate: 12 hours

- **Session Management Dashboard**: View/terminate all active sessions
  - Priority: Nice-to-have (staff account management)
  - Why: Staff can logout on other devices (shared computers)
  - Estimate: 8 hours

- **Email Verification on Signup**: Verify email address before account activation
  - Priority: Nice-to-have (prevent fake emails)
  - Why: Ensure password reset emails reach real people
  - Estimate: 4 hours

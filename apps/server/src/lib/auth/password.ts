/**
 * Password hashing and verification utilities using Bun's built-in password functions
 * @module lib/auth/password
 */

/**
 * Hashes a password using Bun's password hashing (bcrypt/scrypt)
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string) {
	return Bun.password.hash(password)
}

/**
 * Verifies a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns True if password matches hash, false otherwise
 */
export async function verifyPassword(password: string, hash: string) {
	return Bun.password.verify(password, hash)
}

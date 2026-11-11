/**
 * Fixed "boot time" used as the audit timestamp for seeded fixture rows.
 * Kept as a single constant (rather than `new Date()` per row) so fixture
 * data is stable across re-renders within a session.
 *
 * DTOs type audit timestamps as `Date` (`zp.date` = `z.coerce.date()`,
 * inferring the *parsed output* type). Fixtures are hand-typed as the DTO
 * directly, so this must return a `Date` — `JSON.stringify` serializes it
 * to an ISO string on the wire exactly like the real API does, and the
 * client-side schema then coerces it back.
 */
const bootTimestamp = new Date()

export function nowIso(): Date {
	return bootTimestamp
}

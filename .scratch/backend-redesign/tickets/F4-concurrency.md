# F4 · Concurrency & locking model

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: F2

## Question

How does the backend handle concurrent operations that contend on the same data?

Press the concrete claims the PRDs make: opname blocks ALL stock movements at a location while `in_progress`; one open shift per cashier per location; one open order per table; stock quantity cannot go negative under concurrent deductions. Decide the mechanism (row locks, status guards, DB constraints, serialization) and whether these locks are realistic for a single-business scale. Output: an ADR defining the concurrency/locking approach.

## Notes

- Opname location-wide lock is a big concurrency claim — press whether it's needed or over-engineered for Ikki's scale.
- Depends on F2 (transaction model defines what a lock even means here).

# F3 · Money & quantity precision model

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: F1

## Question

How are money and quantities represented, rounded, and converted across the domain?

Press: Money/Qty value objects (decimal.js) vs alternatives; where construction happens (boundary in, numeric-string out); rounding rules (currency vs qty precision); how UoM conversion factors interact with money in costing/HPP without precision loss. This fixes the `Number(string)` leak throughout POS. Output: an ADR defining Money/Qty and the rounding/conversion discipline.

## Notes

- Live P2: POS totals round-trip through `Number(string)`.
- Costing (per-location weighted avg) and HPP depend heavily on this — get it right before those domain tickets.
- Old ADR-0005 is raw material.

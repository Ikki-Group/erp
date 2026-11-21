# 05: UI consistency audit → punch-list

**Parent:** Spec B (#48)

**What to build:** A concrete, evidence-backed punch-list of where the wired screens fall short of the `ikki-design` steering, produced by a pass over every screen (including the two new ones from tickets 03 and 04). The punch-list's individual fixes become follow-up tickets; this ticket delivers the audit itself, not an open-ended "fix everything".

**Blocked by:** #51 (Dashboard real data), #52 (Audit-log browser) — so the audit also covers the new screens.

**Status:** ready-for-agent

- [ ] A written punch-list checking each wired screen against `ikki-design`: loading via `ui/skeleton`, empty via `ui/empty`, inline error (no bare spinners), table density, form layout (`ui/field`, label-above-input, verb buttons), dark-mode parity, focus-visible rings.
- [ ] Each finding cites the screen and the specific gap (not a vibe), and is grouped so it can be split into follow-up tickets.
- [ ] Any high-value, low-risk fix that is trivially safe is landed inline; anything larger is filed as a follow-up ticket rather than done here.
- [ ] Findings reuse/extend existing `ui`/`reui` primitives — no primitive forked into a route, no new accent hue, no hard-coded colors (per steering).

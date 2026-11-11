# User form UX research: global or per-location role assignment

**Date researched:** 2026-09-24

**Question:** What UI/UX best supports assigning roles to a user either globally or per location, where the two role modes are mutually exclusive and locations must be unique?

**Scope:** This note is research and design guidance only. It does not modify application code or prescribe the repository’s domain model beyond the stated requirements.

## Executive recommendation

Model the assignment mode as one required, explicitly labeled choice:

- **Global roles** — role assignments apply across all locations.
- **Location-specific roles** — role assignments apply only to selected locations.

Use a native radio group (or an equivalently accessible radio-group implementation), not two independent checkboxes. When **Location-specific roles** is selected, reveal a repeatable list of location/role rows. Each row has one location and one role; prevent choosing the same location twice. Keep the selected values when validation fails, and give a specific error that explains the conflict and how to fix it.

A useful conceptual shape is:

```text
assignmentMode: "global" | "location"

if global:
  globalRoles: RoleId[]
  locationAssignments: []

if location:
  globalRoles: []
  locationAssignments: Array<{ locationId: LocationId; roleIds: RoleId[] }>
```

The exact data shape remains an application decision, but the UI should make the invariant visible: **one mode is active, and only that mode’s assignment controls are editable and submitted.** The server must enforce the same invariant because client-side exclusivity is not an authorization boundary.

## Findings and implications

### 1. Global and per-location are mutually exclusive modes, so present them as radios

W3C’s ARIA Authoring Practices defines a radio group as checkable buttons where “no more than one” can be checked at a time. It also specifies that the group needs an accessible name and that its supporting description can be associated with the group. [1]

GOV.UK’s first-party Design System says to use radios when users can only select one option, to group them in a `fieldset` with a `legend`, and to add a hint such as “Select one option” when useful. It also cautions against pre-selecting a radio for a question because users may miss the question or submit the wrong answer. [2]

**Design consequence:**

- Label the group **Role assignment scope** or **How should roles apply?**
- Use two radios with clear labels and short explanatory hints:
  - **Global** — “Applies across all locations.”
  - **Per location** — “Applies only to the locations selected below.”
- Prefer no default if choosing a mode is consequential and both modes are valid; require the administrator to choose. If product policy has a safe default, make the selected state and its consequences obvious.
- Do not use two checkboxes such as “Global” and “Per location”; that would allow an invalid intermediate state and make the user infer exclusivity from styling.

### 2. Reveal only the dependent question, and keep it simple

GOV.UK documents conditionally revealed content for a selected radio. Its guidance says to reveal related questions only, keep the revealed question simple, and move complicated multi-part questions to the next page. It also notes that users are not always notified when content is shown or hidden, which can create accessibility issues for complex dynamic experiences. [2]

**Design consequence:**

- Keep the mode radios visible at all times.
- Under **Global**, show the global role selector and hide or remove the location assignment editor from the active form flow.
- Under **Per location**, show the location assignment editor and hide or disable the global role selector.
- Do not merely gray out the inactive branch while still allowing its values to submit. On mode change, clear the inactive branch or explicitly mark it as discarded; if existing data would be lost, ask for confirmation before clearing it.
- For edit forms, preserve the saved mode and assignments. A mode switch should be treated as a consequential change, not as a silent toggle.

### 3. Choose the location control based on list size; do not use a multi-select `<select>` as the default

The WAI-ARIA combobox pattern describes a combobox as an input with a popup that can present a collection of allowed values. It explicitly gives “a location field must contain a valid location name” as an example of a predefined allowed-value use case. The pattern also defines Escape behavior for dismissing the popup without changing the previous value and requires an accessible name distinct from the value. [3]

GOV.UK says its select component should be a last resort because some users struggle with selects, and specifically says not to add multi-option selection to a select: `<select multiple>` has poor usability and assistive-technology support; a list of checkboxes is often better. [4]

**Design consequence:**

- For a small, stable set of locations, use a labeled list of checkboxes if the user is selecting several locations, with a hint such as **Select all locations that apply**. GOV.UK’s checkbox guidance explicitly supports selecting one or more options and recommends a fieldset/legend and a “select all that apply” hint. [5]
- For a large location catalog, use an accessible searchable combobox/autocomplete to add locations one at a time, followed by a visible list of selected location chips/rows. The control should select from known location IDs, not accept arbitrary free text. Follow the WAI-ARIA combobox keyboard and focus behavior rather than inventing a custom interaction. [3]
- Avoid a native multi-select dropdown for this workflow.
- Show the selected locations as durable rows below the picker so users can review, change, and remove them without reopening a menu.

### 4. Enforce location uniqueness at selection time and again at submit time

The primary sources do not prescribe a specific duplicate-location UI, but they do establish two relevant constraints: a location is a predefined allowed value in the combobox pattern, and WCAG treats values outside an allowed set as input errors that must be identified and, when known, accompanied by a correction suggestion. [3] [6]

**Design consequence:**

- Use stable `locationId` values for identity; do not deduplicate by display label alone.
- Remove or disable a location from the available picker once it has been added, or reject it immediately with an inline message such as **This location is already assigned. Choose another location or edit the existing assignment.**
- Keep one assignment row per unique location. If one location can have multiple roles, put a multi-role selector inside that row rather than creating duplicate location rows.
- Also validate uniqueness on blur and on submit. Client-side filtering is for usability; the API/database remains the final authority.
- If the user submits duplicate rows due to stale data or a race, return a field/group error that identifies the repeated location and preserves all entered values.

### 5. Roles are multi-valued within a mode, so use a multi-select pattern with explicit instructions

GOV.UK distinguishes radios (one option) from checkboxes (one or more options), recommends a fieldset and legend for grouped checkboxes, and recommends a hint such as “Select all that apply.” It also says not to pre-select checkbox options because users may not realize they missed a question. [5]

**Design consequence:**

- Treat **mode** as single-select and **roles** as multi-select unless the domain explicitly allows only one role.
- Label the role field with the scope in context: **Global roles** or **Roles for [Location name]**. Avoid a generic “Roles” label that makes scope ambiguous.
- If the role catalog is large, use a searchable checkbox list or an accessible multi-select with a clearly reviewable selected-items area; do not hide the selected state solely inside a closed menu.
- Consider a compact “selected roles” summary per location row, but keep the full role names available to assistive technology and keyboard users.

### 6. Validation errors must identify the problem and say how to fix it

WCAG 2.2 Success Criterion 3.3.1 says that when an input error is detected, the item in error must be identified and the error described in text. [6] SC 3.3.3 says that when a known correction is possible, the suggestion should be provided. [7]

GOV.UK’s error-message guidance says to show the error next to the field and in an error summary, keep entered values, directly connect the message to the relevant label/fieldset, and explain what went wrong and how to fix it. It also says not to use an error message for an authorization/eligibility problem that the user cannot fix; that should be a separate explanatory page/state. [8]

**Recommended validation copy:**

- Missing mode: **Select how roles should apply: globally or per location.**
- Global mode with no role: **Select at least one global role.**
- Per-location mode with no rows: **Add at least one location and role assignment.**
- Missing row location: **Select a location for this assignment.**
- Missing row role: **Select at least one role for this location.**
- Duplicate location: **This location is already assigned. Edit the existing assignment or choose another location.**
- Cross-mode payload: **Choose either global roles or per-location roles, not both.**

Use an error summary when the form has multiple errors, with links to the corresponding controls. Associate group errors with the relevant `fieldset`/group description so keyboard and screen-reader users encounter the same explanation as sighted users.

### 7. Scope semantics need to be visible, not inferred from control placement

Microsoft’s first-party Entra documentation treats a role assignment’s resource boundary as its **scope**. It distinguishes tenant-wide role assignments from assignments scoped to a resource or administrative unit, and explains that restricting scope limits where the role permissions apply. The documented admin-center flow assigns tenant-scope roles from the role, while scoped assignments are made from the resource/administrative-unit context. [9]

This is not a direct prescription for this product’s UI, but it is a useful authorization UX precedent: scope is a first-class part of a role assignment, not an incidental property users should infer from where a role happened to be selected.

**Design consequence:**

- Put scope/mode before role selection.
- Repeat scope in headings and summaries: **Global roles** and **Per-location roles**.
- In the review state, summarize the effective permission boundary in plain language, for example: **2 roles across all locations** or **Manager at Downtown; Cashier at Airport**.
- If some roles are unavailable in one scope, explain why near the role selector rather than silently omitting them. Microsoft’s documentation notes that only roles relevant to a given scoped resource may be shown in that context. [9]

## Proposed interaction flow

1. **User identity**
   - Name/email fields as usual.
2. **Role assignment scope** (required radio group)
   - Global — applies across all locations.
   - Per location — applies only to selected locations.
3. **Conditional assignment editor**
   - Global: choose one or more global roles.
   - Per location: add a location; for each unique location, choose one or more roles.
4. **Review summary before save**
   - State the mode and effective scope in plain language.
   - Highlight locations and roles, especially when editing an existing user.
5. **Save**
   - Validate the discriminated mode, role requirements, valid location IDs, and unique locations on the server.
   - On failure, preserve the submitted values and return actionable field/group errors.

## State and edge-case decisions to settle with product/domain owners

- Is having no roles allowed, or must every active user have at least one role?
- Can a location-specific assignment have multiple roles?
- Are any roles legal globally but illegal per location, or vice versa?
- What should happen to existing per-location assignments when switching to global, and vice versa: clear immediately, archive as draft, or require explicit confirmation?
- Can a user have different roles at different locations, or must every selected location share the same role set?
- What is the behavior when a previously assigned location is archived or the current administrator cannot access it?
- Should role changes require a review/confirmation step because they can expand access globally?

## Sources consulted

1. W3C Web Accessibility Initiative, **ARIA Authoring Practices Guide: Radio Group Pattern**. Defines radio groups as mutually exclusive and documents labeling, grouping, and keyboard interaction. Accessed 2026-09-24.  
   https://www.w3.org/WAI/ARIA/apg/patterns/radio/
2. GOV.UK Design System, **Radios**. Guidance on one-choice groups, fieldsets/legends, hints, conditional questions, and validation. Accessed 2026-09-24.  
   https://design-system.service.gov.uk/components/radios/
3. W3C Web Accessibility Initiative, **ARIA Authoring Practices Guide: Combobox Pattern**. Guidance for selecting from predefined values, including location examples, accessible naming, keyboard interaction, and preserving a prior value on Escape. Accessed 2026-09-24.  
   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
4. GOV.UK Design System, **Select**. Guidance that selects are a last resort and that multi-select `<select>` controls should generally be avoided. Accessed 2026-09-24.  
   https://design-system.service.gov.uk/components/select/
5. GOV.UK Design System, **Checkboxes**. Guidance for one-or-more selection, fieldsets/legends, “select all that apply,” exclusive options, and validation. Accessed 2026-09-24.  
   https://design-system.service.gov.uk/components/checkboxes/
6. W3C Web Accessibility Initiative, **Understanding WCAG 2.2: 3.3.1 Error Identification**. Requires identifying and describing detected input errors in text. Accessed 2026-09-24.  
   https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
7. W3C Web Accessibility Initiative, **Understanding WCAG 2.2: 3.3.3 Error Suggestion**. Requires correction suggestions where known, subject to security/purpose exceptions. Accessed 2026-09-24.  
   https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html
8. GOV.UK Design System, **Error message**. Guidance on actionable messages, error summaries, preserving values, field association, and separating service/authorization problems from input errors. Accessed 2026-09-24.  
   https://design-system.service.gov.uk/components/error-message/
9. Microsoft Learn, **Assign Microsoft Entra roles**. First-party example of tenant-wide versus resource/administrative-unit role-assignment scopes and scope-aware assignment flows. Last updated 2025-06-04; accessed 2026-09-24.  
   https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/manage-roles-portal

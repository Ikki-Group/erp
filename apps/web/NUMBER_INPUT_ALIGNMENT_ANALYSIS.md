# Number Input Group - Alignment Analysis & Recommendation

## Question
Should the numeric value be left-aligned or right-aligned in the input field with UOM dropdown?

---

## Analysis

### Current Implementation
- **Current state:** Left-aligned (default)
- **Component:** `NumberInputGroup` in `apps/web/src/components/ui/number-input-group.tsx`
- **Input component:** Uses Base UI `Input` with default left alignment

### Context: Your Application's Numeric Display Standards

#### 1. Table Cells (Data Display)
Your application consistently uses **RIGHT-aligned** numerics in tables:

**`NumericCell` (line 62-73 in `cell.tsx`):**
```tsx
<div className="text-right font-mono text-sm tabular-nums">
  {numValue.toLocaleString(locale)}
  {unit && <span className="text-muted-foreground"> {unit}</span>}
</div>
```

**`CurrencyCell` (line 90-92 in `cell.tsx`):**
```tsx
<div className="text-right font-mono text-sm">
  <CurrencyDisplay value={value} currency={currency} locale={locale} />
</div>
```

**Usage:**
- Stock quantities → Right-aligned
- Currency amounts → Right-aligned
- All numeric columns in tables → Right-aligned with `rightAlignedHeader()`

#### 2. Design System Principles
Your app follows Linear-style precision instrument aesthetic:
- **Monospaced numerics:** `font-mono tabular-nums` for alignment
- **Consistent visual language:** Tables, forms, cards should feel unified
- **Professional ERP aesthetic:** Financial/inventory data is number-heavy

---

## Recommendation: RIGHT-ALIGNED

### Reasons

#### 1. **Visual Consistency** ⭐⭐⭐⭐⭐ (CRITICAL)
**Tables:** Right-aligned  
**Forms:** Should also be right-aligned

Why: Users scan the same data in tables and edit it in forms. When numbers line up differently in edit mode vs. display mode, it creates cognitive dissonance.

**Example:**
```
Display (Table):          Edit (Form - Current):
─────────────────         ─────────────────────
  Stock: 1,250 kg    →    Stock: 1250 kg       ← misaligned
         250 kg      →           250 kg         ← misaligned
          50 kg      →            50 kg         ← misaligned

Display (Table):          Edit (Form - Recommended):
─────────────────         ───────────────────────
  Stock: 1,250 kg    →    Stock:      1,250 kg  ← aligned!
         250 kg      →                 250 kg   ← aligned!
          50 kg      →                  50 kg   ← aligned!
```

#### 2. **Number Scanning UX** ⭐⭐⭐⭐⭐
Right-aligned numbers make it easy to:
- Compare magnitudes (thousands vs. hundreds vs. tens)
- Scan decimal points vertically
- Spot outliers quickly
- Read totals at a glance

This is why spreadsheets (Excel, Google Sheets) and financial apps use right alignment by default.

#### 3. **Professional ERP Standards** ⭐⭐⭐⭐
- **SAP:** All quantity fields are right-aligned
- **Oracle NetSuite:** Right-aligned numerics
- **Microsoft Dynamics:** Right-aligned amounts and quantities
- **QuickBooks:** Right-aligned financial inputs
- **Xero:** Right-aligned accounting entries

Enterprise users expect this pattern. Breaking it feels "unprofessional."

#### 4. **Monospace Font Logic** ⭐⭐⭐⭐
Your app already uses `font-mono tabular-nums` for numerics. Monospace fonts are designed for right alignment:
- Each digit has equal width
- Digits line up in columns
- Right alignment makes the most of monospace benefits

Left-aligning monospace numbers defeats the purpose.

#### 5. **International Number Formats** ⭐⭐⭐
Different locales have varying digit group separators:
- Indonesia: `1.250,50` (period for thousands, comma for decimals)
- US: `1,250.50` (comma for thousands, period for decimals)
- India: `12,50,500` (lakhs system)

Right alignment keeps the decimal point FIXED regardless of locale format. This improves scanning for international users.

---

## Counter-Arguments (Left Alignment)

### Why Some Choose Left-Aligned

1. **Typing direction:** Left-to-right writing feels natural
2. **Short numbers:** For single-digit quantities (1-9), right alignment looks "odd"
3. **Mobile keyboards:** Number pad appears at bottom, cursor at left

**Rebuttal:**
- **Typing:** Users don't type for long — mostly edit existing values
- **Short numbers:** Invalid argument — same logic applies to `$5.00` in forms, which is still right-aligned
- **Mobile:** Modern mobile financial apps (banking, payments) use right-aligned inputs

---

## Implementation

### Changes Required

**File:** `apps/web/src/components/ui/number-input-group.tsx`

**Line 48-51 (NumberInputGroupAddon):**
```tsx
// BEFORE (current)
className={cn(
  'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent',
  'pr-1.5',
)}
```

```tsx
// AFTER (recommended)
className={cn(
  'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent',
  'text-right font-mono tabular-nums',  // ← ADD THIS
  'px-2',  // ← Change padding for balance
)}
```

**Line 134-137 (NumberInputGroup):**
```tsx
// BEFORE (current)
className={cn(
  'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent',
  'pr-1',
)}
```

```tsx
// AFTER (recommended)
className={cn(
  'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent',
  'text-right font-mono tabular-nums',  // ← ADD THIS
  'px-2',  // ← Change padding for balance
)}
```

### CSS Classes Added
- `text-right` — Right-aligns the input value
- `font-mono` — Uses monospace font (matches table cells)
- `tabular-nums` — Ensures digits have equal width (prevents jitter)

---

## Visual Comparison

### Mockup: Left-Aligned (Current)
```
┌─────────────────────────────────┐
│ Quantity                        │
├─────────────────────────────────┤
│ 1250.5                   [kg ▼] │  ← looks left-heavy
│ 250                     [kg ▼] │  ← inconsistent spacing
│ 50                      [kg ▼] │  ← hard to compare
└─────────────────────────────────┘
```

### Mockup: Right-Aligned (Recommended)
```
┌─────────────────────────────────┐
│ Quantity                        │
├─────────────────────────────────┤
│      1,250.5             [kg ▼] │  ← balanced
│        250               [kg ▼] │  ← easy to scan
│         50               [kg ▼] │  ← aligned decimals
└─────────────────────────────────┘
```

---

## Final Verdict

**RECOMMENDATION: Use RIGHT-ALIGNED for numeric values**

| Criterion | Score | Notes |
|-----------|-------|-------|
| Visual consistency | ✅ 5/5 | Matches table display |
| UX scanning | ✅ 5/5 | Professional standard |
| ERP conventions | ✅ 5/5 | Industry expectation |
| Monospace logic | ✅ 4/5 | Maximizes font benefit |
| International support | ✅ 3/5 | Better locale handling |
| Implementation complexity | ✅ 5/5 | Just 2 CSS classes |

**Total:** 27/30 — Strong recommendation to use right-aligned

---

## Risk Assessment

### If We Keep Left-Aligned
- ❌ Inconsistent visual language (tables vs. forms)
- ❌ Users subconsciously feel "something is off"
- ❌ Harder to compare numbers across form fields
- ❌ Non-standard for ERP/financial apps
- ❌ Defeats purpose of `font-mono tabular-nums`

### If We Switch to Right-Aligned
- ✅ Consistent with table display
- ✅ Follows industry standards
- ✅ Better number scanning UX
- ✅ Leverages monospace fonts properly
- ⚠️ Minor: Some users may initially be surprised (but will adapt quickly)

**Risk Level:** VERY LOW — This is an improvement, not a breaking change.

---

## Additional Context

### When to Use Left-Aligned Numbers
- Phone numbers (not quantities)
- IP addresses
- Postal codes
- Product codes/SKUs
- Reference numbers

These are **identifiers**, not **quantities**. Identifiers are read left-to-right; quantities are compared by magnitude.

### Your App Uses
- **Left-aligned:** `code`, `name`, `category` (identifiers/text)
- **Right-aligned:** `price`, `stock`, `total` (quantities/amounts)

**Number input groups are for QUANTITIES → RIGHT-ALIGNED**

---

## Next Steps

1. ✅ Review this analysis
2. ✅ Approve implementation
3. ✅ Apply CSS changes (`text-right font-mono tabular-nums`)
4. ✅ Test in design-system route
5. ✅ Verify in actual forms (material, inventory)
6. ✅ Update documentation

Estimated time: 5 minutes implementation + 5 minutes testing

---

## References

- [Nielsen Norman Group - Table Design](https://www.nngroup.com/articles/table-design/)
- [Why Numbers Are Right-Aligned in Tables](https://tex.stackexchange.com/questions/8940/why-are-numbers-usually-right-aligned)
- [Material Design - Data Tables](https://m2.material.io/components/data-tables)
- [SAP Fiori Design - Number Formatting](https://experience.sap.com/fiori-design-web/number-formatting/)

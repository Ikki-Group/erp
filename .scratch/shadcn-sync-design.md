# Sync komponen shadcn — design (opsi B: diff & merge)

## Tujuan
Selaraskan `apps/web/src/components/ui/*` dengan registry `base-mira` terbaru,
tanpa mengubah styling/Warm Precision kita (custom copy ID, a11y, token).

## Metode (3-way merge, bukan timpa)
- base   = isi file di commit `0f189d33` (init app, snapshot upstream base-mira); jika file lahir setelahnya → commit pertama file itu.
- theirs = keluaran **CLI** `shadcn add <c> -p /tmp/regen-ui` (CLI mentransformasi artefak docs: `IconPlaceholder`→ikon lucide, buang `'use client'`, `cn`→paket). Fetch JSON mentah SALAH (mengandung `@/app/(create)/...`).
- ours   = HEAD.
- `git merge-file ours base theirs` → auto-adopsi perubahan upstream murni, pertahankan milik kita, tandai konflik.
- hasil ditulis ke path asli lalu `oxfmt` → noise format/urutan import hilang.

## Hasil analisis (52 komponen registry + 2 milik kita)
- 39 NO-OP  → upstream tak berubah sejak fork; custom kita utuh.
- 13 CHANGED:
  - 9 file = churn `'use client'` murni (upstream inkonsisten: +2, −7). Di Vite inert.
  - 4 file substantif (semua menyangkut pola `FieldLabel`): `field`, `checkbox`, `radio-group`, `switch`.
- 2 milik kita: `dialog-form`, `number-input-group` (tak ada upstream) → lewati.
- `hooks/use-mobile.ts` identik → lewati.

## Keputusan per file
1. `field.tsx` (FieldLabel) — tambah kelas hover/focus nested-field upstream:
   `has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-input/40`,
   `has-[>[data-slot=field]]:has-[:focus-visible]:border-ring`,
   `has-[>[data-slot=field]]:has-[:focus-visible]:ring-2`, `...:ring-ring/30`.
2. `checkbox.tsx`, `radio-group.tsx`, `switch.tsx` — desain kita 2-lapis (border di `<span>` dalam),
   upstream 1-lapis. Adopsi hanya niat yang memetakan: tambah
   `group-has-[:focus-visible]/field-label:ring-0` di root. Lewati
   `not-data-checked:border-input` / `data-checked:border-primary` (tak berlaku di struktur kita).
3. `'use client'` — **lewati** (inert di Vite, upstream sendiri tidak konsisten).

## Catatan penting
`FieldLabel` **tidak dipakai** di app → keempat perubahan di atas `inert` (tak berefek runtime).
Nilainya: menyamakan sumber komponen dengan upstream. Perubahan repo-wide sesungguhnya dari
periode ini adalah migrasi paket `cn` (opsi A) — B tidak menyentuhnya.

## Verifikasi
- `apps/web`: `bun run lint && bun run typecheck && bun run test` (verify).
- root: `bun run check`.
- Visual: render Checkbox/RadioGroup/Switch di `/design-system` light+dark → tampilan tak berubah.

## Out of scope
- Migrasi paket `cn` (itu opsi A).
- Komponen baru upstream (Trace, Code Block, AI Elements, Questionnaire).
- Semua perubahan `'use client'`.

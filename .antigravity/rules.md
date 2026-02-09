# Antigravity Agent Rules: Ikki ERP Monorepo

Tujuan dari dokumen ini adalah untuk memandu Antigravity Agent dalam pengembangan proyek Ikki ERP. Ikuti pedoman ini secara ketat untuk memastikan kualitas kode, konsistensi, dan skalabilitas.

## 1. Ikhtisar Proyek

Ini adalah Monorepo yang dikelola dengan `bun`.

### Struktur Folder

- **apps/web**: Frontend application (Vite, React, TypeScript).
- **apps/server**: Backend application (Bun, Elysia, Drizzle ORM).
- **packages/api**: Shared API definitions (Eden Treaty).

---

## 2. Standar UI/UX (Aesthetics & Language)

### Rich Aesthetics

- **WOW Factors**: Gunakan desain yang premium, vibrant colors (bukan plain red/blue), dark mode support (glassmorphism), dan dynamic animations.
- **Typography**: Gunakan modern fonts (Inter, Roboto, atau Outfit).
- **Interactive**: Pastikan interface terasa "hidup" dengan hover effects dan micro-animations.

### Bahasa & Lokalisasi

- **Bahasa Utama**: Gunakan **Bahasa Indonesia** untuk semua teks yang menghadap pengguna (labels, descriptions, messages).
- **Mata Uang**: Gunakan **IDR (Rp.)** sebagai format mata uang default.
- **Istilah Teknis**: Lewatkan atau biarkan dalam bahasa Inggris jika istilah tersebut umum digunakan atau merupakan standar industri (contoh: "SKU", "Barcode", "Purchase Order", "Active", "Inactive" - namun untuk status usahakan tetap Bahasa Indonesia jika memungkinkan seperti "Aktif", "Tidak Aktif").

---

## 3. Tech Stack & Preferences

### Frontend (`apps/web`)

- **Framework**: React 19 + Vite.
- **Styling**: Tailwind CSS v4 + `shadcn/ui` primitives.
- **State Management**:
  - Server State: Tanstack Query v5.
  - Client State: Zustand.
  - URL State: Tanstack Router (search params).
- **Routing**: Tanstack Router (File-based routing).
- **Forms**: Tanstack Form + Zod.
- **API Client**: Eden Treaty (`@ikki/api-sdk`).

### Backend (`apps/server`)

- **Framework**: ElysiaJS.
- **Database**: Postgres + Drizzle ORM.
- **Pattern**: Service-Controller pattern.

---

## 4. Coding Standards & DX

### Layout Primitives

- **Utamakan Primitives**: Gunakan komponen layout primitives (`Grid`, `Stack`, `Inline`) untuk konsistensi spacing daripada menulis utility classes manual.
- **Page Structure**: Selalu gunakan `Page`, `PageHeader`, `PageContent` untuk layout halaman yang konsisten.

### Developer Experience (DX)

- **Strict Types**: Hindari `any`. Gunakan `unknown` atau define interface yang jelas.
- **Semantic HTML**: Gunakan elemen HTML5 yang tepat untuk accessibility.
- **Barrel Exports**: Gunakan `index.ts` untuk mempermudah import di level folder.

### Documentation

- **Proaktif**: Jika menemukan bug atau tipe yang kurang tepat, segera perbaiki atau sarankan perbaikan.
- **Komentar**: Gunakan JSDoc untuk mendokumentasikan fungsi kompleks, namun utamakan "Self-documenting code".

---

## 5. Workflows

1. **Planning**: Selalu buat `implementation_plan.md` sebelum melakukan perubahan besar.
2. **Implementation**: Ikuti prinsip Feature-Sliced Design inspiration. Kelompokkan file berdasarkan fitur (hooks, components, types dalam folder fitur yang sama).
3. **Verification**:
   - Jalankan `bun run dev` untuk verifikasi visual.
   - Jalankan `bun tsc --noEmit` untuk verifikasi tipe data.
   - Pastikan responsivitas mobile (mobile-first design).

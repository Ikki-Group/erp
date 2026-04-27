# System, Auth & Administration

**Domain**: 6. System & Administration  
**Status**: MVP

## 1. Overview
Fondasi dari keamanan dan struktur aplikasi ERP. Modul ini mengatur siapa saja yang boleh masuk ke sistem, apa saja yang boleh mereka lihat, dan pengaturan dasar perusahaan (Pajak, Nama Outlet).

## 2. Core Objectives
- **Keamanan Data (Data Security)**: Memastikan kasir tidak bisa mengintip laporan laba/rugi perusahaan atau menghapus data inventaris.
- **Jejak Audit (Audit Trail)**: Jika ada stok yang hilang atau data yang berubah, sistem tahu "Siapa yang mengubah dan Kapan".
- **Multi-Tenant / Multi-Outlet**: Satu sistem harus bisa menampung banyak cabang secara terisolasi.

## 3. Use Cases & Workflows

### UC-1: Login Sesuai Hak Akses (Role)
**Who**: Semua Pegawai  
**Goal**: Masuk ke aplikasi.
**Langkah**:
1. Pegawai memasukkan Email/PIN.
2. Sistem mengenali "Budi adalah Kasir Cabang A".
3. Tampilan layar Budi hanya memunculkan menu POS jualan (Menu Keuangan dan Gudang disembunyikan otomatis).

### UC-2: Pengaturan Master Perusahaan
**Who**: Super Admin / Owner  
**Goal**: Mengatur parameter dasar bisnis.
**Langkah**:
1. Owner masuk ke menu Settings.
2. Owner mengaktifkan "Pajak PPN 11%" dan menambahkan logo perusahaan untuk struk kasir.
3. Semua sistem (Invoice, Kasir) otomatis menerapkan aturan pajak baru.

## 4. Recommended Enhancements (Phase 2+)
- **Two-Factor Authentication (2FA)**: Login lebih aman untuk Owner/Manager menggunakan kode OTP WhatsApp atau Google Authenticator.

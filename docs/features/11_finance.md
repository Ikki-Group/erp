# Dashboard & Financial Reporting

**Domain**: 4. Finance & Expense  
**Status**: MVP

## 1. Overview
Pusat kendali dan mata bagi pemilik bisnis. Menggabungkan data dari modul Sales, Inventory, Production, dan Expense menjadi satu laporan keuangan utuh (Laba/Rugi) yang mudah dipahami orang non-akuntan.

## 2. Core Objectives
- **Keputusan Cepat berbasis Data**: Owner tidak perlu nunggu akhir bulan untuk tahu bisnisnya untung atau rugi hari ini.
- **Visibilitas Cash Flow**: Tahu persis uang ngendap di mana (apakah jadi stok barang, atau masih jadi piutang di mitra?).
- **Identifikasi Tren**: Tahu jam berapa toko paling ramai dan produk apa yang paling menyumbang untung.

## 3. Use Cases & Workflows

### UC-1: Pantau Penjualan & Untung Hari Ini
**Who**: Owner  
**Goal**: Mengetahui status kesehatan bisnis harian.
**Langkah**:
1. Owner membuka aplikasi (Dashboard).
2. Sistem menampilkan angka besar: Total Omset Hari ini, Total Pengeluaran, dan Perkiraan Laba Kotor.
3. Owner klik "Detail" untuk melihat daftar item paling laku hari itu.

### UC-2: Tutup Buku Bulanan (P&L)
**Who**: Manager / Owner  
**Goal**: Melihat laporan laba rugi resmi.
**Langkah**:
1. Manager memilih laporan P&L (Profit & Loss) bulan lalu.
2. Sistem menyajikan ringkasan: Omset (dari Sales) dikurangi HPP (dari Resep/Stok) dikurangi Beban (dari Expense) = Laba Bersih.
3. Manager menekan "Export PDF" untuk rapat evaluasi.

## 4. Recommended Enhancements (Phase 2+)
- **Budgeting**: Set batas maksimal pengeluaran bulanan (misal: budget iklan max 2 juta), sistem akan memberi peringatan jika nyaris jebol.

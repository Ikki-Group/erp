# Expense Management

**Domain**: 4. Finance & Expense  
**Status**: MVP

## 1. Overview
Fitur untuk mencatat uang keluar yang bukan bagian dari harga pokok penjualan barang (Non-COGS). Ini mencakup kasbon karyawan, beli token listrik, bayar uang kebersihan, hingga bayar tagihan supplier.

## 2. Core Objectives
- **Mencegah Uang Kas Bocor**: Memastikan setiap uang fisik yang diambil dari laci kasir atau bank memiliki catatan dan bukti struk.
- **Akurasi Laba Bersih**: Pengeluaran operasional ini akan mengurangi laba kotor, sehingga Owner tahu laba bersih (Net Profit) yang sebenarnya.
- **Kerapian Kategori Beban**: Membedakan mana beban operasional, beban pemasaran, dan aset.

## 3. Use Cases & Workflows

### UC-1: Catat Belanja Harian (Kasir)
**Who**: Kasir / Supervisor  
**Goal**: Mencatat uang kas yang terpakai.
**Langkah**:
1. Kasir ambil Rp 50.000 dari laci untuk beli galon.
2. Kasir input di sistem: Kategori "Operasional", Nominal Rp 50.000, Deskripsi "Air Galon". (Opsional: foto struk).
3. Laporan kas akhir hari otomatis cocok karena sistem tahu ada uang keluar.

### UC-2: Bayar Tagihan Supplier (AP)
**Who**: Finance  
**Goal**: Melunasi hutang pembelian.
**Langkah**:
1. Finance membuka daftar Hutang (AP) dari modul Purchasing.
2. Finance klik "Bayar" pada tagihan PT Makmur.
3. Sistem mencatat kas bank berkurang dan hutang supplier lunas.

## 4. Recommended Enhancements (Phase 2+)
- **Expense Approval**: Pengeluaran di atas nominal tertentu wajib di-klik "Approve" oleh Owner di HP sebelum uang boleh cair.

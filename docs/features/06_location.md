# Location & Transfer Management

**Domain**: 2. Inventory & Supply Chain  
**Status**: MVP

## 1. Overview
Manajemen untuk bisnis yang memiliki banyak lokasi fisik (Misal: 1 Gudang Pusat, 3 Outlet Cabang). Mengatur perpindahan barang antar lokasi dengan pencatatan yang rapi.

## 2. Core Objectives
- **Visibilitas Multi-Cabang**: Owner bisa melihat sisa stok kopi di Cabang A dan Cabang B dari satu layar.
- **Kontrol Mutasi Barang**: Memastikan barang yang dikirim dari Pusat benar-benar sampai di Cabang tanpa ada yang hilang di jalan.

## 3. Use Cases & Workflows

### UC-1: Kirim Barang dari Pusat ke Cabang
**Who**: Admin Pusat & Staff Cabang  
**Goal**: Restock barang cabang.
**Langkah**:
1. Admin Pusat membuat "Surat Jalan Transfer": Kirim 10kg Kopi ke Cabang A. (Stok pusat berkurang, status "In Transit").
2. Kurir jalan.
3. Cabang A menerima barang, lalu klik "Terima Transfer" di sistem. (Stok Cabang A bertambah).

## 4. Recommended Enhancements (Phase 2+)
- **Approval Transfer**: Kepala cabang harus approve permintaan barang sebelum pusat kirim.

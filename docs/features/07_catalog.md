# Product & Material Catalog

**Domain**: 3. Menu & Kitchen Operations  
**Status**: MVP

## 1. Overview
Buku induk (Master Data) untuk semua barang di dalam bisnis. Terbagi menjadi dua kategori utama:
1. **Produk**: Barang jadi yang dijual ke pelanggan (Misal: Iced Kopi Susu, Nasi Goreng).
2. **Material**: Bahan baku yang dibeli dari supplier dan disimpan di gudang (Misal: Biji Kopi, Susu UHT, Gula).

## 2. Core Objectives
- **Standardisasi Penamaan**: Tidak ada barang ganda (Misal: "Susu UHT" dan "Susu Cair" padahal barangnya sama).
- **Standardisasi Harga Dasar**: Menyimpan data harga modal (HPP) dasar dari bahan baku untuk perhitungan laba/rugi.
- **Kerapian Data Penjualan**: Kategori produk yang rapi (Minuman, Makanan, Add-on) memudahkan analisis penjualan.

## 3. Use Cases & Workflows

### UC-1: Input Menu Baru untuk Dijual
**Who**: Manager / Admin  
**Goal**: Menambah jualan baru di POS.
**Langkah**:
1. Admin menekan "Tambah Produk Baru".
2. Input nama "Matcha Latte", Kategori "Minuman", Harga Jual "Rp 25.000".
3. Produk langsung muncul di menu Kasir (POS) dan siap dijual.

### UC-2: Input Bahan Baku Baru
**Who**: Admin Gudang  
**Goal**: Menambah item bahan mentah ke sistem.
**Langkah**:
1. Admin menekan "Tambah Bahan Baku".
2. Input nama "Sirup Matcha", Satuan "Botol (1000ml)", Harga Beli "Rp 150.000".
3. Bahan baku siap digunakan untuk resep atau di-order ke supplier.

## 4. Recommended Enhancements (Phase 2+)
- **Product Variants**: Dukungan untuk ukuran (Reguler/Large) dan level gula (Normal/Less Sugar).

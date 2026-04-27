# Recipe & Bill of Materials (BOM)

**Domain**: 3. Menu & Kitchen Operations  
**Status**: MVP

## 1. Overview
Jembatan ajaib penghubung Penjualan (Front-office) dengan Inventory (Back-office). Resep menentukan berapa banyak bahan baku (Material) yang dipakai untuk setiap 1 Produk terjual.

## 2. Core Objectives
- **Auto-Deduct Inventory**: Kasir jualan, stok gudang otomatis terpotong tanpa input manual.
- **Perhitungan HPP (COGS) Akurat**: Otomatis menghitung modal per porsi berdasarkan fluktuasi harga beli bahan baku.
- **Konsistensi Rasa/Porsi**: Menjadi panduan standar bagi tim dapur/barista dalam meracik menu.

## 3. Use Cases & Workflows

### UC-1: Membuat Resep untuk Menu
**Who**: Chef / Manager  
**Goal**: Mengaitkan menu jualan dengan bahan mentahnya.
**Langkah**:
1. Manager memilih produk "Matcha Latte".
2. Manager memasukkan bahan: Sirup Matcha (20ml), Susu UHT (150ml), Es Batu (1 scoop).
3. Sistem langsung menampilkan "Total Harga Modal: Rp 8.000 per gelas".

### UC-2: Stok Terpotong Otomatis Saat Penjualan
**Who**: System (Auto)  
**Goal**: Mengurangi stok bahan sesuai jualan.
**Langkah**:
1. Terjadi penjualan 10 gelas Matcha Latte dari Moka POS (di-sync ke sistem).
2. Sistem melihat Resep Matcha Latte.
3. Sistem otomatis memotong stok gudang: Sirup Matcha (-200ml) dan Susu UHT (-1500ml).

## 4. Recommended Enhancements (Phase 2+)
- **Sub-Recipes (Resep Turunan)**: Resep untuk bahan setengah jadi (Misal: Resep "Saus Karamel Homemade" yang nanti dipakai di resep minuman).

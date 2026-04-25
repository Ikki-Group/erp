# Batch Production

**Domain**: 3. Menu & Kitchen Operations  
**Status**: MVP

## 1. Overview
Fasilitas untuk mencatat proses masak masal (Produksi Dapur). Mengubah sekumpulan bahan baku (Material A + B) menjadi barang setengah jadi atau barang jadi (Material C) yang disimpan sebagai stok baru.

## 2. Core Objectives
- **Lacak Bahan Setengah Jadi**: Mengubah status bahan mentah menjadi bahan siap pakai di sistem inventaris.
- **Hitung Modal (Yield Cost)**: Mengetahui harga modal 1 liter kaldu ayam setelah menyusut dari proses perebusan berjam-jam.

## 3. Use Cases & Workflows

### UC-1: Masak Sirup Gula Aren
**Who**: Chef / Dapur  
**Goal**: Mengolah bahan mentah jadi siap pakai.
**Langkah**:
1. Chef memilih resep produksi "Sirup Gula Aren".
2. Chef klik "Mulai Masak" -> Sistem memotong bahan: 5kg Gula Aren, 2L Air.
3. Chef klik "Selesai", lalu input hasil jadinya: "Dapat 4 Liter Sirup".
4. Sistem menghitung ulang modal sirup tersebut per liternya dan menyimpannya sebagai stok baru.

## 4. Recommended Enhancements (Phase 2+)
- **Production Planning**: Penjadwalan masak otomatis harian berdasar sisa stok di kulkas dapur.

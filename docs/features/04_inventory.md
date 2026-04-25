# Inventory Management

**Domain**: 2. Inventory & Supply Chain  
**Status**: MVP

## 1. Overview
Jantung dari operasional fisik bisnis. Modul ini melacak seluruh pergerakan barang masuk, keluar, rusak, dan transfer antar cabang secara real-time. Bertujuan untuk mencegah kehilangan aset dan kehabisan stok.

## 2. Core Objectives
- **Cegah Kebocoran Aset**: Menyamakan jumlah stok tercatat di sistem dengan fisik nyata (Stock Opname).
- **Cegah Kehabisan Stok (Stockout)**: Memberikan peringatan dini sebelum bahan baku habis agar dapur tidak berhenti produksi.
- **Transparansi Pergerakan**: Melacak riwayat "siapa yang memindahkan apa dan kapan".

## 3. Use Cases & Workflows

### UC-1: Penyesuaian Stok Fisik (Stock Opname)
**Who**: Kepala Gudang / Manager  
**Goal**: Menyamakan data sistem dengan fisik.
**Langkah**:
1. Manager melihat sistem: "Susu UHT = 10 Karton".
2. Hitungan fisik ternyata: "9 Karton".
3. Manager menginput "9" ke sistem dengan alasan "1 Karton Bocor". Sistem menyesuaikan stok.

### UC-2: Peringatan Stok Menipis
**Who**: System / Admin Gudang  
**Goal**: Mengisi kembali stok sebelum habis.
**Langkah**:
1. Sistem mendeteksi stok Gula < batas minimum (10 kg).
2. Sistem memunculkan notifikasi merah di Dashboard Admin.
3. Admin langsung membuat dokumen Pembelian (PO) ke supplier.

## 4. Recommended Enhancements (Phase 2+)
- **Barcode Scanning**: Gunakan kamera HP untuk opname agar lebih cepat.
- **FEFO (First Expired First Out)**: Peringatan barang yang mendekati tanggal kedaluwarsa.

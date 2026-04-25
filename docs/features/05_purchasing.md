# Purchasing (PO & Penerimaan Barang)

**Domain**: 2. Inventory & Supply Chain  
**Status**: MVP

## 1. Overview
Modul untuk mengatur alur belanja barang dari Supplier. Mulai dari pembuatan Purchase Order (PO), penerimaan fisik di gudang (Good Receipt Note / GRN), hingga pencatatan Hutang Usaha (AP).

## 2. Core Objectives
- **Kontrol Pembelanjaan**: Memastikan semua pembelian barang harus lewat persetujuan (PO).
- **Akurasi Penerimaan**: Memastikan barang yang ditagih oleh supplier sama dengan barang fisik yang sampai di gudang.
- **Pelacakan Hutang (AP)**: Tidak ada hutang supplier yang lupa dibayar (menghindari denda atau blacklist supplier).

## 3. Use Cases & Workflows

### UC-1: Order Barang ke Supplier (PO)
**Who**: Admin Gudang  
**Goal**: Memesan barang resmi ke supplier.
**Langkah**:
1. Admin membuat draft PO untuk Supplier "PT Makmur": Beli 50kg Biji Kopi.
2. Manager menekan "Setujui PO".
3. Sistem mengirim email PDF PO ke Supplier.

### UC-2: Terima Barang di Gudang (GRN)
**Who**: Staff Gudang  
**Goal**: Mencatat kedatangan barang fisik.
**Langkah**:
1. Barang datang, Staff mencocokkan fisik dengan surat jalan.
2. Staff menekan "Terima Barang" di sistem.
3. Stok inventory otomatis bertambah, dan sistem otomatis membuat catatan "Hutang ke PT Makmur".

## 4. Recommended Enhancements (Phase 2+)
- **Auto-Reorder**: Sistem otomatis membuat draf PO saat stok menyentuh batas minimum.
- **Supplier Rating**: Menilai performa supplier (Sering telat? Kualitas buruk?).

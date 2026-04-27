# Customer & Loyalty (CRM)

**Domain**: 1. Sales & Front-Office  
**Status**: Phase 2

## 1. Overview
Modul untuk menyimpan database pelanggan setia. Berfungsi untuk melacak riwayat belanja pelanggan, memberikan poin reward, dan menerapkan diskon otomatis untuk meningkatkan retensi.

## 2. Core Objectives
- **Meningkatkan Retensi Pelanggan**: Membuat pelanggan merasa dihargai dan kembali lagi (Repeat Order).
- **Personalized Marketing**: Mengetahui kebiasaan belanja pelanggan (misal: si A suka beli Americano).
- **Data Kepemilikan**: Bisnis memiliki data pelanggan sendiri (nomor HP), tidak bergantung pada aplikasi ojol.

## 3. Use Cases & Workflows

### UC-1: Mendaftar Member Baru
**Who**: Kasir  
**Goal**: Mendaftarkan pelanggan ke program loyalty.
**Langkah**:
1. Kasir meminta nomor HP pelanggan saat pembayaran.
2. Sistem menyimpan profil pelanggan baru.
3. Pelanggan langsung mendapatkan poin pertamanya.

### UC-2: Tukar Poin Diskon
**Who**: Kasir  
**Goal**: Memberikan diskon reward.
**Langkah**:
1. Kasir memasukkan nomor HP pelanggan.
2. Sistem menampilkan "Poin: 500 (Bisa ditukar diskon Rp 5.000)".
3. Kasir menekan "Gunakan Poin" dan total bayar otomatis berkurang.

## 4. Recommended Enhancements (Phase 2+)
- **Broadcast Promo**: Kirim promo via WhatsApp blast ke pelanggan yang sudah 1 bulan tidak datang.
- **E-Member Card**: Integrasi dengan Apple Wallet / Google Wallet.

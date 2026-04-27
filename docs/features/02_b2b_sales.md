# B2B Sales (Penjualan Grosir)

**Domain**: 1. Sales & Front-Office  
**Status**: MVP

## 1. Overview
Fasilitas untuk mencatat penjualan dalam partai besar (B2B) ke agen, franchise, atau mitra. Berbeda dengan kasir eceran, penjualan B2B membutuhkan pembuatan faktur (Invoice), pelacakan tempo pembayaran (Term of Payment), dan pencatatan Piutang (AR).

## 2. Core Objectives
- **Pelacakan Piutang (AR) Akurat**: Memastikan tidak ada tagihan macet yang terlupakan.
- **Profesionalitas Penagihan**: Menghasilkan Invoice formal dan profesional untuk dikirim ke mitra.
- **Kontrol Aset**: Stok tidak akan keluar dari gudang sebelum ada validasi surat jalan (Delivery Order).

## 3. Use Cases & Workflows

### UC-1: Membuat Pesanan Grosir & Cetak Invoice
**Who**: Admin Sales  
**Goal**: Mencatat pesanan dari mitra.
**Langkah**:
1. Admin memilih nama Mitra dan memasukkan barang pesanan (misal: 50kg Kopi).
2. Sistem otomatis membuat Invoice dengan tenggat waktu pembayaran (misal: Net 30 hari).
3. Admin mencetak Invoice dan Surat Jalan untuk kurir.

### UC-2: Mencatat Pelunasan Tagihan
**Who**: Tim Finance  
**Goal**: Mencatat uang masuk dari mitra.
**Langkah**:
1. Finance membuka daftar Invoice "Belum Lunas".
2. Finance memilih Invoice dan menginput nominal pembayaran yang masuk ke bank.
3. Status Invoice berubah menjadi "Lunas".

## 4. Recommended Enhancements (Phase 2+)
- **Automated Reminder**: Sistem otomatis kirim WhatsApp ke mitra jika tagihan H-3 jatuh tempo.
- **Tiered Discount**: Diskon otomatis berdasarkan kelas mitra (Gold/Silver).

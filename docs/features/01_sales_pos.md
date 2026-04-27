# Sales & POS Integration

**Domain**: 1. Sales & Front-Office  
**Status**: MVP (Moka Sync) | Phase 2 (Native POS)

## 1. Overview
Modul ini adalah pusat pendapatan (revenue) bisnis. Untuk tahap awal (MVP), sistem akan menarik data secara otomatis dari pihak ketiga (contoh: Moka POS) agar data penjualan selalu *up-to-date* tanpa input manual. Ke depannya, Ikki ERP akan memiliki sistem kasir (POS) sendiri yang bisa berjalan secara offline (local first) dan sinkronisasi otomatis saat online.

## 2. Core Objectives
- **Akurasi Data Pendapatan**: Memastikan tidak ada transaksi yang terlewat atau dimanipulasi dengan menarik data langsung dari sistem kasir.
- **Efisiensi Waktu**: Menghapus pekerjaan manual rekap harian oleh kasir atau manajer.
- **Dasar Pemotongan Stok**: Data penjualan yang masuk akan otomatis memotong stok bahan baku (lewat fitur Recipe).
- **Keandalan Operasional (Phase 2)**: Memastikan kasir tetap bisa berjualan meskipun internet mati (offline-first).

## 3. Use Cases & Workflows

### UC-1: Sinkronisasi Transaksi Harian (MVP)
**Who**: System (Auto) / Manager  
**Goal**: Mendapatkan data penjualan terbaru dari Moka.
**Langkah**:
1. Sistem berjalan otomatis setiap jam (atau Manager menekan tombol "Sync Sekarang").
2. Sistem menarik total penjualan, detail barang terjual, dan metode pembayaran dari Moka.
3. Dashboard keuangan dan stok bahan baku otomatis terupdate.

### UC-2: Kasir Mencatat Pesanan (Phase 2 - Native POS)
**Who**: Kasir  
**Goal**: Melayani pelanggan dengan cepat.
**Langkah**:
1. Kasir memilih menu pesanan di layar POS.
2. Pelanggan membayar (Cash/QRIS).
3. Struk tercetak dan transaksi selesai (< 30 detik).

## 4. Recommended Enhancements (Phase 2+)
- **Self-Ordering QR**: Pelanggan pesan langsung dari meja.
- **Integrasi Grab/Gojek**: Pesanan online masuk otomatis ke sistem POS.

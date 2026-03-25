Integrasi ke moka pos,

User story:
Lokasi dengan jenis outlet akan ada konfigurasi untuk menambah moka, moka adalah third party yang melakukan penjualan, didalm moka terdapat data produk yang dijual outlet, kategori produk dan daftar penjualan.
Untuk mengambil data kita perlu melakukan scraping yang akan berjalan setiap malam hari (cron job). namun kita juga bisa trigger secara manual baik dengan date range ataupun specific time. autentikasi akan menggunakan login, jadi aplikasi erp akan menyimpan data login moka (email password).

Spesifikasi modul moka:

- Fetch spesifik data
- Collect raw data (backlog raw data akan di upload ke R2)
- Transform data
- Store data
- History scrap
- Monitoring
- Store moka credentials

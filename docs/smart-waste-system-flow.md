# Smart Waste System Flow

Dokumen ini sekarang mengikuti alur terbaru berbasis `pickup request + auto matching + batching`, bukan model marketplace listing lama.

## 1. Registrasi & Setup

### User

- daftar dengan nama, no HP, alamat utama, dan pin lokasi opsional
- sistem menyimpan alamat utama sebagai `saved_addresses`
- user bisa memiliki beberapa alamat tersimpan untuk pickup berikutnya

### Collector

- daftar dengan data dasar lalu isi:
  - area layanan
  - radius layanan dalam km
  - jenis sampah yang diterima
  - harga default per kg
  - kapasitas harian
- status awal collector adalah `PENDING`
- collector baru ikut auto matching setelah admin mengubah status verifikasi menjadi `VERIFIED`

## 2. User Buat Request

User klik `Request Pickup` lalu mengisi:

- jenis sampah
- estimasi berat
- foto opsional
- lokasi pickup
- slot waktu:
  - `PAGI` 08.00-11.00
  - `SIANG` 11.00-14.00
  - `SORE` 14.00-17.00

Saat submit:

- sistem mengambil `price_per_kg_snapshot` dari harga global kategori
- sistem menghitung `estimated_total_amount`
- sistem membuat `pickup_request` dengan status `MENUNGGU_MATCHING`

## 3. Auto Matching + Batching

Setelah request dibuat, sistem:

1. mencari collector terverifikasi
2. memfilter berdasarkan:
   - `acceptedWasteTypes`
   - jarak user-collector berdasarkan koordinat latitude/longitude
   - radius layanan collector
   - kapasitas harian yang masih cukup
   - fallback area layanan teks jika koordinat belum tersedia
3. mencoba memasukkan request ke `pickup_batch` yang:
   - slot waktunya sama
   - area-nya sama
   - collector-nya sama
4. jika belum ada batch yang cocok, sistem membuat batch baru dengan status `MENUNGGU_KONFIRMASI`

Batch adalah inti efisiensi karena collector menerima 1 rute berisi beberapa titik pickup, bukan request satu-satu.

## 4. Collector Terima Batch

Collector melihat `Daftar pickup per rute`, misalnya:

- total estimasi 25 kg
- 7 lokasi
- area `Cimahi Selatan`
- slot `PAGI`

Collector bisa:

- `Terima batch`
- `Tolak`

Jika batch diterima:

- status batch menjadi `TERJADWAL`
- semua request di dalam batch berubah dari `MENUNGGU_MATCHING` ke `TERJADWAL`

Jika batch ditolak:

- request dikembalikan ke antrean matching
- sistem mencoba mencarikan collector lain

## 5. H-1 / H-2 Jam: Konfirmasi

Implementasi saat ini menyimpan `scheduledAt` pada request dan `scheduledFor` pada batch untuk dasar notifikasi berikutnya:

- user menerima info pickup pada slot yang dipilih
- collector menerima ringkasan jumlah titik pickup yang siap dijalankan

## 6. Hari H: Pickup & Verifikasi

Saat collector memulai rute:

- status batch menjadi `DALAM_PERJALANAN`
- semua pickup terjadwal di batch ikut menjadi `DALAM_PERJALANAN`

Saat collector tiba di lokasi:

- input berat aktual
- pilih metode pembayaran `CASH` atau `EWALLET`
- isi catatan collector bila perlu

Sistem lalu:

- menghitung `final_total_amount = actual_weight_kg x price_per_kg_snapshot`
- menandai `weightFlagged = true` jika selisih estimasi vs aktual lebih dari 30%
- mengubah status pickup menjadi `SELESAI`
- menambah saldo user
- membuat `transaction`

## 7. Pembayaran

Model pembayaran saat ini:

- COD cash
- e-wallet langsung di lokasi

Status pembayaran pada request:

- `PENDING`
- `DIBAYAR`

## 8. Rating & Feedback

Struktur rating dua arah sudah tersedia lewat tabel `ratings`:

- `from_user_id`
- `to_user_id`
- `score`
- `comment`

Seed saat ini sudah mencontohkan user memberi rating ke collector setelah pickup selesai.

## 9. Rules Penting

- pickup kecil tetap bisa masuk sistem selama masih bisa dibatch
- harga selalu transparan karena user melihat snapshot harga saat request dibuat
- collector tidak bisa ikut matching sebelum diverifikasi admin
- selisih berat besar otomatis ditandai audit lewat `weightFlagged`

## 10. Status Utama

Status request pickup yang dipakai aplikasi:

- `MENUNGGU_MATCHING`
- `TERJADWAL`
- `DALAM_PERJALANAN`
- `SELESAI`
- `DIBATALKAN`

Status batch collector:

- `MENUNGGU_KONFIRMASI`
- `TERJADWAL`
- `DALAM_PERJALANAN`
- `SELESAI`
- `DITOLAK`

## 11. Mapping ke Implementasi Sekarang

Implementasi aktif sudah digeser menjadi:

- `Profile` untuk akun dan setting operasional collector
- `SavedAddress` untuk banyak alamat user
- `PickupRequest` untuk transaksi inti pickup
- `PickupBatch` untuk batching per collector, slot, dan area
- `Transaction` untuk bukti pembayaran
- `Rating` untuk trust system

Model `CollectorListing` dan `WasteOffer` lama sudah tidak dipakai lagi.

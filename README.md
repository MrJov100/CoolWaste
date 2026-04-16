# Smart Waste Management Platform (Competition Ready)

Aplikasi *Smart Waste Management* dengan algoritma asimetris untuk memetakan (_matchmaking_) masyarakat (User) penjual limbah daur ulang dengan pengepul (_Collector_) terdekat secara otonom berbasis **Haversine Distance**, serta menggabungkannya ke dalam **Rute/Batch Berkelompok** guna mencapai efisiensi logistik.

Dibangun khusus untuk presentasi lomba/Hackathon UI/UX & Backend, dipadatkan dengan fondasi _Clean Architecture_ dan _Server Actions_ yang kokoh.

## 🔥 Fitur Utama (Selling Points)

- **Auto-Matchmaking & Batching Engine:** Sistem secara instan mencarikan Collector terdekat yang masih memiliki "Sisa Kapasitas Bagasi" (Kg) tanpa perlu *scrolling* manual memakan waktu. Semua bekerja di _background API_.
- **Transaksi *Cash on Delivery* Aktual:** Praktik _Fair Trade_. Penimbangan presisi terjadi di titik jemput, nominal pembayaran akan otomatis dihitung berdasarkan "berat aktual" dikalikan *snapshot harga per kilogram* yang berlaku detik itu.
- **Mekanisme Pembatalan Pintar (Re-queue):** Ketika sebuah rute batal akibat kendala teknis (Misal: Collector motornya mogok), algoritma *Smart Waste* akan melempar *(re-queue)* seluruh orderan yang terbengkalai kepada Collector "aktif" lain di sekitarnya.
- **Sistem *Quality Control* (Rating):** Menjaga ekosistem dengan mengharuskan User menilai (Bintang 1-5) performa Collector pasca-_Pickup_ agar kualitas layanan tetap terjaga.

## 🛠️ Arsitektur & Teknologi

- **Kerangka Utama:** `Next.js App Router` (React Server Components + Server Actions)
- **Database:** `PostgreSQL` diakses via `Prisma ORM`
- **Autentikasi & Penyimpanan:** `Supabase` (_Auth User_ & _Storage Bucket_ untuk Bukti Foto)
- **Tampilan Interaktif:** `Tailwind CSS`, komponen `shadcn/ui`, `Lucide Icons`

## 📦 Model Database Inti (Prisma Schema)

1. `Profile`: Konfigurasi multi-aktor (User, Collector dengan limit kapasitas, dan Admin).
2. `PickupRequest`: Data hulu (jenis sampah, berat estimasi, titik GPS koordinat tersembunyi `latitude/longitude`).
3. `PickupBatch`: Tabel logistik "Pengelompokan Rute" untuk Collector pada slot waktu tertentu.
4. `Transaction`: Bukti penyerahan limbah dan nilai moneter.
5. `Rating`: Kualitas layanan berbasis Bintang.

---

## 🚀 Langkah Menjalankan Aplikasi (Setup Lokal)

Jika Anda siap menilai _codebase_ atau menguji program di mesin (*local machine*) Anda, ikuti langkah berikut:

### 1. Kloning & Install Dependency
Buka terminal direktori *project* ini, dan unduh seluruh modul dependensi Node.js:
```bash
npm install
```

### 2. Siapkan File Environment `.env`
Duplikat file `.env.example` dan ubah namanya menjadi `.env`.
Masukkan tautan Database PostgreSQL Anda ke properti `DATABASE_URL` (Bisa menggunakan Supabase DB/lokal). Pastikan _API Key_ Supabase telah dimasukkan.

### 3. Eksekusi Skema Database
Dorong struktur tabel Prisma terbaru aplikasi ini ke dalam PostgreSQL kosong Anda dengan perintah:
```bash
npx prisma generate
npx prisma db push
```

### 4. Jalankan Local Server
Nyalakan mesin aplikasi Next.js Anda:
```bash
npm run dev
```
Buka browser Anda dan akses: **[http://localhost:3000](http://localhost:3000)**

---

## 🎬 Trik Simulasi Roleplay (Untuk Presentasi Lomba)

Saat Anda mendemonstrasikan prototipe ini ke hadapan juri acara, ikuti _Golden Flow_ ini untuk memaksimalkan kesan canggih dari algoritma yang telah disusun:

1. **Siapkan 2 Jendela Berbeda:**
   Buka jendela *Incognito/Guest* untuk bertindak sebagai **Collector**, dan buka satu jendela `Chrome` biasa bertindak sebagai **User**.
2. **Profil Collector (Persiapan Emas):**
   Login masuk sebagai _Collector_. Tetapkan Radius Pencarian ke `15 KM`, tetapkan Kapasitas Harian ke `50 Kg`, lalu tentukan harga _Kertas_ Rp4,000/Kg. (Sistem akan membuat Collector Anda _Standby_).
3. **Pesan Otomatis sebagai User:**
   Kembali ke jendela User. Cukup pilih "Buat Request Pickup": Jual 8 Kg Kertas dan atur Slot Waktu Sore. 
4. **Pamerkan Auto-Matching (Backend Magic):**
   Minta Juri beralih melihat ke layar Collector. **Boom!** *Request* si User (dan user-user lain di area yang sama) otomatis berkelompok (*Batching*) dan masuk mendadak ke dalam _Dashboard_ Collector, siap diterkam. 
5. **Demonstrasikan Logika Haversine:**
   Jelaskan pada Juri bahwa yang baru saja mereka saksikan bukan cuma _insert database_, tapi di baliknya mesin menghitung rumusan garis bujur/lintang peta GPS memakai metode **Haversine** dan memilah Kapasitas Bagasi (*Load limit*). Ini memastikan logistik daur ulang benar-benar efisiensi karbon.
6. **Selesaikan Pickup dengan Integritas:**
   Di layar Collector, tekan *Terima Rute -> Mulai Rute -> Input Aktual Timbangan: "Misal berat aslinya cuma 7.5 Kg"*. Sistem akan otomatis menyesuaikan Nominal Nota.
7. **Pamerkan Kepercayaan Konsumen (Rating):**
   Beralih ke layar User. Tunjukkan bahwa tagihan COD tersusun rapi beserta tombol bintang untuk *Review* (*Quality Control Loop* tertutup rapi).

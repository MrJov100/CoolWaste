# CoolWaste — Smart Waste Pickup Platform

Platform manajemen sampah daur ulang yang menghubungkan **User** (penjual sampah) dengan **Collector** (pengepul) terdekat secara otomatis menggunakan algoritma **Haversine Distance** dan sistem batching rute cerdas.

**Live Demo:** [https://cool-waste.vercel.app](https://cool-waste.vercel.app)

---

## Fitur Utama

- **Auto-Matchmaking & Batching** — Sistem mencarikan Collector terdekat yang masih memiliki kapasitas, lalu mengelompokkan beberapa pickup ke dalam satu rute efisien secara otomatis.
- **Transaksi Cash on Delivery** — Harga dihitung berdasarkan berat aktual saat pickup, bukan estimasi.
- **Re-queue Otomatis** — Jika Collector membatalkan rute, semua pickup yang terdampak langsung masuk antrian ulang ke Collector lain.
- **Rating & Quality Control** — User memberi bintang 1–5 pasca-pickup untuk menjaga kualitas ekosistem.
- **Upload Foto Sampah** — Foto bukti sampah diupload ke Cloudinary.
- **Chat Real-time** — User dan Collector bisa berkomunikasi per thread pickup.
- **Admin Panel** — Manajemen user, transaksi, rating, laporan, dan statistik karbon.
- **AI Waste Classifier** — Klasifikasi jenis sampah berbasis gambar (opsional).

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15+ (App Router, React Server Components, Server Actions) |
| Database | PostgreSQL via Prisma ORM |
| Auth | bcryptjs + cookie session (`cw-session`) |
| File Upload | Cloudinary |
| Routing | OpenRouteService API (fallback: Haversine) |
| Styling | Tailwind CSS + shadcn/ui + Lucide Icons |
| Charts | Recharts |

---

## Menjalankan di Lokal

### Prasyarat

Pastikan sudah terinstall:
- [Node.js](https://nodejs.org) versi 18 atau lebih baru
- [PostgreSQL](https://www.postgresql.org/download/) (bisa lokal atau layanan cloud)
- Akun [Cloudinary](https://cloudinary.com) (gratis) untuk upload foto

### 1. Clone Repositori

```bash
git clone https://github.com/MrJov100/smart-waste.git
cd smart-waste
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Buat File `.env`

Salin file contoh environment:

```bash
cp .env.example .env
```

Buka `.env` dan isi sesuai konfigurasi Anda:

```env
# Koneksi PostgreSQL lokal
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_waste"
DIRECT_URL="postgresql://postgres:password@localhost:5432/smart_waste"

NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cloudinary (wajib untuk upload foto sampah)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# OpenRouteService (opsional — untuk jarak rute)
OPENROUTESERVICE_API_KEY="your-key"
```

**Cara mendapatkan Cloudinary credentials:**
1. Daftar gratis di [cloudinary.com](https://cloudinary.com)
2. Buka dashboard → Settings → API Keys
3. Salin `Cloud Name`, `API Key`, dan `API Secret`

### 4. Setup Database

Generate Prisma client dan buat semua tabel:

```bash
npx prisma generate
npx prisma db push
```

### 5. Seed Data Awal (Opsional)

Mengisi database dengan akun demo dan data contoh:

```bash
npm run prisma:seed
```

Data yang dibuat:

| Role | Email | Password |
|---|---|---|
| Admin | admin@coolwaste.id | Admin@CoolWaste2024 |
| Collector | andika@example.com | password123 |
| Collector | dini.collector@example.com | password123 |
| User | budi@example.com | password123 |
| User | siti@example.com | password123 |

### 6. Jalankan Server Development

```bash
npm run dev
```

Buka browser: **[http://localhost:3000](http://localhost:3000)**

---

## Simulasi Alur Lengkap (Golden Flow)

Untuk mencoba semua fitur dari awal hingga akhir:

### Persiapan
Buka **dua jendela browser berbeda** (misal: Chrome normal + Chrome Incognito).

### Langkah 1 — Login sebagai Collector
Di jendela Incognito, login dengan `andika@example.com` / `password123`.

Pastikan profil Collector sudah dikonfigurasi:
- Buka **Dashboard Collector → Kapasitas & Area**
- Set Radius: `15 km`, Kapasitas Harian: `50 kg`
- Set harga minimal satu jenis sampah (misal: Plastik = Rp 3.000/kg)

### Langkah 2 — Login sebagai User
Di jendela Chrome biasa, login dengan `budi@example.com` / `password123`.

Buat request pickup:
- Klik **Buat Request Pickup**
- Pilih jenis sampah, isi estimasi berat, pilih slot waktu
- Upload foto sampah (opsional)
- Submit

### Langkah 3 — Lihat Auto-Matching di Sisi Collector
Kembali ke jendela Collector. Refresh Dashboard — pickup User akan muncul otomatis sebagai batch baru menunggu konfirmasi.

### Langkah 4 — Collector Terima & Mulai Rute
- Klik **Terima Batch** → atur jadwal pickup
- Setelah jadwal ditentukan, klik **Mulai Rute**

### Langkah 5 — Selesaikan Pickup
Di halaman **Pickup Activity** (Collector):
- Input berat aktual timbangan
- Pilih metode pembayaran
- Klik **Selesai & Dibayar**

### Langkah 6 — User Memberi Rating
Kembali ke jendela User → buka riwayat pickup → klik **Nilai Pickup** dan beri bintang.

---

## Struktur Proyek

```
smart-waste/
├── app/                     # Next.js App Router (halaman & API routes)
│   ├── (auth)/              # Login & registrasi
│   ├── (dashboard)/         # Dashboard admin, collector, user
│   ├── api/                 # API routes (AI, export CSV, geocode, health)
│   ├── pickups/             # Detail & riwayat pickup
│   └── ...
├── components/              # React components
│   ├── dashboard/           # Komponen spesifik dashboard
│   ├── layout/              # Topbar, navigasi
│   ├── records/             # Kartu detail pickup & foto
│   └── ui/                  # Komponen UI dasar
├── lib/
│   ├── actions/             # Server Actions (dashboard, admin, chat, dll)
│   ├── data/                # Query database via Prisma
│   ├── storage/             # Upload ke Cloudinary
│   ├── auth.ts              # Autentikasi & session cookie
│   ├── db.ts                # Prisma client singleton
│   └── ...
└── prisma/
    ├── schema.prisma        # Skema database
    └── seed.ts              # Data awal untuk pengembangan
```

---

## Admin Panel

Login sebagai Admin untuk mengakses `/dashboard/admin`:

- **Users** — Lihat daftar user, blokir/aktifkan akun, verifikasi Collector
- **Transactions** — Rekap semua transaksi COD, ekspor CSV
- **Ratings** — Monitoring rating Collector
- **Reports** — Tindak laporan chat pengguna
- **Carbon Stats** — Estimasi jejak karbon yang berhasil dikurangi
- **Stats** — Statistik platform keseluruhan

---

## Build untuk Produksi

```bash
npm run build
npm run start
```

Untuk deployment ke Vercel, tambahkan semua env vars di Settings → Environment Variables.

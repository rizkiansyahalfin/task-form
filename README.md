# TaskForm 🚀

TaskForm adalah aplikasi berbasis Next.js (App Router) untuk membantu Mentor mengelola tugas santri/siswa dengan sistem formulir dinamis (seperti Google Forms) dan pengumpulan file tugas yang terintegrasi.

---

## 🛠️ Fitur Utama

- **Dashboard Mentor**: Ringkasan statistik (jumlah form, total submission, submission masuk hari ini, review pending) dan daftar form terbaru.
- **Form Builder**: Mendesain formulir dinamis dengan tipe input (Short Text, Paragraph, Number, Date, Dropdown, Radio, Checkbox, File/Image Upload, GitHub/Deployment Link).
- **Public Form Task Submission**: Halaman publik untuk santri mengumpulkan tugas dengan verifikasi deadline dan late submission.
- **Review Submissions**: Panel khusus mentor untuk memeriksa, mengunduh file tugas, dan memperbarui status tugas santri (SUBMITTED, REVIEWED, REVISION, COMPLETED, LATE).
- **Integrated Storage & Database**: Adaptor penyimpanan Cloudflare R2 dengan fallback penyimpanan lokal, serta ORM Prisma dengan PostgreSQL.
- **Better Auth Integration**: Pengamanan data mentor & santri menggunakan Better Auth (session cookie & credential auth).

---

## 🚀 Memulai (Lokal)

### 1. Prasyarat
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org) (v20+)
- [pnpm](https://pnpm.io/) (disarankan) atau `npm` / `yarn`

### 2. Kloning Project & Install Dependencies
```bash
git clone <repo-url>
cd google-form-version
pnpm install
```

### 3. Setup Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi database PostgreSQL, Better Auth, dan Cloudflare R2 di `.env`.

### 4. Sinkronisasi Database & Seed Data
```bash
# Generate Prisma Client
npx prisma generate

# Sinkronisasi skema database ke PostgreSQL (lokal/online)
npx prisma db push

# Jalankan seed data untuk akun mentor & santri awal
npx tsx prisma/seed.ts
```

### 5. Jalankan Development Server
```bash
pnpm dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 🔑 Akun Seed Default

Setelah menjalankan script seed, akun-akun berikut akan tersedia di database:

### 👨‍🏫 Mentor / Admin
- **Email:** `mentor@taskform.dev`
- **Password:** `mentor363`
- **Role:** `mentor`

### 🧑‍🎓 Santri (Students)
Semua akun santri menggunakan password default: **`santri123`** dengan role `student`.

| Nama | Email Akun |
|---|---|
| Hudzaifah | `hudzaifah@taskform.dev` |
| Hammas | `hammas@taskform.dev` |
| Raihan | `raihan@taskform.dev` |
| Fairuz | `fairuz@taskform.dev` |
| Ibrohim | `ibrohim@taskform.dev` |
| Yazid | `yazid@taskform.dev` |
| Satrio | `satrio@taskform.dev` |
| Revaldi | `revaldi@taskform.dev` |
| Faren | `faren@taskform.dev` |
| Faris | `faris@taskform.dev` |
| Dzaky | `dzaky@taskform.dev` |

---

## 🚢 Panduan Deploy ke Production (Vercel)

1. Hubungkan repository GitHub Anda ke **Vercel**.
2. Masukkan semua variabel lingkungan di bawah pada tab **Settings -> Environment Variables** di Vercel:
   ```env
   NEXT_PUBLIC_APP_URL=https://app-anda.vercel.app
   BETTER_AUTH_URL=https://app-anda.vercel.app
   DATABASE_URL=postgresql://... (hosted database Neon/Supabase)
   BETTER_AUTH_SECRET=rahasia-enkripsi-kuat-32-karakter
   ```
3. Konfigurasikan **Build Command** pada Vercel Dashboard:
   ```bash
   prisma generate && next build
   ```
4. Deploy!

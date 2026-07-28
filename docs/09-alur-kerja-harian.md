# Alur Kerja Harian

Dua hal yang paling sering kamu lakukan: berpindah antar klien, dan
menerbitkan perubahan. Keduanya di sini.

---

## 1. Berpindah antar klien

Satu codebase melayani semua klien. Yang membedakan mereka hanya satu
nilai: `NEXT_PUBLIC_SITE_ID`. Perkakas mana pun yang kamu jalankan —
`npm run dev`, panel admin, skrip unggah gambar — mengikuti nilai itu.

### Lihat klien mana yang sedang aktif

```bash
cd ~/Desktop/Seawise-Web-Platform
npm run client
```

```
Klien yang tersedia:

  ● leuca
  ○ villa-anandia

Sedang aktif: leuca
```

Bulatan penuh menandai yang sedang dikerjakan.

### Pindah ke klien lain

```bash
npm run client villa-anandia
```

Lalu **jalankan ulang `npm run dev`**. Ini wajib, bukan saran: Next.js
membaca environment variable sekali saat start. Tanpa restart kamu akan
melihat situs klien lama sambil merasa sudah berpindah.

### Kenapa lewat nama, bukan UUID

Sebelumnya berpindah klien berarti menempel UUID ke `.env.local`. Masalahnya
bukan repot — masalahnya UUID yang salah **tidak menghasilkan pesan
kesalahan apa pun**. Kamu hanya akan mengedit situs klien yang keliru.
Nama sulit disalahketik, dan kalau salah, skripnya langsung menolak.

### Isi folder `clients/`

| Berkas | Isi | Masuk repo? |
|---|---|---|
| `shared.env` | Alamat Supabase + kunci publik. Sama untuk semua klien. | Ya |
| `leuca.env` | `SITE_ID` dan alamat produksi Leuca. | Ya |
| `secret.env` | `SUPABASE_SECRET_KEY`. Melewati semua RLS. | **Tidak pernah** |

Menambah klien baru = menambah satu berkas `clients/<nama>.env`.

---

## 2. Menerbitkan ke Vercel

### Sekali seumur hidup: kirim kode ke GitHub

Vercel tidak menyimpan kode; ia menariknya dari GitHub. Jadi GitHub dulu.

**Buat repo privat** di [github.com/new](https://github.com/new) — beri nama
`seawise-web-platform`, pilih **Private**, jangan centang apa pun di bagian
"Initialize this repository".

> Privat itu wajib, bukan preferensi. Repo publik berarti struktur database
> dan alur autentikasi seluruh armada klienmu bisa dibaca siapa saja.

Lalu di Terminal:

```bash
cd ~/Desktop/Seawise-Web-Platform
git init
git add .
git commit -m "Platform Seawise: template multi-klien"
git branch -M main
git remote add origin https://github.com/<username>/seawise-web-platform.git
git push -u origin main
```

Sebelum `git add .`, pastikan kunci rahasia aman:

```bash
git status --short | grep -E "secret.env|\.env\.local" || echo "aman — tidak ada kunci yang akan ter-commit"
```

Harus tercetak "aman". Kalau tidak, **berhenti** dan beri tahu saya.

### Per klien: satu project Vercel

Ulangi bagian ini untuk setiap klien. Repo-nya sama, yang berbeda hanya
environment variable.

**1. Import** — di [vercel.com/new](https://vercel.com/new), pilih repo
`seawise-web-platform`.

**2. Konfigurasi**

| Isian | Nilai |
|---|---|
| Project Name | `leuca` |
| Framework Preset | Next.js |
| **Root Directory** | `template-master` |

Root Directory paling sering terlewat. Aplikasinya ada di dalam
`template-master/`, bukan di akar repo. Salah di sini, build gagal dengan
pesan yang membingungkan.

**3. Environment Variables** — isi tiga, sebelum menekan Deploy:

| Nama | Nilai |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | lihat `clients/shared.env` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | lihat `clients/shared.env` |
| `NEXT_PUBLIC_SITE_ID` | lihat `clients/leuca.env` |

**`SUPABASE_SECRET_KEY` tidak ikut.** Situs publik tidak pernah
membutuhkannya, dan memasangnya di sana berarti satu salinan lagi dari kunci
yang bisa membaca data semua klien.

**4. Deploy.** Sekitar dua menit.

**5. Setelah alamatnya jadi** — misalnya `leuca.vercel.app` — tambahkan
`NEXT_PUBLIC_SITE_URL` dengan nilai `https://leuca.vercel.app`, lalu
**Redeploy**.

Kenapa dua tahap: alamatnya baru diketahui setelah deploy pertama. Dan
kenapa harus redeploy — lihat catatan di bawah.

Perbarui juga `clients/leuca.env` agar sama.

### Yang paling sering bikin bingung

**Nilai `NEXT_PUBLIC_*` dibekukan saat build.** Ia tidak dibaca saat
pengunjung membuka situs, melainkan ditanam ke dalam berkas JavaScript saat
Vercel membangun aplikasi. Mengubahnya di dashboard **tidak berpengaruh apa
pun** sampai kamu menekan Redeploy. Ini penyebab nomor satu dari "sudah saya
ganti kok tidak berubah".

### Memperbarui semua klien sekaligus

Perbaikan pada template — misalnya menu header yang baru saja kita buat —
berlaku untuk semua klien:

```bash
git add .
git commit -m "Menu header dari bagian halaman"
git push
```

Vercel mendeteksi push itu dan membangun ulang **setiap project** yang
terhubung ke repo ini. Satu perbaikan, seluruh armada ikut terperbarui.

Di situlah nilai sesungguhnya dari model ini: klien kesepuluh tidak
menambah pekerjaan perawatan.

---

## 3. Urutan lengkap klien baru

```bash
# 1. Buat barisnya di database
npm run new-client -- --slug villa-anandia --name "Villa Anandia" \
    --vertical lodging --tier reef

# 2. Catat SITE_ID yang dicetak, buat clients/villa-anandia.env

# 3. Pindah ke klien itu
npm run client villa-anandia
npm run dev

# 4. Susun kontennya lewat /admin

# 5. Buat project Vercel baru, arahkan ke repo yang sama
#    dengan NEXT_PUBLIC_SITE_ID milik klien ini
```

Langkah 5 memakan waktu sekitar lima menit. Sisanya adalah pekerjaan
konten — dan itu memang seharusnya bagian yang paling lama.

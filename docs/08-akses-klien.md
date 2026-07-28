# Memberi Akses Panel ke Klien

SOP ini dipakai berulang untuk setiap klien paket Reef ke atas. Sekitar
10 menit per klien.

## 1. Model aksesnya dulu

Yang paling sering disalahpahami: **tidak ada portal terpusat.** Panel admin
bukan aplikasi terpisah — ia bagian dari situs klien itu sendiri.

```
leuca.com/admin            → hanya menampilkan Leuca
villaanandia.com/admin     → hanya menampilkan Villa Anandia
tokosinta.com/admin        → hanya menampilkan Toko Sinta
```

Setiap deployment terkunci pada satu `NEXT_PUBLIC_SITE_ID`. Kode di dalamnya
tidak punya cara untuk menanyakan situs lain — bukan karena disembunyikan,
tapi karena ia memang tidak tahu situs lain ada.

**Arti `superadmin`** bukan "melihat semua situs dalam satu layar", melainkan
"boleh masuk ke panel situs mana pun". Kalau kamu ingin mengelola Villa
Anandia, kamu buka `villaanandia.com/admin` dan login dengan akun yang sama.

Konsekuensinya: gambaran menyeluruh semua klien hanya ada di Supabase.
Jalankan Bagian 2 di [`akses-klien.sql`](../supabase/clients/akses-klien.sql)
untuk melihat peta situs beserta pemegang aksesnya.

## 2. Tiga tingkat akses

| Peran | `site_id` | Bisa apa |
|---|---|---|
| `superadmin` | wajib `null` | Masuk ke panel semua situs |
| `owner` | satu situs | Kelola konten situs itu saja |
| `editor` | satu situs | Sama seperti owner (dibedakan nanti bila perlu) |

Satu orang boleh punya beberapa baris `owner` — berguna untuk klien yang
memiliki dua bisnis. Panel akan mengenali keduanya, masing-masing di
deployment-nya sendiri.

## 3. Langkah memberi akses

### Langkah 1 — Buat akun klien

Supabase → **Authentication** → **Users** → **Add user** → **Create new user**.

- Email: alamat email klien yang sebenarnya
- Password: acak dan panjang — klien tidak akan memakainya
- **Auto Confirm User**: centang

> Jangan pakai email pribadimu untuk akun klien. Kalau nanti kerja sama
> berakhir, akunnya harus bisa dicabut tanpa menyentuh punyamu.

### Langkah 2 — Hubungkan ke situs

Buka [`supabase/clients/akses-klien.sql`](../supabase/clients/akses-klien.sql),
ganti tiga nilai di blok `target`:

```sql
'email-klien@contoh.com'                 -- email dari Langkah 1
'7c9e6f2a-1b3d-4c5e-8f01-2a3b4c5d6e7f'   -- site_id klien
'Nama Pemilik'                           -- untuk catatan internal
```

Jalankan di SQL Editor. Bagian 2 skrip akan langsung menampilkan peta akses
untuk memastikan barisnya masuk.

### Langkah 3 — Kirim tautan, bukan password

Supabase → **Authentication** → **Users** → klik akun klien → menu tiga titik →
**Send password recovery**.

Klien menerima email berisi tautan untuk membuat password sendiri.

**Jangan pernah mengirim password lewat WhatsApp atau email biasa.** Bukan
soal paranoia — kalau akun klien nanti bermasalah, kamu ingin bisa mengatakan
dengan jujur bahwa passwordnya tidak pernah kamu ketahui.

### Langkah 4 — Serahkan alamat panelnya

Kirim ke klien:

```
Alamat panel : https://domainklien.com/admin
Email        : (email mereka)
Password     : dibuat sendiri lewat tautan yang dikirim Supabase
```

Sebelum domain terpasang, pakai URL `.vercel.app` dulu.

### Langkah 5 — Uji dari sisi klien

Buka jendela penyamaran, login dengan akun klien, dan pastikan:

- [ ] Bisa masuk dan melihat daftar section
- [ ] Bisa mengubah teks, lalu perubahannya muncul di situs
- [ ] Tombol atur urutan **tidak muncul** kalau paketnya Reef
- [ ] Menu Pesan berisi kiriman formulir kontak

Lima menit ini mencegah keluhan "kok tidak bisa" di hari pertama.

## 4. Apa yang tidak bisa diubah klien

Batasan ini ditegakkan di database lewat GRANT per kolom, bukan hanya
disembunyikan di tampilan. Klien yang memanggil API Supabase langsung pun
tetap ditolak.

| Boleh diubah klien | Terkunci |
|---|---|
| Isi section (teks, harga, foto) | Warna dan font (`theme_config`) |
| Nama bisnis, alamat, jam buka | Paket dan fitur (`tier`, `features`) |
| Judul & deskripsi SEO | Domain dan status tayang |
| Tayang/sembunyikan section | Struktur dan jumlah section |

Ini bagian dari yang kamu jual: klien tidak bisa merusak tampilan situsnya
sendiri. Beda dengan page builder umum, di mana hasil akhirnya bergantung
pada selera pemakainya.

## 5. Mencabut akses

Saat kerja sama berakhir, hapus baris `profiles` klien (Bagian 3 di
`akses-klien.sql`). Akses terputus seketika.

Akun `auth.users`-nya boleh dibiarkan — tanpa baris profil, ia tidak bisa
melakukan apa pun. Menghapusnya juga aman, tapi tidak mendesak.

Jangan lupa langkah lain di luar database: cabut akses DNS di Cloudflare, dan
kalau klien pindah penyedia, jalankan proses ekspor data sesuai klausul exit
di kontrak.

## 6. Batasan yang sudah diketahui

**Belum ada dashboard terpusat.** Untuk melihat semua klien sekaligus, kamu
buka Supabase dan jalankan query. Wajar untuk 5 klien, mulai merepotkan di 15.
Saat itu tiba, solusinya satu deployment `admin.seawise.cc` yang tidak
terkunci ke satu `SITE_ID` — bukan mengubah arsitektur ini.

**Editor produk masih berupa JSON.** Blok teks, judul, dan harga tunggal aman
diserahkan ke klien. Daftar berulang seperti katalog produk atau menu belum
layak; untuk sekarang perubahan itu tetap lewat kamu.

**Reset password bergantung pada email Supabase.** Kuota email bawaan Supabase
terbatas dan keterkirimannya biasa saja. Begitu klien bertambah, pasang SMTP
sendiri (Resend) di Authentication → Settings.

# Add-On Teknis

Tiga add-on berbayar di luar paket utama: notifikasi WhatsApp otomatis,
notifikasi email, dan payment gateway.

## Arsitektur notifikasi

Satu Database Webhook memanggil satu Edge Function. Function itu yang memutuskan
kirim apa ke siapa.

```
INSERT ke leads / orders
        │
        ▼
Supabase Database Webhook
        │
        ▼
Edge Function `notify`  ──►  Resend (email)
        │
        └──────────────────►  Fonnte / Wablas (WhatsApp)
```

Kode: [`supabase/functions/notify/index.ts`](../supabase/functions/notify/index.ts)

Alasan memusatkan logika di satu function: penyedia WhatsApp di Indonesia
sering berganti harga dan kebijakan. Kalau logika kirim tersebar di form,
Server Action, dan trigger database, mengganti penyedia berarti menyentuh
banyak tempat sekaligus.

**Memasang**

```bash
supabase functions deploy notify
supabase secrets set \
  RESEND_API_KEY=re_... \
  FONNTE_TOKEN=... \
  WEBHOOK_SECRET=$(openssl rand -hex 32)
```

Lalu di dashboard: Database → Webhooks → Create, tabel `leads`, event `INSERT`,
tipe Edge Function → `notify`, tambahkan header `x-webhook-secret`.

## WhatsApp

**Level gratis (semua paket).** Tautan `wa.me` yang dibuat otomatis dari
`business_info.whatsapp`. Klien mengklik sendiri untuk membalas. Sudah aktif di
blok `contact` dan tombol header.

**Level otomatis (add-on, Rp 500rb–1 juta + biaya API bulanan).**
Pesan masuk langsung diteruskan ke WhatsApp pemilik lewat penyedia pihak ketiga.

Pilihan penyedia:

| Penyedia | Catatan |
|---|---|
| Fonnte | Termurah, memakai perangkat/nomor sendiri. Cocok untuk UMKM. |
| Wablas | Serupa, dokumentasi lebih rapi. |
| WhatsApp Business API resmi | Paling stabil, paling mahal, butuh verifikasi bisnis. |

Yang harus disampaikan jujur ke klien: penyedia non-resmi bekerja dengan
menautkan nomor WhatsApp biasa. Nomor bisa terkena pembatasan kalau dianggap
mengirim pesan massal. Untuk notifikasi masuk volume rendah, risikonya kecil —
tapi biaya API bulanan diteruskan ke klien, tidak ditanggung Seawise.

## Email

Resend adalah pilihan default. Alternatif: SMTP bawaan Supabase (cukup untuk
volume rendah, tapi keterkiriman lebih rentan).

Wajib: verifikasi domain pengirim (SPF + DKIM). Tanpa itu, notifikasi berakhir
di folder spam dan klien akan mengira formnya rusak.

## Payment gateway

**Harga add-on: Rp 1,5–2,5 juta sekali bayar.** Fee transaksi ditanggung klien
langsung ke penyedia gateway — jangan pernah mengalirkannya lewat rekening
Seawise.

Pilih Midtrans atau Xendit, bukan Stripe. Keduanya mendukung QRIS, virtual
account, e-wallet, dan kartu kredit — yang benar-benar dipakai pembeli di
Indonesia.

**Alur**

```
Checkout di situs
      ▼
Server Action buat transaksi via API gateway
      ▼
Snap/Invoice page (redirect atau embed)
      ▼
Pembeli membayar
      ▼
Gateway kirim webhook  ──►  Edge Function  ──►  update orders.status
                                                       │
                                                       ▼
                                              trigger notifikasi
```

**Aturan yang tidak boleh dilanggar:**

1. **Status transaksi hanya boleh dipercaya dari webhook**, bukan dari redirect
   di browser. Pembeli bisa menutup tab, dan URL redirect bisa dipalsukan.
2. **Verifikasi signature** setiap webhook sebelum memprosesnya.
3. **Webhook harus idempoten** — gateway mengirim ulang saat gagal. Satu
   `order_id` yang diproses dua kali tidak boleh menghasilkan dua pesanan.
4. **Harga dihitung ulang di server** dari data produk, tidak pernah diambil
   dari yang dikirim browser.

**Tabel yang perlu ditambahkan** (migration baru saat add-on pertama dijual):

```sql
create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites (id) on delete cascade,
  order_number   text not null,
  customer       jsonb not null default '{}'::jsonb,
  items          jsonb not null default '[]'::jsonb,
  total          numeric(12,2) not null,
  currency       text not null default 'IDR',
  status         text not null default 'pending',
  gateway        text,
  gateway_ref    text,
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  constraint orders_site_number_unique unique (site_id, order_number)
);

alter table public.orders enable row level security;
alter table public.orders force row level security;

create policy orders_owner_read on public.orders
  for select to authenticated using (public.has_site_access(site_id));
```

Perhatikan: anon **tidak** diberi hak apa pun ke `orders`. Pembuatan pesanan
lewat Server Action dengan service role, bukan langsung dari browser.

## Kapan menolak permintaan add-on

Setiap add-on menambah sesuatu yang harus dirawat selamanya. Sebelum menyanggupi,
tanyakan: kalau sepuluh klien meminta hal serupa, apakah ini masih bisa
dikerjakan tanpa menambah orang?

Kalau jawabannya tidak, pilihannya adalah menolak atau memberi harga yang
mencerminkan biaya perawatannya — bukan hanya biaya membangunnya. Ini
penjabaran langsung dari risiko "godaan over-customization" di dokumen
rangkuman.

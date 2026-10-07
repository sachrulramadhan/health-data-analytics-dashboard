# Health Data Analytics Dashboard

Dashboard analitik data kesehatan terpadu untuk Dinas Kesehatan dan Puskesmas, dengan pemantauan indikator SPM, analisis tren, komparasi wilayah, dan impor data Excel.

## Menjalankan secara lokal

**Prasyarat:** Node.js

1. Instal dependensi: `npm install`
2. Jalankan server pengembangan: `npm run dev`
3. Buka URL lokal yang ditampilkan Vite.

## Build

```sh
npm run build
```

Hasil build statis tersedia di direktori `dist`.

## Deploy ke Cloudflare Pages

Buat aplikasi Pages dari repository GitHub ini dan gunakan konfigurasi berikut:

- Framework preset: **Vite**
- Build command: `npm run build`
- Build output directory: `dist`

Setiap push ke branch yang terhubung akan memicu deployment baru.

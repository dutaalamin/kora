# Kora

Asisten bahasa Korea berbasis AI (Google Gemini) — untuk komunikasi kerja & sehari-hari.

## Fitur

- Chat tanya-jawab bahasa Korea (terjemah, arti, koreksi, tingkat kesopanan)
- Riwayat percakapan (tersimpan di browser)
- Tema gelap, responsif (mobile & desktop)
- Auto-fokus ke kotak chat saat halaman dibuka
- Fallback multi-model: tetap jalan walau satu model AI sibuk

## Teknologi

- Vite + React + TypeScript + Tailwind CSS
- Vercel Serverless Function (`/api/chat`) → Google Gemini API
- API key disimpan di environment variable (aman, tidak sampai ke browser)

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buat file `.env.local` berisi:

```
GEMINI_API_KEY=your_api_key
```

## Deploy

Push ke branch `main` → Vercel otomatis deploy.

## Alamat

https://dutakora.vercel.app

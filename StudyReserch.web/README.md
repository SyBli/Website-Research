# STUREKA RISA 2.0 (Study Research)

Website statis untuk mengelola dan memantau penelitian: ide, bab, referensi, checklist, timeline, catatan, dan lampiran.
Tanpa login, tanpa server, tanpa database online. Semua data tersimpan di browser Anda.

## Menjalankan

- **Lokal:** buka `index.html` di browser. (Untuk hasil terbaik, jalankan server sederhana: `python -m http.server`, lalu buka `http://localhost:8000`.)
- **GitHub Pages:** unggah seluruh isi folder ini ke repositori, lalu aktifkan *Settings → Pages → Deploy from a branch → main / (root)*. Tidak ada proses build.

## Mengganti banner

Cukup **timpa file gambar** di folder `images/` dengan nama yang sama. Tidak perlu mengedit HTML, CSS, atau JavaScript.

| File | Fungsi | Ukuran disarankan |
|---|---|---|
| `images/banner-desktop.jpg` | Banner untuk laptop dan tablet | 1600 × 400 px |
| `images/banner-mobile.jpg` | Banner untuk HP (opsional) | 900 × 675 px |

- Gambar ditampilkan **utuh**: tidak dipotong, tidak di-zoom, proporsi asli dipertahankan. Tinggi banner menyesuaikan gambar Anda.
- Jika `banner-mobile.jpg` dihapus, HP otomatis memakai `banner-desktop.jpg`.
- Jika kedua file tidak ada, area banner disembunyikan.
- Teks pada banner (judul, slogan) adalah bagian dari gambar. Edit di aplikasi desain Anda.
- Jika gambar lama masih tampil setelah diganti, muat ulang dengan **Ctrl + F5** (cache browser).

Nama file dan jalur dapat diubah di `config.js` (bagian `banner`).

## Struktur proyek

```
STUREKA-RISA/
├── index.html        Kerangka halaman
├── style.css         Semua gaya, termasuk tema terang/gelap
├── script.js         Seluruh logika aplikasi
├── config.js         Pengaturan sederhana (teks, jalur banner, batas lampiran)
├── images/
│   ├── banner-desktop.jpg
│   ├── banner-mobile.jpg
│   └── assets/logo.svg
├── libraries/
│   ├── quill/        Editor teks Quill 1.3.7 (disertakan lokal, tanpa CDN)
│   └── icons.js      Ikon Lucide (disertakan lokal)
└── README.md
```

Satu-satunya sumber daya eksternal adalah Google Fonts (Inter dan Lora). Jika tidak tersedia, situs memakai font sistem.

## Fitur

- **Dashboard:** Total Penelitian, Sedang Dikerjakan, Selesai, Deadline Terdekat, Progres Rata-Rata. Semua dihitung otomatis. Ada juga informasi cepat dan aktivitas terbaru.
- **Semua Penelitian:** cari, filter status, urutkan (tanggal atau progres), tambah, edit, hapus dengan konfirmasi.
- **Research Room** per penelitian, dengan 7 menu: Informasi, Ide Penelitian, Referensi, Checklist Bab, Timeline, Catatan, Lampiran.
- **Ide Penelitian:** Bab 1 sampai 5, masing-masing punya editor sendiri.
- **Editor teks:** tebal, miring, garis bawah, coret, rata teks (kiri/tengah/kanan/rata kiri-kanan), jenis dan ukuran font, warna teks dan highlight, spasi baris, jarak paragraf, indentasi, daftar poin dan nomor, undo/redo. Tersimpan otomatis dan lewat tombol Simpan (atau Ctrl + S) dengan indikator status.
- **Tema:** Light Mode dan Dark Mode, pilihan tersimpan.
- **Pintasan:** Ctrl + K untuk mencari.

### Cara progres dihitung

50% dari checklist bab yang selesai, 30% dari target timeline yang selesai, dan 20% dari jumlah referensi (target 3 referensi = penuh).

## Penyimpanan dan cadangan

- Data penelitian dan teks: `localStorage`. Lampiran: `IndexedDB` (batas 25 MB per file, bisa diubah di `config.js`).
- Data **hanya ada di browser dan perangkat yang dipakai**. Membersihkan data situs atau mode incognito akan menghapusnya.
- **Pengaturan → Export JSON** membuat cadangan (pilih dengan atau tanpa lampiran). **Import JSON** memulihkan data, dengan pilihan *Gabungkan* atau *Timpa semua*. Lakukan ekspor secara berkala.
- Kuota browser berbeda tiap perangkat. Lampiran besar bisa memenuhinya; tombol *Minta penyimpanan permanen* di Pengaturan membantu mengurangi risiko data dibersihkan otomatis.

## Dari versi lama

Saat pertama kali dibuka, data dari versi lama (`studyresearch.projects.v1`) dipindahkan otomatis: penelitian, referensi, timeline, checklist, catatan, dan lampiran. Isian "Ide Penelitian" lama (latar belakang, rumusan masalah, tujuan, hipotesis, manfaat) dimasukkan ke Bab 1; variabel, metode, dan objek ke Bab 3. Data lama tidak dihapus.

## Lisensi pihak ketiga

Quill (BSD-3-Clause, `libraries/quill/LICENSE`) dan ikon Lucide (ISC).

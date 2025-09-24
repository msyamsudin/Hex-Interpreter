# Hex Interpreter

Alat bagi yang penasaran dengan isi "jeroan" dari sebuah file. Kamu bisa melihat data mentah dalam format heksadesimal dan langsung mengartikannya ke berbagai format yang bisa dibaca manusia.

## Cara Pakai

### 1. Memulai

- Saat pertama kali membuka aplikasi, kamu akan disambut oleh area untuk mengupload file.
- **Seret file** dari komputermu dan lepaskan di area yang tersedia, atau **klik area tersebut** untuk membuka jendela pilihan file. Kamu bisa memilih satu atau beberapa file sekaligus.

### 2. Memahami Tampilan

Setelah file dimuat, layar akan terbagi menjadi dua bagian utama:

- **Sidebar Kiri (Panel Kontrol):** Di sinilah semua alat bantumu berada.
  - **Loaded Files:** Daftar semua file yang sudah kamu muat. Kamu bisa memilih file mana yang aktif, menambah file baru, atau menghapus file.
  - **Analysis:** Tombol utama untuk menjalankan analisis AI.
  - **File Information:** Info dasar tentang file yang sedang aktif (nama dan ukuran).
  - **AI Analysis:** Hasil analisis dari AI akan muncul di sini setelah kamu menekan tombol "Analyze".
  - **Data Inspector:** "Kamus" penerjemah datamu. Bagian ini akan selalu update sesuai byte yang kamu pilih.

- **Kanan (Tampilan Hex):** Ini adalah tampilan utama dari isi filemu.
  - **Kolom paling kiri:** Alamat atau *offset* (posisi byte) dalam heksadesimal.
  - **Kolom tengah:** Data heksadesimal dari file, 16 byte per baris.
  - **Kolom paling kanan:** Representasi teks (ASCII) dari data heksadesimal tersebut. Karakter yang tidak bisa dicetak akan ditampilkan sebagai titik (`.`).

### 3. Menginspeksi Data

1.  Di tampilan hex (bagian kanan), **klik pada salah satu nilai heksadesimal**.
2.  Lihat ke sidebar kiri di bagian **"Data Inspector"**.
3.  Panel itu akan langsung menampilkan berbagai kemungkinan arti dari byte yang kamu pilih (dan byte-byte setelahnya). Misalnya, `41` dalam hex bisa berarti huruf `A`, angka `65`, dan sebagainya. Kamu bisa lihat interpretasinya sebagai angka 8-bit, 16-bit, 32-bit, tanggal, dan banyak lagi.
4.  Butuh melihat data dalam urutan byte yang berbeda? Ganti **Endianness** dari `Little` ke `Big` atau sebaliknya.

### 4. Menjalankan Analisis AI

1.  Di sidebar kiri, klik tombol **"Analyze File"** (jika satu file) atau **"Analyze Relationships"** (jika lebih dari satu file).
2.  Tunggu sebentar saat ikon loading berputar.
3.  Hasilnya akan muncul di bagian **"AI Analysis"** dan **di samping nama file** dalam daftar. AI akan memberimu:
    - **Tipe File:** Tebakan jenis file (misal: "Gambar PNG").
    - **Ringkasan:** Penjelasan singkat tentang isi file.
    - **Temuan Penting:** Daftar hal-hal menarik yang ditemukan (misalnya, teks tersembunyi atau metadata).
4.  Jika kamu menganalisis beberapa file, hasilnya juga akan menampilkan apakah file-file itu saling berhubungan.

### 5. Konfigurasi Kunci API (Penting untuk Fitur AI)

Fitur analisis AI memerlukan key API dari Google (untuk model Gemini) atau OpenAI. Caranya adalah dengan membuat file `.env` di folder utama proyek.

1.  Buat file baru di direktori root proyekmu dan beri nama `.env`.
2.  Buka file `.env` dan tambahkan kunci API-mu seperti contoh di bawah ini:

    ```
    # Kunci untuk Google Gemini API
    API_KEY="GANTI_DENGAN_KUNCI_GEMINI_KAMU"

    # Kunci untuk OpenAI API (jika kamu ingin menggunakannya)
    OPENAI_API_KEY="GANTI_DENGAN_KUNCI_OPENAI_KAMU"
    ```

3.  Simpan file tersebut. Kamu mungkin perlu me-restart server agar perubahan ini terbaca.

**Penting:** Jaga kerahasiaan kunci API-mu dan jangan pernah membagikannya atau menyimpannya di dalam kode yang akan dipublikasikan.

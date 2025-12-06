

# 🎥 Malang City Network - Local Video Player (PWA Ready)

**Malang City Network (MCN) Player** adalah aplikasi Content Management System (CMS) untuk streaming video lokal berbasis web. Aplikasi ini dirancang untuk berjalan di jaringan lokal (Localhost/Wi-Fi), memungkinkan pengguna mengelola video (Upload, Edit, Reorder, Hapus) dan menampilkannya kepada klien di jaringan yang sama tanpa memerlukan internet.

Sangat cocok untuk: Pameran, Ruang Tunggu, Kiosk Digital, atau Server Multimedia Rumahan.

![MyStream Preview](https://via.placeholder.com/800x400?text=Dashboard+Preview)

## ✨ Fitur Unggulan

### 🖥️ Front-End Player
- **Auto Preview**: Video berjalan otomatis (thumbnail bergerak) saat hover mouse atau scroll di HP.
- **Cinema Experience**: Tampilan gelap (Dark Mode) yang fokus pada konten.
- **PWA Support**: Dapat diinstall sebagai aplikasi native (tanpa address bar) di Android/iOS/PC.
- **Anti Download**: Sistem proteksi sederhana untuk mencegah klik kanan dan menyembunyikan tombol download.
- **Dynamic Grid**: Jumlah kolom menyesuaikan pengaturan dari Dashboard.

### ⚙️ Admin Dashboard
- **Drag & Drop Reordering**: Ubah urutan video cukup dengan tahan dan geser (Manual Order).
- **Dual View**: Pilihan tampilan **List (Tabel)** atau **Grid (Thumbnail)**.
- **Bulk Actions**: Hapus atau ubah status (Tayang/Hidden) banyak video sekaligus.
- **Smart Filter & Search**: Cari judul video dan filter video dengan cepat.
- **Replace File**: Ganti file video yang salah tanpa menghapus data judul/statistik.


### BAGIAN 2: Instalasi Windows dan Linux

## 💻 Cara Instalasi

Pastikan Anda sudah menginstall **Node.js** di perangkat Anda.

### A. Instalasi di Windows 🪟

1. **Clone Repository**
   Buka terminal (CMD/PowerShell) di folder tujuan:
   ```bash
   git clone https://github.com/mkhar2708/aplikasi-web-mcn.git
   cd aplikasi-web-mcn
   ```

2. **Install Library**
   ```bash
   npm install
   ```

3. **Jalankan Aplikasi**
   ```bash
   node server.js
   ```

4. **Selesai!**
   Server akan berjalan di Port 80 (Default HTTP). Cek terminal untuk melihat IP Address.
   - Laptop: `http://localhost`
   - HP (Wi-Fi sama): `http://192.168.x.x`

### B. Instalasi di Linux Server (Ubuntu/Debian) 🐧

1. **Setup Environment**
   ```bash
   sudo apt update
   sudo apt install nodejs npm git -y
   ```

2. **Clone & Install**
   ```bash
   git clone https://github.com/mkhar2708/aplikasi-web-mcn.git
   cd aplikasi-web-mcn
   npm install
   ```

3. **Jalankan dengan PM2 (Agar running 24 Jam)**
   ```bash
   sudo npm install -g pm2
   sudo pm2 start server.js --name "mcn-player"
   sudo pm2 save
   ```


### BAGIAN 3: Instalasi Android (Termux)

### C. Instalasi di Android (Termux) 📱

Jadikan HP bekas Anda sebagai Server Multimedia!

1. **Install Termux** (Disarankan download dari F-Droid).
2. **Update & Install Tools**
   Buka Termux, ketik:
   ```bash
   pkg update && pkg upgrade -y
   pkg install nodejs git nano -y
   termux-setup-storage
   ```
   *(Izinkan akses penyimpanan jika diminta)*

3. **Clone Repository**
   ```bash
   git clone https://github.com/mkhar2708/aplikasi-web-mcn.git
   cd aplikasi-web-mcn
   ```

4. **Ubah Port (PENTING)**
   Di Android (Non-Root), kita tidak bisa memakai Port 80.
   Edit file `server.js` menggunakan `nano`:
   ```bash
   nano server.js
   ```
   Ubah baris `const PORT = 80;` menjadi `const PORT = 8080;`.
   Simpan dengan tekan `CTRL+X`, lalu `Y`, lalu `Enter`.

5. **Jalankan Server**
   ```bash
   npm install
   node server.js
   ```
   Akses di HP lain dengan: `http://192.168.x.x:8080`

### BAGIAN 4: Cara PWA dan Credits

## 📱 Cara Akses via HP (PWA Mode)

Agar website tampil full layar tanpa address bar browser:

1. Pastikan HP dan Server (Laptop/Termux) terhubung di **Wi-Fi yang sama**.
2. **Khusus Windows**: Matikan Firewall sejenak atau izinkan akses saat Node.js meminta izin.
3. Buka Chrome di HP Klien, ketik IP Address Server.
4. Klik menu browser (Titik Tiga di pojok kanan atas).
5. Pilih **"Add to Home Screen"** atau **"Install App"**.
6. Buka ikon baru di beranda HP Anda. Voila! Tampilan seperti aplikasi native.

## 📂 Struktur Project

- `server.js` : Backend utama (Node.js).
- `public/` : Folder Frontend.
- `videos/` : Tempat fisik file .mp4 disimpan.
- `data.json` : Database lokal metadata video (Auto-create).

## 🛠 Teknologi
Frontend: HTML5, CSS3, Vanilla JavaScript.
Backend: Node.js, Express.
Storage: JSON Flat File.

<br>

<div align="center">
  <small>Created with ❤️ by <strong>Mas Kharisman DevOps</strong></small><br>
  <small><a href="https://maskhar.it.com">maskhar.it.com</a></small>
</div>

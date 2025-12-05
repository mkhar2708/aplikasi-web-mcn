# 🎥 Malang City Network - Local Video Player (PWA Ready)

Malang City Network - Local Video Player adalah aplikasi streaming video lokal berbasis web yang berjalan di jaringan localhost (Wi-Fi). Aplikasi ini memungkinkan Anda mengupload, mengelola, dan menonton video dari berbagai perangkat (HP, Tablet, PC) dengan tampilan modern yang responsif.

![MyStream Preview](https://via.placeholder.com/800x400?text=MyStream+Preview)

## ✨ Fitur Utama

- **🎬 Live Preview Autoplay**: Video berjalan otomatis (preview bergerak) saat hover (PC) atau scroll (Mobile/Tablet).
- **📱 PWA & Mobile Optimized**: Bisa diinstall sebagai Aplikasi (tanpa browser bar) di Android/iOS.
- **🛠 Admin Dashboard**: Upload dan hapus video secara mudah tanpa coding.
- **⚙️ Backend Otomatis**: System otomatis membuat database JSON dan folder penyimpanan jika belum ada.
- **🖥 Multi-Device Access**: Akses dari HP dengan IP Address local yang terdeteksi otomatis.
- **⛶ True Fullscreen**: Mendukung Fullscreen Player maupun Fullscreen App Mode (Kiosk Mode).

## 🚀 Cara Menjalankan Project
Pastikan di komputer Anda sudah terinstall **Node.js**.

1. **Clone Repository**
   ```bash
   git clone https://github.com/mkhar2708/aplikasi-web-mcn.git
   cd local-video-v0.1
   ```
2. **Install Library**
   ```bash
   npm install
   ````

3. **Jalankan Aplikasi**
   ```bash
   npm start
   ```

4. **Buka di Browser**
   ```bash
   Lihat Terminal untuk mengetahui IP Address yang bisa diakses.
   Local: http://localhost:3003
   Network/HP: http://192.168.x.x:3003 (Sesuai IP Terminal)
   ```

## 📂 Struktur Project

```server.js``` : Otak backend (Node.js & Express). Menangani upload & streaming.

```public/``` : Folder Frontend (HTML/CSS/JS).
- `assets/` : Menyimpan file style dan logic script.
- `videos/` : Tempat penyimpanan fisik file video.
```data.json``` : Database file ringan (NoSQL-like) untuk menyimpan metadata video.

## 📱 Cara Install di HP (PWA)
Agar tampil full layar tanpa address bar browser:
1. Pastikan HP dan Laptop konek di satu Wi-Fi.
2. Matikan Firewall Laptop (Port 3003).
3. Buka IP Laptop di Chrome HP (Cth: 192.168.1.5:3003).
4. Klik menu Browser (Titik Tiga) -> Pilih "Add to Home Screen" atau "Install App".
5. Buka icon aplikasi baru di layar HP Anda.

## 🛠 Teknologi
Frontend: HTML5, CSS3, Vanilla JavaScript (Intersection Observer API).
Backend: Node.js, Express.
Data & File: JSON Storage, Multer (File Upload).


Created with ❤️ by [Mas Kharisman DevOps](https://maskhar.it.com)

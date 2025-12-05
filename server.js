const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
// Multer untuk handling file upload
const multer = require('multer');
// menambahkan dotenv untuk konfigurasi environment
require('dotenv').config();

const PORT = process.env.PORT;

// --- DEFINISI PATH AGAR LEBIH RAPI & AMAN ---
const PUBLIC_DIR = path.join(__dirname, 'public');
const VIDEO_DIR = path.join(PUBLIC_DIR, 'videos');
const DB_FILE = path.join(__dirname, 'data.json');

// --- 1. FITUR AUTO FIX (Folder & DB) ---
// Cek: Apakah folder video sudah ada? Kalau belum, BUAT SEKARANG.
if (!fs.existsSync(VIDEO_DIR)) {
    console.log("Folder video belum ada, membuat folder baru...");
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

// Cek: Apakah database data.json sudah ada? Kalau belum, BUAT array kosong.
if (!fs.existsSync(DB_FILE)) {
    console.log("Database belum ada, membuat file data.json...");
    fs.writeFileSync(DB_FILE, '[]', 'utf-8');
}

// --- 2. Konfigurasi Upload (Multer) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Sekarang aman karena folder sudah pasti dibuat di atas
        cb(null, VIDEO_DIR); 
    },
    filename: (req, file, cb) => {
        // Nama file unik: WaktuSekarang_NamaAsli
        // .replace(/ /g, '-') mengganti spasi dengan strip agar URL video tidak putus
        const safeName = file.originalname.replace(/ /g, '-');
        cb(null, Date.now() + '_' + safeName);
    }
});
const upload = multer({ storage: storage });

app.use(express.static(PUBLIC_DIR));
app.use(express.json());

// --- ROUTING ---
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html')));

// --- API: Ambil Data Video ---
app.get('/api/videos', (req, res) => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        const videos = data ? JSON.parse(data) : [];
        res.json(videos);
    } catch (error) {
        // Jika file rusak/error, kirim array kosong agar web tidak crash
        console.error("Gagal baca DB:", error);
        res.json([]);
    }
});

// --- API: Upload Video ---
app.post('/api/upload', upload.single('videoFile'), (req, res) => {
    // Jika tidak ada file yang terupload (misal ditolak Multer)
    if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'Tidak ada file yang diunggah' });
    }

    const title = req.body.title || "Tanpa Judul"; 
    const filename = req.file.filename;

    const newVideo = {
        id: Date.now(),
        title: title,
        file: filename,
        uploadedAt: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    };

    // Proses Simpan ke Database
    try {
        let videos = [];
        // Baca data lama dulu
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        videos = JSON.parse(fileContent);

        // Tambah data baru ke urutan pertama (unshift) supaya muncul paling atas
        videos.unshift(newVideo);

        // Tulis ulang file
        fs.writeFileSync(DB_FILE, JSON.stringify(videos, null, 2));

        console.log(`Berhasil upload: ${title} (${filename})`);
        res.json({ status: 'success', message: 'Video berhasil disimpan', data: newVideo });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Gagal menyimpan data ke database' });
    }
});

// ... (Kode sebelumnya)

// --- API: HAPUS VIDEO ---
app.delete('/api/videos/:id', (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        let videos = JSON.parse(fileContent);

        // Cari data video yang mau dihapus
        const targetIndex = videos.findIndex(v => v.id === id);
        
        if (targetIndex === -1) {
            return res.status(404).json({ message: "Video tidak ditemukan" });
        }

        const videoToDelete = videos[targetIndex];

        // 1. Hapus File Fisik di folder 'public/videos'
        const filePath = path.join(VIDEO_DIR, videoToDelete.file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Hapus file dari harddisk
            console.log(`File dihapus: ${videoToDelete.file}`);
        }

        // 2. Hapus dari Database JSON
        videos.splice(targetIndex, 1);
        fs.writeFileSync(DB_FILE, JSON.stringify(videos, null, 2));

        res.json({ status: 'success', message: 'Video berhasil dihapus' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Gagal menghapus video' });
    }
});

// Jalankan Server
// 0.0.0.0 artinya: Dengarkan permintaan dari manapun (bukan cuma localhost)
app.listen(PORT, '0.0.0.0', () => {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const results = {}; // Kita simpan semua IP di sini

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Lewati yang internal (127.0.0.1) & Non-IPv4
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }

    console.log(`\n==================================================`);
    console.log(`✅ SERVER ONLINE DI PORT: ${PORT}`);
    console.log(`🏠 Akses di Laptop:   http://localhost:${PORT}`);
    console.log(`==================================================`);
    console.log(`Pilih salah satu alamat ini untuk dibuka di HP:\n`);

    // Tampilkan semua kemungkinan IP
    Object.keys(results).forEach((name) => {
        results[name].forEach((ip) => {
             // Beri tanda jika IP ini kemungkinan besar IP WiFi (Biasanya kepala 192. atau 10.)
            const recommended = (ip.startsWith('192.168.') || ip.startsWith('10.')) ? '  <-- COBA INI' : '';
            console.log(`   http://${ip}:${PORT} ${recommended}`);
        });
    });
    console.log(`\n(Pastikan Laptop & HP satu WiFi dan Firewall izinkan port ${PORT})`);
    console.log(`==================================================\n`);
});
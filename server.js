const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const PORT = 80;

// --- KONFIGURASI PATH ---
const PUBLIC_DIR = path.join(__dirname, 'public');
const VIDEO_DIR = path.join(PUBLIC_DIR, 'videos');
const DB_FILE = path.join(__dirname, 'data.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// --- INITIAL SETUP (Buat file jika belum ada) ---
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]', 'utf-8');
if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, '{"layoutColumns": 3}', 'utf-8');

// --- MULTER (Untuk Upload) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, VIDEO_DIR),
    filename: (req, file, cb) => {
        // Bersihkan nama file dari spasi
        const safeName = file.originalname.replace(/\s+/g, '-');
        cb(null, Date.now() + '_' + safeName);
    }
});
const upload = multer({ storage: storage });

app.use(express.static(PUBLIC_DIR));
app.use(express.json());

// --- ROUTES HALAMAN ---
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html')));

// --- DATABASE UTILS ---
function loadDB() {
    let videos = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    // Migrasi data agar memiliki field baru
    return videos.map((v, i) => ({
        ...v,
        order: v.order !== undefined ? v.order : i, // Jika tidak ada urutan, pakai index
        isVisible: v.isVisible !== undefined ? v.isVisible : true,
        lastModified: v.lastModified || v.uploadedAt
    })).sort((a, b) => a.order - b.order); // Selalu urutkan berdasarkan order
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- API ENDPOINTS ---

// 1. Ambil Data Video
app.get('/api/videos', (req, res) => res.json(loadDB()));

// 2. Upload Video Baru (Multiple)
app.post('/api/upload', upload.array('videoFiles', 50), (req, res) => {
    let videos = loadDB();
    const maxOrder = videos.length > 0 ? Math.max(...videos.map(v => v.order)) : -1;
    
    if (req.files) {
        req.files.forEach((file, i) => {
            const now = new Date().toLocaleString('id-ID');
            videos.unshift({
                id: Date.now() + Math.floor(Math.random() * 10000),
                title: file.originalname.replace(/\.[^/.]+$/, ""),
                file: file.filename,
                uploadedAt: now,
                lastModified: now,
                isVisible: true,
                order: maxOrder + i + 1 // Urutan paling bawah
            });
        });
        // Reset ulang urutan 0,1,2 agar rapi
        videos.forEach((v, i) => v.order = i);
        saveDB(videos);
    }
    res.json({ status: 'success', count: req.files ? req.files.length : 0 });
});

// 3. Ganti File Video (Replace)
app.post('/api/videos/:id/replace', upload.single('videoFile'), (req, res) => {
    const id = parseInt(req.params.id);
    let videos = loadDB();
    const idx = videos.findIndex(v => v.id === id);

    if (idx !== -1 && req.file) {
        // Hapus fisik lama
        const oldPath = path.join(VIDEO_DIR, videos[idx].file);
        if(fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        
        // Update DB
        videos[idx].file = req.file.filename;
        videos[idx].lastModified = new Date().toLocaleString('id-ID');
        saveDB(videos);
        res.json({ status: 'success' });
    } else {
        res.status(400).json({ error: "Gagal replace" });
    }
});

// 4. Update Info / Reorder (Pindah Urutan)
app.put('/api/videos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { title, order } = req.body;
    let videos = loadDB();
    const idx = videos.findIndex(v => v.id === id);

    if (idx !== -1) {
        if(title) {
            videos[idx].title = title;
            videos[idx].lastModified = new Date().toLocaleString('id-ID');
        }
        
        if(order !== undefined) {
            // Pindah posisi array
            const item = videos[idx];
            videos.splice(idx, 1);       // Cabut dari posisi lama
            videos.splice(order, 0, item); // Masukkan ke posisi baru
            
            // Rapikan index order lagi
            videos.forEach((v, i) => v.order = i);
        }
        
        saveDB(videos);
        res.json({ status: 'success' });
    } else {
        res.status(404).json({ error: "Not found" });
    }
});

// 5. Bulk Actions (Hapus Massal / Status Massal)
app.post('/api/videos/bulk-action', (req, res) => {
    const { ids, action } = req.body;
    let videos = loadDB();

    if (action === 'delete') {
        ids.forEach(id => {
            const v = videos.find(vid => vid.id === id);
            if(v) {
                const p = path.join(VIDEO_DIR, v.file);
                if(fs.existsSync(p)) fs.unlinkSync(p);
            }
        });
        videos = videos.filter(v => !ids.includes(v.id));
        // Rapikan order
        videos.forEach((v, i) => v.order = i);
    } 
    else if (action === 'hide' || action === 'show') {
        videos.forEach(v => {
            if (ids.includes(v.id)) {
                v.isVisible = (action === 'show');
            }
        });
    }

    saveDB(videos);
    res.json({ status: 'success' });
});

// 6. Settings
app.get('/api/settings', (req, res) => res.json(JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))));
app.post('/api/settings', (req, res) => {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body));
    res.json({ status: 'success' });
});

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
    console.log(`         Creator By Mas Kharisman\n`);
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
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const PORT = 80;

// --- PATH SETUP ---
const PUBLIC_DIR = path.join(__dirname, 'public');
const VIDEO_DIR = path.join(PUBLIC_DIR, 'videos');
const DB_FILE = path.join(__dirname, 'data.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// --- INITIALIZATION ---
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]', 'utf-8');
if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, '{"layoutColumns": 3}', 'utf-8');

// --- MULTER CONFIG (MULTIPLE FILES SUPPORT) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, VIDEO_DIR),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, '-');
        cb(null, Date.now() + '_' + safeName);
    }
});
const upload = multer({ storage: storage });

app.use(express.static(PUBLIC_DIR));
app.use(express.json());

// --- ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html')));

// --- API CRUD ---

// 1. GET ALL
app.get('/api/videos', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        const cleanData = data.map(v => ({ ...v, isVisible: v.isVisible ?? true }));
        res.json(cleanData);
    } catch (e) { res.json([]); }
});

// 2. BULK UPLOAD (MENDUKUNG BANYAK FILE)
// Menggunakan upload.array 'videoFiles' (Perhatikan nama fieldnya ada 's' nya sekarang)
app.post('/api/upload', upload.array('videoFiles', 50), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No files' });
    }

    const videos = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    const uploadedResults = [];

    // Loop semua file yang diupload
    req.files.forEach(file => {
        const newVideo = {
            id: Date.now() + Math.floor(Math.random() * 1000), // ID Unik + Random dikit biar gak bentrok
            title: file.originalname.replace(/\.[^/.]+$/, ""), // Nama file jadi Judul otomatis (hapus .mp4)
            file: file.filename,
            uploadedAt: new Date().toLocaleDateString('id-ID'),
            isVisible: true
        };
        videos.unshift(newVideo); // Masukkan ke urutan atas
        uploadedResults.push(newVideo);
    });

    fs.writeFileSync(DB_FILE, JSON.stringify(videos, null, 2));
    res.json({ status: 'success', count: uploadedResults.length });
});

// 3. EDIT JUDUL (UPDATE)
app.put('/api/videos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { title } = req.body;
    let videos = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    
    const idx = videos.findIndex(v => v.id === id);
    if(idx !== -1) {
        videos[idx].title = title;
        fs.writeFileSync(DB_FILE, JSON.stringify(videos, null, 2));
        res.json({ status: 'success', data: videos[idx] });
    } else {
        res.status(404).json({ error: "Not found" });
    }
});

// 4. BULK DELETE & TOGGLE (FITUR BARU)
app.post('/api/videos/bulk-action', (req, res) => {
    const { ids, action } = req.body; // action: 'delete' | 'hide' | 'show'
    let videos = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    
    if (action === 'delete') {
        // Hapus File Fisik Dulu
        ids.forEach(id => {
            const vid = videos.find(v => v.id === id);
            if(vid) {
                const p = path.join(VIDEO_DIR, vid.file);
                if(fs.existsSync(p)) fs.unlinkSync(p);
            }
        });
        // Filter array, buang yang id-nya ada di list hapus
        videos = videos.filter(v => !ids.includes(v.id));
    } 
    else if (action === 'hide' || action === 'show') {
        videos = videos.map(v => {
            if (ids.includes(v.id)) {
                v.isVisible = (action === 'show');
            }
            return v;
        });
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(videos, null, 2));
    res.json({ status: 'success' });
});

// 5. SETTINGS
app.get('/api/settings', (req, res) => {
    res.json(JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')));
});
app.post('/api/settings', (req, res) => {
    const s = { layoutColumns: parseInt(req.body.layoutColumns) || 3 };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
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
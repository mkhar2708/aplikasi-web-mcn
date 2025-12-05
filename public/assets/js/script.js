/* --- VARIABLE UI GLOBAL --- */
const grid = document.getElementById('gridContainer');
const modal = document.getElementById('videoModal');
const fullPlayer = document.getElementById('fullPlayer');

/* --- 1. SYSTEM INITIALIZATION --- */
// Fungsi utama yang dipanggil saat web dibuka
async function init() {
    await loadSettings(); // Atur Grid Kolom dulu
    await loadVideos();   // Baru load videonya
}

/* --- 2. LOGIC SETTINGS (GRID LAYOUT) --- */
async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        const settings = await res.json();
        
        // Ambil jumlah kolom (default 3)
        const col = settings.layoutColumns || 3;
        
        // Inject ke CSS Variable '--col-count'
        document.documentElement.style.setProperty('--col-count', col);
        console.log("Layout diatur ke:", col, "kolom");
    } catch (e) {
        console.error("Gagal load setting layout", e);
    }
}

/* --- 3. LOGIC LOAD & RENDER VIDEOS --- */
async function loadVideos() {
    try {
        const response = await fetch('/api/videos');
        let videos = await response.json();
        
        grid.innerHTML = ''; 

        // FILTER: Hanya tampilkan jika status 'isVisible' bukan false
        videos = videos.filter(v => v.isVisible !== false);

        if(videos.length === 0) {
            grid.innerHTML = '<div class="empty-msg"><h3>Tidak ada video yang ditayangkan.</h3></div>';
            return;
        }

        videos.forEach(vid => {
            const card = createVideoCard(vid);
            grid.appendChild(card);
        });

    } catch (error) { console.error("Error load videos:", error); }
}

// Fungsi pembantu membuat HTML Card agar rapi
function createVideoCard(vid) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    card.innerHTML = `
        <div class="video-wrapper">
            <video class="preview-vid" 
                   src="videos/${vid.file}" 
                   muted playsinline loop preload="metadata"></video>
        </div>
        <div class="video-info">
            <div class="video-title">${vid.title}</div>
            <div class="video-meta">${vid.uploadedAt}</div>
        </div>
    `;

    // Pasang Event Listener (Interaksi)
    const videoEl = card.querySelector('.preview-vid');
    videoEl.currentTime = 1.0; // Thumbnail detik ke-1

    // A. Observer (HP Scroll)
    observer.observe(videoEl);

    // B. Mouse Hover (PC)
    card.addEventListener('mouseenter', () => playPreview(videoEl));
    card.addEventListener('mouseleave', () => stopPreview(videoEl));

    // C. Click Open Player
    card.addEventListener('click', () => openModal("videos/" + vid.file));

    return card;
}

/* --- 4. PREVIEW HELPERS (HOVER/SCROLL) --- */
function playPreview(videoEl) {
    videoEl.muted = true; videoEl.loop = true;
    let p = videoEl.play();
    if(p !== undefined) p.catch(() => {});
}

function stopPreview(videoEl) {
    videoEl.pause();
    videoEl.currentTime = 1.0; 
}

let observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) playPreview(entry.target);
        else stopPreview(entry.target);
    });
}, { threshold: 0.6 });

/* --- 5. MODAL & FULLSCREEN LOGIC --- */
// Toggle Full Website (Kiosk Mode)
function toggleAppFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e=>{});
    else document.exitFullscreen();
}

// Toggle Video Only Fullscreen
function toggleVideoFullscreen() {
    if (document.fullscreenElement === fullPlayer) document.exitFullscreen();
    else if (fullPlayer.requestFullscreen) fullPlayer.requestFullscreen();
    else if (fullPlayer.webkitRequestFullscreen) fullPlayer.webkitRequestFullscreen(); // iOS/Safari
}

function openModal(src) {
    fullPlayer.src = src;
    modal.style.display = 'flex';
    fullPlayer.currentTime = 0; fullPlayer.muted = false; fullPlayer.play();
}

function closeModal() {
    if (document.fullscreenElement === fullPlayer) document.exitFullscreen();
    modal.style.display = 'none'; fullPlayer.pause(); fullPlayer.src = "";
}

// Shortcut ESC
document.addEventListener('keydown', (e) => { if (e.key === "Escape") closeModal(); });

/* --- RUN APP --- */
init();
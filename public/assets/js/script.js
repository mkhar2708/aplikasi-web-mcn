// --- INIT UI GLOBAL ---
const grid = document.getElementById('gridContainer');
const modal = document.getElementById('videoModal');
const fullPlayer = document.getElementById('fullPlayer');

// 1. Matikan Klik Kanan Global
document.addEventListener('contextmenu', e => e.preventDefault());

// 2. Init App
document.addEventListener('DOMContentLoaded', () => {
    initHome();
    setupPlayerEvents();
});

async function initHome() {
    await applyLayoutSetting();
    await loadVideos();
}

function setupPlayerEvents() {
    // FITUR AUTO CLOSE: Saat video habis, tutup modal tapi TETAP FULLSCREEN APP
    fullPlayer.addEventListener('ended', () => {
        closeModal();
    });

    fullPlayer.setAttribute('controlsList', 'nodownload');
    fullPlayer.setAttribute('oncontextmenu', 'return false;');
}

async function applyLayoutSetting() {
    try {
        const res = await fetch('/api/settings');
        const s = await res.json();
        document.documentElement.style.setProperty('--col-count', s.layoutColumns || 3);
    } catch(e) {}
}

async function loadVideos() {
    try {
        const res = await fetch('/api/videos');
        let videos = await res.json();
        grid.innerHTML = '';
        videos = videos.filter(v => v.isVisible !== false);

        if(videos.length === 0) {
            grid.innerHTML = '<p class="empty-msg" style="text-align:center; padding:30px; color:#888;">Tidak ada video tayang.</p>';
            return;
        }

        videos.forEach(vid => {
            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <div class="video-wrapper">
                    <video class="preview-vid" 
                        src="videos/${vid.file}#t=1.0" 
                        muted playsinline loop preload="metadata"
                        controlsList="nodownload" 
                        oncontextmenu="return false;">
                    </video>
                </div>
                <div class="video-info">
                    <div class="video-title">${vid.title}</div>
                    <div class="video-meta">${vid.uploadedAt}</div>
                </div>
            `;
            
            const vEl = card.querySelector('video');
            observer.observe(vEl);
            card.addEventListener('mouseenter', () => playPv(vEl));
            card.addEventListener('mouseleave', () => stopPv(vEl));
            card.addEventListener('click', () => openPlayer("videos/"+vid.file));
            
            grid.appendChild(card);
        });
    } catch(e) { console.error(e); }
}

async function refreshData() {
    grid.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Menyegarkan...</p>';
    await loadVideos();
}

// --- PREVIEW ---
function playPv(el) { el.muted = true; el.play().catch(()=>{}); }
function stopPv(el) { el.pause(); el.currentTime = 1.0; }

let observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if(e.isIntersecting) playPv(e.target); else stopPv(e.target);
    })
}, {threshold: 0.6});

// --- FULL PLAYER LOGIC (REVISI DI SINI) ---

function openPlayer(src) {
    fullPlayer.src = src;
    modal.style.display = 'flex';
    fullPlayer.currentTime = 0;
    fullPlayer.muted = false;
    fullPlayer.play().catch(()=>{});
}

function closeModal() {
    /* 
       LOGIKA BARU:
       Cek dulu, siapa yang sedang memegang Fullscreen?
       
       1. Jika yang fullscreen adalah TAG <VIDEO> (Player kecil membesar), maka Exit Fullscreen.
       2. Jika yang fullscreen adalah <HTML> (Satu Website/Mode Aplikasi), JANGAN Exit.
    */
    if (document.fullscreenElement === fullPlayer) {
        // Hanya keluar fullscreen jika player video-nya saja yang fullscreen
        document.exitFullscreen().catch(e => {}); 
    }

    // Apapun yang terjadi, Sembunyikan Modal (Overlay hitam)
    modal.style.display = 'none';
    fullPlayer.pause();
    fullPlayer.src = "";
}

function toggleVideoFullscreen() {
    // Ini tombol "Layar Video" di dalam modal
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        if(fullPlayer.requestFullscreen) fullPlayer.requestFullscreen();
        else if(fullPlayer.webkitEnterFullscreen) fullPlayer.webkitEnterFullscreen(); // iPhone
    }
}

function toggleAppFullscreen() {
    // Ini tombol "Fullscreen" di Header (Mode Aplikasi)
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((e) => {
            alert("Klik layar sekali, lalu coba lagi.");
        });
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('keydown', e => { 
    if(e.key === 'Escape') closeModal(); 
});
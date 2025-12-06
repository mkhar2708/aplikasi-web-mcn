// --- INIT UI ---
const grid = document.getElementById('gridContainer');
const modal = document.getElementById('videoModal');
const fullPlayer = document.getElementById('fullPlayer');

// Anti Right Click (Simple prevention)
document.addEventListener('contextmenu', e => e.preventDefault());

// Init App
document.addEventListener('DOMContentLoaded', () => {
    initHome();
});

async function initHome() {
    await applyLayoutSetting();
    await loadVideos();
}

async function applyLayoutSetting() {
    try {
        const res = await fetch('/api/settings');
        const s = await res.json();
        // Set CSS Variable
        document.documentElement.style.setProperty('--col-count', s.layoutColumns || 3);
    } catch(e) {}
}

async function loadVideos() {
    try {
        const res = await fetch('/api/videos');
        let videos = await res.json();

        grid.innerHTML = '';
        
        // Filter: Hanya yang tayang
        videos = videos.filter(v => v.isVisible !== false);

        if(videos.length === 0) {
            grid.innerHTML = '<p class="empty-msg" style="text-align:center;">Tidak ada video tayang.</p>';
            return;
        }

        videos.forEach(vid => {
            const card = document.createElement('div');
            card.className = 'video-card';
            // Note: controlsList & oncontextmenu ditambahkan di preview juga
            card.innerHTML = `
                <div class="video-wrapper">
                    <video class="preview-vid" 
                        src="videos/${vid.file}" 
                        muted playsinline loop preload="metadata"
                        controlsList="nodownload" oncontextmenu="return false;">
                    </video>
                </div>
                <div class="video-info">
                    <div class="video-title">${vid.title}</div>
                    <div class="video-meta">${vid.uploadedAt}</div>
                </div>
            `;
            
            // Interaction logic
            const vEl = card.querySelector('video');
            vEl.currentTime = 1.0; 
            
            // Hover PC
            card.addEventListener('mouseenter', () => playPv(vEl));
            card.addEventListener('mouseleave', () => stopPv(vEl));
            
            // Scroll HP
            observer.observe(vEl);

            // Click Open
            card.addEventListener('click', () => openPlayer("videos/"+vid.file));
            
            grid.appendChild(card);
        });

    } catch(e) { console.error(e); }
}

async function refreshData() {
    grid.innerHTML = '<p style="text-align:center;">Menyegarkan...</p>';
    await loadVideos();
}

// --- PLAYER HELPERS ---
function playPv(el) { el.muted=true; el.play().catch(()=>{}); }
function stopPv(el) { el.pause(); el.currentTime=1.0; }

let observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if(e.isIntersecting) playPv(e.target);
        else stopPv(e.target);
    })
}, {threshold: 0.6});

// --- MODAL & SCREEN ---
function openPlayer(src) {
    fullPlayer.src = src;
    modal.style.display = 'flex';
    fullPlayer.currentTime = 0;
    fullPlayer.muted = false;
    fullPlayer.play();
}
function closeModal() {
    if(document.fullscreenElement === fullPlayer) document.exitFullscreen();
    modal.style.display = 'none';
    fullPlayer.pause();
    fullPlayer.src = "";
}
function toggleVideoFullscreen() {
    if(document.fullscreenElement) document.exitFullscreen();
    else fullPlayer.requestFullscreen();
}
function toggleAppFullscreen() {
    if(document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
}
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });
// --- VARIABEL GLOBAL ---
const grid = document.getElementById('gridContainer');
const modal = document.getElementById('videoModal');
const fullPlayer = document.getElementById('fullPlayer');

// --- 1. SETUP LOGIKA OBSERVER (AUTOPLAY TABLET/HP) ---
let observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
            playPreview(video);
        } else {
            stopPreview(video);
        }
    });
}, { threshold: 0.6 });

// --- HELPER UNTUK AUTOPLAY LEBIH KUAT ---
function playPreview(videoEl) {
    videoEl.muted = true; 
    videoEl.loop = true;
    // Play dan tangani error jika browser memblokir
    var playPromise = videoEl.play();
    if (playPromise !== undefined) {
        playPromise.catch(_ => {});
    }
}

function stopPreview(videoEl) {
    videoEl.pause();
    videoEl.currentTime = 1.0; 
}

// --- 2. LOAD DATA DARI SERVER ---
async function loadVideos() {
    try {
        const response = await fetch('/api/videos');
        const videos = await response.json();
        
        grid.innerHTML = ''; 

        if(videos.length === 0) {
            grid.innerHTML = '<div class="empty-msg"><h3>Belum ada video.</h3><p>Silakan Upload dulu di Admin.</p></div>';
            return;
        }

        videos.forEach(vid => {
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

            const videoEl = card.querySelector('.preview-vid');
            videoEl.currentTime = 1.0; 

            // -- Logic Mobile (Scroll) --
            observer.observe(videoEl);

            // -- Logic PC (Hover) --
            card.addEventListener('mouseenter', () => playPreview(videoEl));
            card.addEventListener('mouseleave', () => stopPreview(videoEl));

            // -- KLIK (Buka Player) --
            card.addEventListener('click', () => openModal("videos/" + vid.file));

            grid.appendChild(card);
        });

    } catch (error) { console.error(error); }
}

// --- 3. LOGIKA FULLSCREEN DAN MODAL (REVISI DISINI) ---

function toggleAppFullscreen() {
    // Tombol di Header: Fullscreen seluruh Website
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
        document.exitFullscreen();
    }
}

function toggleVideoFullscreen() {
    // Tombol di Player: Fullscreen Video Player-nya saja
    if (document.fullscreenElement === fullPlayer) {
        document.exitFullscreen(); // Kecilkan player
    } else {
        if (fullPlayer.requestFullscreen) fullPlayer.requestFullscreen();
        else if (fullPlayer.webkitRequestFullscreen) fullPlayer.webkitRequestFullscreen(); // Safari Support
    }
}

function openModal(videoSrc) {
    fullPlayer.src = videoSrc;
    modal.style.display = 'flex';
    fullPlayer.currentTime = 0;
    fullPlayer.muted = false; // Suara ON
    fullPlayer.play();
}

function closeModal() {
    /* 
       PERBAIKAN UTAMA DI SINI:
       Kita cek dulu, "Apa yang sedang Fullscreen sekarang?"
       
       - Jika yang fullscreen adalah VIDEO PLAYER -> Kita kecilkan videonya.
       - Jika yang fullscreen adalah HALAMAN WEBSITE (APP MODE) -> JANGAN DI GANGGU!
    */
    
    if (document.fullscreenElement === fullPlayer) {
        document.exitFullscreen();
    }

    modal.style.display = 'none';
    fullPlayer.pause();
    fullPlayer.src = "";
}

// Shortcut keyboard
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeModal();
});

// INIT
loadVideos();
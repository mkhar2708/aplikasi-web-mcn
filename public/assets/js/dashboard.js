/* --- INIT --- */
document.addEventListener('DOMContentLoaded', () => {
    initDash();
});

async function initDash() {
    await loadSettings();
    await loadTable();
}

/* --- SETTINGS --- */
async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        const set = await res.json();
        document.getElementById('colLayout').value = set.layoutColumns || 3;
    } catch (e) {}
}

async function saveSettings() {
    const val = document.getElementById('colLayout').value;
    const btn = document.querySelector('.btn-blue');
    btn.innerText = "...";
    await fetch('/api/settings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ layoutColumns: val })
    });
    btn.innerText = "Simpan Layout";
}

/* --- LOAD DATA TABLE --- */
async function loadTable() {
    const tbody = document.getElementById('videoList');
    // Reset Checkbox All
    document.getElementById('checkAll').checked = false;
    updateBulkToolbar();

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Memuat...</td></tr>';
    
    try {
        const res = await fetch('/api/videos');
        const videos = await res.json();
        
        tbody.innerHTML = '';
        if(videos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px;">Belum ada video</td></tr>';
            return;
        }

        videos.forEach(vid => {
            const tr = createRow(vid);
            tbody.appendChild(tr);
        });

    } catch (error) { console.error(error); }
}

/* --- ROW CREATION WITH CHECKBOX & EDIT --- */
function createRow(vid) {
    const isActive = vid.isVisible !== false;
    const badgeClass = isActive ? 'badge-active' : 'badge-hidden';
    const badgeText  = isActive ? 'TAYANG' : 'HIDDEN';

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="col-check">
            <input type="checkbox" class="vid-chk" value="${vid.id}" onchange="updateBulkToolbar()">
        </td>
        <td>
            <div style="font-size:15px; font-weight:bold;">${vid.title}</div>
            <div style="font-size:12px; color:gray;">File: ${vid.file} • Upload: ${vid.uploadedAt}</div>
        </td>
        <td style="text-align:center;">
            <span class="badge ${badgeClass}">${badgeText}</span>
        </td>
        <td style="text-align:center;">
            <button class="btn-edit" onclick="editTitle(${vid.id}, '${vid.title}')">✎ Ubah Judul</button>
            <button class="btn-del" onclick="deleteSingle(${vid.id})">🗑</button>
        </td>
    `;
    return tr;
}

/* --- EDIT TITLE FUNCTION --- */
async function editTitle(id, oldTitle) {
    const newTitle = prompt("Edit Judul Video:", oldTitle);
    
    if(newTitle && newTitle !== oldTitle) {
        try {
            const res = await fetch(`/api/videos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            if(res.ok) loadTable(); // Refresh
        } catch(e) { alert("Gagal edit judul"); }
    }
}

/* --- BULK ACTION LOGIC --- */
function toggleAllChecks() {
    const master = document.getElementById('checkAll');
    const checkboxes = document.querySelectorAll('.vid-chk');
    checkboxes.forEach(cb => cb.checked = master.checked);
    updateBulkToolbar();
}

function updateBulkToolbar() {
    const checkboxes = document.querySelectorAll('.vid-chk:checked');
    const count = checkboxes.length;
    const toolbar = document.getElementById('bulkToolbar');
    
    if(count > 0) {
        toolbar.style.display = 'flex';
        document.getElementById('selectedCount').innerText = `${count} Dipilih`;
    } else {
        toolbar.style.display = 'none';
    }
}

async function bulkAction(action) {
    const checkboxes = document.querySelectorAll('.vid-chk:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if(ids.length === 0) return;

    let confirmMsg = "Konfirmasi tindakan ini?";
    if(action === 'delete') confirmMsg = `Yakin menghapus permanen ${ids.length} video terpilih?`;
    
    if(confirm(confirmMsg)) {
        // Kirim request ke backend
        const res = await fetch('/api/videos/bulk-action', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ids: ids, action: action })
        });
        
        loadTable(); // Refresh tabel setelah selesai
    }
}

// DELETE SINGLE (Wrapper biar gampang)
async function deleteSingle(id) {
    // Kita gunakan logic bulk action tapi id cuma 1 biar hemat kodingan backend
    if(confirm("Hapus video ini?")) {
        await fetch('/api/videos/bulk-action', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ids: [id], action: 'delete' })
        });
        loadTable();
    }
}

/* --- MULTIPLE UPLOAD LOGIC --- */
const form = document.getElementById('uploadForm');
if(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const msg = document.getElementById('statusMsg');
        const btn = document.querySelector('.btn-save');
        const files = document.getElementById('fileInput').files;

        if(files.length === 0) return;

        const formData = new FormData();
        // Append loop semua file
        for (let i = 0; i < files.length; i++) {
            formData.append('videoFiles', files[i]);
        }

        msg.innerText = `Sedang mengupload ${files.length} file... mohon tunggu!`;
        msg.style.color = "blue";
        btn.disabled = true;

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if(data.status === 'success') {
                msg.innerText = `Berhasil upload ${data.count} video!`;
                msg.style.color = "green";
                form.reset();
                loadTable();
            } else {
                throw new Error("Gagal");
            }
        } catch(err) {
            msg.innerText = "Error upload (Mungkin ukuran total terlalu besar)";
            msg.style.color = "red";
        }
        
        btn.disabled = false;
    });
}
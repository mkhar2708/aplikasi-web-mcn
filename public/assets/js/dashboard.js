/* --- GLOBAL --- */
let globalData = [];
let viewMode = localStorage.getItem('dashViewMode') || 'list'; 
let dragSrcEl = null; 

document.addEventListener('DOMContentLoaded', () => {
    initView();
    loadLayout();
    reloadData();
});

function initView() {
    switchView(viewMode, false);
}

function switchView(mode, save = true) {
    viewMode = mode;
    if(save) localStorage.setItem('dashViewMode', mode);

    document.getElementById('btnListView').className = mode === 'list' ? 'view-btn active' : 'view-btn';
    document.getElementById('btnGridView').className = mode === 'grid' ? 'view-btn active' : 'view-btn';
    
    // Jika data sudah ada, render ulang
    if(globalData) render(globalData);
}

/* --- LOAD DATA --- */
async function reloadData() {
    try {
        const res = await fetch('/api/videos');
        globalData = await res.json();
        applyFilters();
    } catch(e) { console.error("Error data load", e); }
}

async function loadLayout() { 
    try {
        const res = await fetch('/api/settings');
        const s = await res.json();
        if(s.layoutColumns) document.getElementById('colLayout').value = s.layoutColumns;
    } catch(e){}
}

function applyFilters() {
    const search = document.getElementById('searchBox').value.toLowerCase();
    const sort = document.getElementById('sortSelect').value;

    let filtered = globalData.filter(v => v.title.toLowerCase().includes(search));

    if(sort === 'az') filtered.sort((a,b)=>a.title.localeCompare(b.title));
    else if(sort === 'newest') filtered.sort((a,b)=>b.id - a.id);
    else if(sort === 'modified') filtered.sort((a,b)=>new Date(b.lastModified) - new Date(a.lastModified));
    else filtered.sort((a,b)=>a.order - b.order);

    render(filtered);
}

function render(data) {
    const isDrag = document.getElementById('sortSelect').value === 'custom' && !document.getElementById('searchBox').value;
    const listCon = document.getElementById('listViewContainer');
    const gridCon = document.getElementById('gridViewContainer');
    const tbody = document.getElementById('videoListBody');
    const gridBody = document.getElementById('videoGridBody');

    // UI State
    listCon.style.display = viewMode === 'list' ? 'block' : 'none';
    gridCon.style.display = viewMode === 'grid' ? 'block' : 'none';
    document.getElementById('totalCount').innerText = data.length;
    resetBulk();

    // CLEAR ISI LAMA
    tbody.innerHTML = '';
    gridBody.innerHTML = '';

    // HANDLER KOSONG (PERBAIKAN PENTING DI SINI)
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#888;">Belum ada video / Tidak ditemukan.<br>Silakan klik "Tambah Video".</td></tr>';
        gridBody.innerHTML = '<p style="text-align:center; width:100%; color:#888;">Belum ada video.</p>';
        return;
    }

    if(viewMode === 'list') {
        data.forEach((vid, i) => {
            const tr = document.createElement('tr');
            if(isDrag) { addDnD(tr); tr.draggable=true; tr.dataset.index=i; tr.className='draggable-item'; }
            
            const badge = vid.isVisible ? 'badge-active' : 'badge-hidden';
            const stat = vid.isVisible ? 'TAYANG' : 'HIDDEN';
            const handle = isDrag ? '<span class="drag-handle">☰</span>' : '<span style="color:#ddd">●</span>';

            tr.innerHTML = `
                <td style="text-align:center;"><input type="checkbox" class="chk" value="${vid.id}" onchange="checkBulk()"></td>
                <td style="text-align:center;">${handle}</td>
                <td style="padding:5px;"><video src="videos/${vid.file}#t=1.0" class="mini-thumb"></video></td>
                <td>
                    <div style="font-weight:600; cursor:pointer; color:#0071e3;" onclick="editTitle(${vid.id}, '${vid.title}')">${vid.title} ✎</div>
                    <div style="font-size:11px; color:#777;">File: ${vid.file} <button onclick="repF(${vid.id})" style="background:none; border:none; color:blue; cursor:pointer; font-size:10px; text-decoration:underline;">[Ganti]</button></div>
                </td>
                <td style="text-align:center;"><span class="badge ${badge}" onclick="tog(${vid.id})">${stat}</span></td>
                <td style="text-align:center;"><button class="btn-del" onclick="del(${vid.id}, '${vid.title}')">🗑</button></td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        data.forEach((vid, i) => {
            const card = document.createElement('div');
            card.className = 'admin-card draggable-item';
            if(isDrag) { addDnD(card); card.draggable=true; card.dataset.index=i; }

            const badge = vid.isVisible ? 'badge-active' : 'badge-hidden';
            const stat = vid.isVisible ? 'TAYANG' : 'HIDDEN';
            
            card.innerHTML = `
                <div class="card-thumb-area">
                    <input type="checkbox" class="chk card-checkbox" value="${vid.id}" onchange="checkBulk()">
                    <video src="videos/${vid.file}#t=1.0"></video>
                </div>
                <div class="card-body">
                    <div class="card-title" onclick="editTitle(${vid.id}, '${vid.title}')">${vid.title}</div>
                    <div class="card-actions">
                        <span class="badge ${badge}" onclick="tog(${vid.id})">${stat}</span>
                        <button class="btn-del" onclick="del(${vid.id}, '${vid.title}')">🗑</button>
                    </div>
                </div>
            `;
            gridBody.appendChild(card);
        });
    }
}

/* --- ACTIONS --- */
async function editTitle(id, old) {
    const n = prompt("Judul baru:", old);
    if(n && n!=old) { await fetch(`/api/videos/${id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({title:n})}); reloadData(); }
}
async function tog(id) {
    // cari status
    const v = globalData.find(x=>x.id==id);
    const act = v.isVisible ? 'hide' : 'show';
    await fetch('/api/videos/bulk-action', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ids:[id], action:act})});
    reloadData();
}
async function del(id, t) {
    if(confirm("Hapus "+t+"?")) {
        await fetch('/api/videos/bulk-action', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ids:[id], action:'delete'})});
        reloadData();
    }
}
const repInp = document.getElementById('replaceInput');
let repId=null;
function repF(id){ repId=id; repInp.click(); }
repInp.onchange=async()=>{
    if(!repId||!repInp.files[0]) return;
    const fd = new FormData(); fd.append('videoFile', repInp.files[0]);
    document.body.style.cursor='wait';
    await fetch(`/api/videos/${repId}/replace`, {method:'POST', body:fd});
    document.body.style.cursor='default';
    reloadData();
}

/* --- BULK --- */
function resetBulk(){ if(document.getElementById('checkAll')) document.getElementById('checkAll').checked=false; checkBulk(); }
function toggleAllChecks(){ const v=document.getElementById('checkAll').checked; document.querySelectorAll('.chk').forEach(c=>c.checked=v); checkBulk(); }
function checkBulk(){
    const c=document.querySelectorAll('.chk:checked').length;
    document.getElementById('bulkToolbar').style.display = c>0?'flex':'none';
    document.getElementById('selectLabel').innerText = c+" Dipilih";
}
async function runBulk(a){
    const ids = Array.from(document.querySelectorAll('.chk:checked')).map(x=>parseInt(x.value));
    if(!ids.length)return;
    if(confirm("Jalankan aksi?")) {
        await fetch('/api/videos/bulk-action', {method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify({ids, action:a})});
        reloadData();
    }
}

/* --- UPLOAD & SETTINGS --- */
function toggleUploadBox(){ const b=document.getElementById('uploadContainer'); b.style.display=b.style.display==='none'?'block':'none';}
document.getElementById('uploadForm').addEventListener('submit', async(e)=>{
    e.preventDefault();
    const fs=document.getElementById('fileInput').files; const fd=new FormData();
    for(let i=0;i<fs.length;i++) fd.append('videoFiles', fs[i]);
    document.getElementById('uploadStatus').innerText="Uploading...";
    const r=await fetch('/api/upload', {method:'POST',body:fd});
    if(r.ok){ document.getElementById('uploadStatus').innerText="Done!"; document.getElementById('uploadForm').reset(); toggleUploadBox(); reloadData();}
});
async function saveLayoutSetting(){ 
    const v=document.getElementById('colLayout').value;
    await fetch('/api/settings', {method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify({layoutColumns:v})});
    alert("Tersimpan!");
}

/* --- DND (SIMPLIFIED) --- */
function addDnD(el){
    el.addEventListener('dragstart', function(e){ dragSrcEl=this; e.dataTransfer.effectAllowed='move'; this.classList.add('dragging'); });
    el.addEventListener('dragover', function(e){ if(e.preventDefault) e.preventDefault(); e.dataTransfer.dropEffect='move'; return false; });
    el.addEventListener('dragenter', function(){ this.classList.add('dragging'); });
    el.addEventListener('dragleave', function(){ this.classList.remove('dragging'); });
    el.addEventListener('dragend', function(){ this.classList.remove('dragging'); document.querySelectorAll('.draggable-item').forEach(x=>x.classList.remove('dragging')); });
    el.addEventListener('drop', async function(e){
        if(e.stopPropagation) e.stopPropagation();
        if(dragSrcEl !== this){
            document.body.style.cursor='wait';
            const fIdx=parseInt(dragSrcEl.dataset.index); const tIdx=parseInt(this.dataset.index);
            const mItem = globalData[fIdx];
            if(mItem) await fetch(`/api/videos/${mItem.id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({order:tIdx})});
            reloadData(); document.body.style.cursor='default';
        }
        return false;
    });
}
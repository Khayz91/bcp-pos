let riwayatList = JSON.parse(localStorage.getItem('bcp_data')) || [];
let kategoriSekarang = 'Servis';
let currentId = null;

function playSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
}

function showToast(msg) {
    let t = document.getElementById("toast");
    t.innerText = msg; t.className = "show";
    setTimeout(() => { t.className = ""; }, 2000);
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('themeBtn').innerHTML = `<span class="material-icons-round">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
    localStorage.setItem('bcp_theme', isDark ? 'dark' : 'light');
}

if(localStorage.getItem('bcp_theme')==='dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('themeBtn').innerHTML = `<span class="material-icons-round">light_mode</span>`;
}

function switchTab(t) {
    document.getElementById('tabInput').classList.toggle('active', t==='input');
    document.getElementById('tabRiwayat').classList.toggle('active', t==='riwayat');
    document.getElementById('btnTabInput').classList.toggle('active', t==='input');
    document.getElementById('btnTabRiwayat').classList.toggle('active', t==='riwayat');
    if(t==='riwayat') renderHistory();
}

function formatRupiah(i) {
    let v = i.value.replace(/[^,\d]/g, '');
    let s = v.split(','), r = s[0].length % 3, rup = s[0].substr(0, r), rib = s[0].substr(r).match(/\d{3}/gi);
    if(rib) rup += (r ? '.' : '') + rib.join('.');
    i.value = rup;
}

function clean(s) { return s ? parseInt(s.replace(/\./g, '')) : 0; }
function fA(n) { return new Intl.NumberFormat('id-ID').format(n); }

function setKategori(k) {
    kategoriSekarang = k;
    document.getElementById('btnKatServis').classList.toggle('active', k==='Servis');
    document.getElementById('btnKatLaptop').classList.toggle('active', k==='Laptop');
    document.getElementById('areaServis').style.display = k==='Servis' ? 'block' : 'none';
    document.getElementById('areaLaptop').style.display = k==='Laptop' ? 'block' : 'none';
}

function simpanData() {
    let hj = clean(document.getElementById('inpHarga').value);
    if(!hj) { showToast("Harga Jual Kosong!"); return; }
    
    let now = new Date();
    let d = {
        id: Date.now(),
        tgl: now.toLocaleDateString('id-ID') + " " + now.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}),
        unit: document.getElementById('inpUnit').value || 'Pelanggan Umum',
        kategori: kategoriSekarang,
        harga: hj,
        modal: clean(document.getElementById('inpModal').value),
        laba: hj - clean(document.getElementById('inpModal').value),
        part: document.getElementById('inpPart').value,
        prosi: document.getElementById('inpProsesor').value,
        ram: document.getElementById('inpRam').value,
        ssd: document.getElementById('inpSsd').value,
        kondisi: document.getElementById('inpKondisi').value
    };
    riwayatList.unshift(d);
    localStorage.setItem('bcp_data', JSON.stringify(riwayatList));
    document.querySelectorAll('input').forEach(i=>i.value='');
    playSound();
    showToast("Transaksi Berhasil Dicatat! 🚀");
    setTimeout(() => switchTab('riwayat'), 600);
}

function renderHistory() {
    let s = document.getElementById('search').value.toLowerCase();
    let b = document.getElementById('boxRiwayat'), L = 0; b.innerHTML = '';
    
    let filtered = riwayatList.filter(i => i.unit.toLowerCase().includes(s));
    
    if(filtered.length === 0) {
        b.innerHTML = '<p style="text-align:center; color:var(--text-dim); margin-top:20px;">Belum ada data...</p>';
    }

    filtered.forEach(i => {
        L += i.laba;
        let info = i.kategori === 'Laptop' ? `${i.prosi} | RAM ${i.ram}` : i.part;
        b.innerHTML += `
        <div class="glass history-item" onclick="bukaRincian(${i.id})">
            <span class="kat-label">${i.kategori || 'SERVIS'}</span>
            <div style="font-size:10px; color:var(--text-dim)">${i.tgl}</div>
            <div style="font-weight:bold; font-size:17px; margin: 5px 0;">${i.unit}</div>
            <div style="font-size:12px; color:var(--text-dim); margin-bottom:10px;">${info || '-'}</div>
            <div style="font-weight:bold; color:var(--accent); font-size:15px;">+ Rp ${fA(i.laba)}</div>
        </div>`;
    });
    document.getElementById('dashUnit').innerText = filtered.length;
    document.getElementById('dashLaba').innerText = `Rp ${fA(L)}`;
}

function bukaRincian(id) {
    currentId = id; let i = riwayatList.find(x=>x.id===id);
    let detail = `<b>Pelanggan/Unit:</b> ${i.unit}<br><b>Kategori:</b> ${i.kategori || 'Servis'}<br>`;
    if(i.kategori === 'Laptop') detail += `<b>Spesifikasi:</b> ${i.prosi}, RAM ${i.ram}, ${i.ssd} (${i.kondisi})<br>`;
    else detail += `<b>Tindakan/Part:</b> ${i.part || '-'}<br>`;
    detail += `<b>Harga Jual:</b> Rp ${fA(i.harga)}<br><b>Harga Modal:</b> Rp ${fA(i.modal)}<br><b style="color:var(--accent); font-size:18px;">Keuntungan: Rp ${fA(i.laba)}</b>`;
    
    document.getElementById('modalBodyText').innerHTML = detail;
    document.getElementById('detailModal').style.display = 'flex';
}

function closeModal() { document.getElementById('detailModal').style.display = 'none'; }

function hapusCurrent() {
    if(confirm("Hapus permanen data ini?")) {
        riwayatList = riwayatList.filter(x=>x.id!==currentId);
        localStorage.setItem('bcp_data', JSON.stringify(riwayatList));
        closeModal(); renderHistory();
        showToast("Data Dihapus!");
    }
}

function resetData() {
    if(confirm("PERINGATAN: Semua data akan dihapus permanen! Lanjutkan?")) {
        riwayatList = []; localStorage.removeItem('bcp_data'); renderHistory();
        showToast("Database Dibersihkan!");
    }
}

function backupData() {
    if(riwayatList.length === 0) return showToast("Data masih kosong!");
    const blob = new Blob([JSON.stringify(riwayatList)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'BCP_DATA_MOBILE.json'; a.click();
    showToast("Backup Berhasil Didownload!");
}

function exportLaporan() {
    if(riwayatList.length === 0) return showToast("Data masih kosong!");
    let txt = "LAPORAN KEUANGAN BCP COM\n" + "=".repeat(30) + "\n";
    let total = 0;
    riwayatList.forEach(i => { 
        txt += `${i.tgl} | ${i.unit} | Laba: Rp ${fA(i.laba)}\n`; 
        total += i.laba;
    });
    txt += "=".repeat(30) + "\nTOTAL KEUNTUNGAN: Rp " + fA(total);
    const blob = new Blob([txt], {type: 'text/plain'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Laporan_BCP.txt'; a.click();
    showToast("Laporan Berhasil Didownload!");
}
renderHistory();
// --- LOGIKA EFEK AIR (RIPPLE) ---
document.addEventListener('click', function(e) {
    let btn = e.target.closest('.header-btn, .tab-btn, .btn-green, .history-item');
    if (!btn) return;
    let ink = document.createElement('span');
    ink.className = 'ink';
    let rect = btn.getBoundingClientRect();
    let size = Math.max(rect.width, rect.height);
    ink.style.width = ink.style.height = size + 'px';
    ink.style.left = (e.clientX - rect.left - size/2) + 'px';
    ink.style.top = (e.clientY - rect.top - size/2) + 'px';
    btn.appendChild(ink);
    setTimeout(() => ink.remove(), 600);
});


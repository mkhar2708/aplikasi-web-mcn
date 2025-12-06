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
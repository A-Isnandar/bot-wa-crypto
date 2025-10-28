// utils/db.js (Versi Final - Anti Reassign)
const fs = require('fs');

const DB_FILE = './pantau_db.json'; 

// Objek ini HARUS dijaga referensinya
const pantauJobs = {}; // Tetap pakai const, isinya yg kita ubah

// Fungsi untuk mengosongkan object tanpa ganti referensi
function clearObject(obj) {
    for (const key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) {
            delete obj[key];
        }
    }
}

function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE);
            const loadedData = JSON.parse(data);

            // JANGAN REASSIGN! Kosongkan object yg ada, lalu salin propertinya
            clearObject(pantauJobs); // Kosongkan dulu
            Object.assign(pantauJobs, loadedData); // Salin properti dari data yg di-load

            console.log('Database pemantau berhasil di-load ke object existing.');
        } else {
            // Kalo file ga ada, pastikan object kita kosong
            clearObject(pantauJobs); 
            console.log('Database pemantau baru dibuat (object dikosongkan).');
        }
    } catch (err) {
        console.error('Gagal load DB pemantau:', err);
        // Kalo error, pastikan object kita tetap kosong
        clearObject(pantauJobs);
    }
}

function saveDB() {
    try {
        // Simpan object pantauJobs yang sekarang (yang referensinya sama di mana-mana)
        fs.writeFileSync(DB_FILE, JSON.stringify(pantauJobs, null, 2));
    } catch (err) {
        console.error('Gagal simpen DB pemantau:', err);
    }
}

// Fungsi reset sekarang tinggal panggil clearObject
function resetPantauJobs() {
    clearObject(pantauJobs); // Kosongkan object existing
    saveDB(); // Simpan state kosong
    console.log('Database pemantau telah direset.');
}

module.exports = {
    // Tetap export object pantauJobs (referensinya sekarang konsisten)
    pantauJobs, 
    loadDB,
    saveDB,
    resetPantauJobs 
};
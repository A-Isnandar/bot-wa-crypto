// utils/db.js
const fs = require('fs');

const DB_PANTAU_FILE = './pantau_db.json';
const DB_USER_FILE = './users_db.json';

// Objek database (Reference dijaga tetap, isinya yang berubah)
const pantauJobs = {};
const userWallets = {};

// --- FUNGSI BANTUAN (PENTING BUAT RESET) ---
function clearObject(obj) {
  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      delete obj[key];
    }
  }
}

function loadDB() {
  try {
    // 1. Load Pantau DB
    if (fs.existsSync(DB_PANTAU_FILE)) {
      const data = fs.readFileSync(DB_PANTAU_FILE);
      // Bersihin dulu sebelum diisi (biar bersih)
      clearObject(pantauJobs);
      Object.assign(pantauJobs, JSON.parse(data));
    } else {
      console.log('File DB Pantau belum ada, memulai kosong.');
    }

    // 2. Load User DB
    if (fs.existsSync(DB_USER_FILE)) {
      const userData = fs.readFileSync(DB_USER_FILE);
      // Bersihin dulu sebelum diisi
      clearObject(userWallets);
      Object.assign(userWallets, JSON.parse(userData));
    } else {
      console.log('File DB User belum ada, memulai kosong.');
    }

    console.log('Semua Database berhasil di-load.');
  } catch (err) {
    console.error('Gagal load DB:', err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_PANTAU_FILE, JSON.stringify(pantauJobs, null, 2));
  } catch (err) {
    console.error('Gagal simpen DB Pantau:', err);
  }
}

function saveUserDB() {
  try {
    fs.writeFileSync(DB_USER_FILE, JSON.stringify(userWallets, null, 2));
  } catch (err) {
    console.error('Gagal simpen DB User:', err);
  }
}

// Fungsi reset (Sekarang aman karena clearObject sudah ada)
function resetPantauJobs() {
  clearObject(pantauJobs); // Kosongkan isi object
  saveDB(); // Simpan state kosong ke file
  console.log('Database pemantau telah direset.');
}

module.exports = {
  pantauJobs,
  userWallets,
  loadDB,
  saveDB,
  saveUserDB,
  resetPantauJobs,
};

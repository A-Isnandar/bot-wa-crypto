// index.js (Versi Rombakan Final + Gemini)
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Import modul-modul kita
const db = require('./utils/db');
const { startPantauEngine } = require('./core/monitoringEngine'); // Path ke engine
const { handleTagging } = require('./commands/tagging');
const { handlePriceCheck } = require('./commands/cryptoPrice');
const {
  handlePantau,
  handleStop,
  handleStopAll,
  handleList,
} = require('./commands/priceAlert');
const { handleConversion } = require('./commands/converter');
const { handleMetaInfo } = require('./commands/metaInfo');
// --- (INI DIA TAMBAHAN PENTING) ---
const {
  isUserInGeminiSession,
  handleStartGemini,
  handleStopGemini,
  handleGeminiSession,
} = require('./commands/geminiChat');
// --- (AKHIR TAMBAHAN) ---

console.log('Mencoba menjalankan bot...');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('QR Diterima, silahkan scan:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Bot sudah online dan siap tempur!');

  // Load database & Nyalain Mesin (pass client ke engine)
  db.loadDB();
  startPantauEngine(client); // Kirim instance client ke engine
});

// --- LISTENER UTAMA (Versi Update Gemini) ---
client.on('message', async (message) => {
  if (!message.body || !message.from) return;

  // --- (LOGIKA BARU GEMINI) ---
  // CEK 1: Apakah user ini lagi di sesi Gemini?
  if (isUserInGeminiSession(message.from)) {
    // CEK 1a: Apakah dia mau udahan?
    if (message.body === '!stopmetagpt') {
      handleStopGemini(message);

      // CEK 1b: Apakah dia nyoba pake perintah lain pas lagi sesi?
    } else if (message.body.startsWith('!') || message.body.startsWith('#')) {
      message.reply(
        'Lu lagi di dalem sesi Gemini. Kalo mau pake perintah lain, ketik `!stopmetagpt` dulu ya.'
      );

      // CEK 1c: Kalo bukan, berarti ini chat biasa
    } else {
      handleGeminiSession(message); // Lanjutin obrolan
    }

    return; // PENTING: Stop eksekusi di sini, jangan lanjut ke !cek dll.
  }
  // --- (AKHIR LOGIKA BARU GEMINI) ---

  // Kalo user GAK lagi di sesi, baru cek perintah biasa:
  console.log(`[PESAN MASUK] Dari: ${message.from} | Isi: ${message.body}`);
  const chat = await message.getChat();

  // Cek dulu ini perintah konversi bukan (karena formatnya unik)
  if (
    message.body.startsWith('!') &&
    !isNaN(parseFloat(message.body.substring(1).split(' ')[0]))
  ) {
    if (chat.isGroup) {
      handleConversion(message, client);
    } else {
      // Biarkan saja, atau bisa tambahkan handleConversion untuk PM juga
    }
    return; // Hentikan proses jika ini perintah konversi
  }

  // Logika perintah lain
  if (chat.isGroup) {
    // --- (TAMBAHAN PERINTAH GEMINI) ---
    if (message.body === '!metagpt') {
      handleStartGemini(message);
      // --- (AKHIR TAMBAHAN) ---
    } else if (message.body.startsWith('#')) {
      handleTagging(message, client);
    } else if (message.body.startsWith('!cek ')) {
      handlePriceCheck(message, client);
    } else if (message.body.startsWith('!pantau ')) {
      handlePantau(message, client);
    } else if (message.body.startsWith('!stop ')) {
      handleStop(message, client);
    } else if (message.body === '!stopall') {
      handleStopAll(message, client);
    } else if (message.body === '!list') {
      handleList(message, client);
    } else if (message.body === '!meta') {
      handleMetaInfo(message, client);
    }
    // Tambah 'else if' lain untuk perintah grup baru di sini
  } else {
    // Logika PM

    // --- (TAMBAHAN PERINTAH GEMINI DI PM) ---
    if (message.body === '!metagpt') {
      handleStartGemini(message);
      // --- (AKHIR TAMBAHAN) ---
    } else if (message.body === '!ping') {
      message.reply('Pong!');
    }
    // Tambah perintah PM lain di sini kalo perlu
  }
}); // --- AKHIR DARI LISTENER UTAMA ---

// Mulai koneksi
client.initialize();

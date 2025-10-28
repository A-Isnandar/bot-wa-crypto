// index.js (Versi Rombakan Final)
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
const { handleMetaInfo } = require('./commands/metaInfo'); // <-- BARU

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

// --- LISTENER UTAMA (Jadi Koordinator) ---
client.on('message', async (message) => {
  if (!message.body || !message.from) return;

  const chat = await message.getChat();

  // Cek dulu ini perintah konversi bukan (karena formatnya unik)
  // Pastikan hanya berjalan jika di grup (sesuai logika sebelumnya)
  if (
    message.body.startsWith('!') &&
    !isNaN(parseFloat(message.body.substring(1).split(' ')[0]))
  ) {
    if (chat.isGroup) {
      handleConversion(message, client);
    } else {
      // Mungkin balas kalau konversi hanya di grup? Atau biarkan saja.
    }
    return; // Hentikan proses jika ini perintah konversi
  }

  // Logika perintah lain (hanya jalan di grup)
  if (chat.isGroup) {
    if (message.body.startsWith('#')) {
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
      // --- (BARU) ---
      handleMetaInfo(message, client);
    }
    // Tambah 'else if' lain untuk perintah grup baru di sini
  } else {
    // Logika PM
    if (message.body === '!ping') {
      message.reply('Pong!');
    }
    // Tambah perintah PM lain di sini kalo perlu
  }
}); // --- AKHIR DARI LISTENER UTAMA ---

// Mulai koneksi
client.initialize();

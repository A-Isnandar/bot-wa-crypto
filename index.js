// index.js (Final Routing Fix + Audit + Trading)
require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Import modul-modul kita
const db = require('./utils/db');
const { startPantauEngine } = require('./core/monitoringEngine');
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
const { handleAudit } = require('./commands/audit'); // <--- Audit tetap ada
const {
  isUserInGeminiSession,
  handleStartGemini,
  handleStopGemini,
  handleGeminiSession,
} = require('./commands/geminiChat');
// Import Handler Trading Baru
const {
  handleWallet,
  handleBuy,
  handleBalance,
  handleSell,
} = require('./commands/trading');

console.log('Mencoba menjalankan bot...');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
});

client.on('qr', (qr) => {
  console.log('QR Diterima, silahkan scan:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Bot sudah online dan siap tempur!');
  db.loadDB();
  startPantauEngine(client);
});

// --- LISTENER UTAMA ---
client.on('message', async (message) => {
  if (!message.body || !message.from) return;

  // 1. CEK SESI GEMINI (Prioritas Utama)
  if (isUserInGeminiSession(message.from)) {
    if (message.body === '!stopmetagpt') {
      handleStopGemini(message);
    } else if (message.body.startsWith('!') || message.body.startsWith('#')) {
      message.reply(
        'Lu lagi sesi MetaGPT. Ketik `!stopmetagpt` dulu buat pake perintah lain.'
      );
    } else {
      handleGeminiSession(message);
    }
    return;
  }

  const chat = await message.getChat();

  // 2. CEK KONVERSI (Bisa di Grup & PM)
  if (
    message.body.startsWith('!') &&
    !isNaN(parseFloat(message.body.substring(1).split(' ')[0]))
  ) {
    handleConversion(message, client);
    return;
  }

  // 3. ROUTING BERDASARKAN TIPE CHAT
  if (chat.isGroup) {
    // === PERINTAH KHUSUS GRUP ===
    if (message.body === '!metagpt') handleStartGemini(message);
    else if (message.body.startsWith('#')) handleTagging(message, client);
    else if (message.body.startsWith('!cek '))
      handlePriceCheck(message, client);
    else if (message.body.startsWith('!pantau ')) handlePantau(message, client);
    else if (message.body.startsWith('!stop ')) handleStop(message, client);
    else if (message.body === '!stopall') handleStopAll(message, client);
    else if (message.body === '!list') handleList(message, client);
    else if (message.body === '!meta') handleMetaInfo(message, client);
    else if (
      message.body.startsWith('!audit ') ||
      message.body.startsWith('!rugcheck ')
    ) {
      handleAudit(message, client);
    }

    // !wallet di grup sekarang cuma manggil fungsi (yang akan nolak secara halus)
    else if (message.body === '!wallet') {
      handleWallet(message);
    }

    // Block perintah trading di grup
    else if (
      message.body.startsWith('!buy ') ||
      message.body.startsWith('!sell ') ||
      message.body === '!balance'
    ) {
      message.reply('⚠️ Fitur trading cuma bisa lewat PM (Japri) ke bot ini.');
    }
  } else {
    // === PERINTAH KHUSUS PM (PRIVATE MESSAGE) ===

    if (message.body === '!metagpt') handleStartGemini(message);
    else if (message.body === '!ping') message.reply('Pong!');
    // FITUR TRADING (FULL ACCESS DI PM)
    // Sekarang handler-nya udah pinter, gak perlu logika aneh2 di sini
    else if (message.body === '!wallet') handleWallet(message);
    else if (message.body === '!balance') handleBalance(message);
    else if (message.body.startsWith('!buy ')) handleBuy(message);
    else if (message.body.startsWith('!sell ')) handleSell(message);
  }
});

client.initialize();

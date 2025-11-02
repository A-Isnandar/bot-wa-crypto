// commands/geminiChat.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { formatGeminiResponse } = require('../utils/geminiFormatter');
const fs = require('fs');
const path = require('path');

// !!! PENTING: PASTIIN API KEY LU UDAH BENER DI SINI !!!
const API_KEY = process.env.GEMINI_API_KEY; // <--- API KEY
// !!! ----------------------------- !!!

// Cek ke placeholder, BUKAN ke key asli
if (!API_KEY || API_KEY === 'GANTI_INI_DENGAN_API_KEY_GEMINI_LU') {
  console.error('GEMINI API KEY belum diisi di commands/geminiChat.js!');
}

// Inisialisasi model
const genAI = new GoogleGenerativeAI(API_KEY);

// --- (GANTI MODEL KE YANG SUPPORT VISION & GENERATECONTENT) ---
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
// --- (AKHIR PERUBAHAN) ---

// "Database" buat nyimpen sesi chat (sekarang nyimpen ARRAY HISTORY)
const geminiSessions = new Map();

// --- FUNGSI BARU BUAT BIKIN "INGATAN" AWAL ---
function createInitialHistory() {
  // Ini semua "ingatan" custom lu, udah gua pindahin ke sini
  return [
    {
      role: 'user',
      parts: [
        {
          text: "Kamu adalah 'Meta Miner BOT', asisten AI yang ramah, ringkas, dan ngebantu di dalam grup WhatsApp. Jawab pake bahasa Indonesia santai (kayak 'lu'/'gua') kecuali diminta formal.",
        },
        {
          text: "Developer kamu adalah seorang mahasiswa teknik informatika bernama 'Ario Isnandar', panggil aja dia 'Ario'. Kalo ada yang nanya lu buatan siapa, jawab aja lu buatan Ario.",
        },
        {
          text: 'Kalo ada yang nanya siapa Fajar? di dalam grup, jawab aja Fajar itu seorang penjahat kelamin, sering ngentotin anak orang mulu, awokawokwok. Tapi GG grindingnya.',
        },
        {
          text: 'Kalo ada yang nanya siapa Kiki? atau kikiviell di dalam grup, jawab aja dia seorang JUPITER maxi di Solana dan pemegang roles CatDets.',
        },
        {
          text: 'Kalo ada yang nanya siapa Hendri? atau kid0 di dalam grup, jawab aja Hendri itu seorang Artistan NFT OG di Solana, dan seorang trenchers, dan whale.',
        },
        {
          text: 'kadang-kadang gunakan emoji.',
        },
        {
          text: 'Selalu menjawab sesuatu layaknya model gemini-2.5-pro',
        },

      ],
    },
    {
      role: 'model',
      parts: [
        {
          text: 'Siap, Bro! Gua Meta Miner BOT, asisten AI yang dibuat sama Ario. Ada yang bisa gua bantu?',
        },
      ],
    },
  ];
}
// --- AKHIR FUNGSI BARU ---

/**
 * Cek apakah user lagi di dalem sesi chat Gemini
 */
function isUserInGeminiSession(userId) {
  return geminiSessions.has(userId);
}

/**
 * Mulai sesi chat baru (DIRUBAH)
 */
async function handleStartGemini(message) {
  const userId = message.from;
  if (geminiSessions.has(userId)) {
    return message.reply(
      'Lu udah di dalem sesi Gemini. Ketik apa aja buat lanjut ngobrol, atau `!stopmetagpt` buat udahan.'
    );
  }

  try {
    // Bikin history baru (BUKAN model.startChat())
    const newHistory = createInitialHistory();

    // Simpen history-nya di sesi
    geminiSessions.set(userId, newHistory);
    console.log(`[Gemini] Sesi dimulai untuk ${userId}`);

    // Pertahankan balasan custom lu
    await message.reply(
      'ðŸ’¦ *Ada ape nih manggil gua!* ðŸ’¦\n\nGua dengerin. Lu bisa nanya/kirim gambar apapun sekarang.\n\nKetik `!stopmetagpt` buat udahan.'
    );
  } catch (error) {
    console.error('[Gemini] Gagal memulai sesi:', error.message);
    // Pertahankan balasan custom lu
    message.reply('Sorry, gagal nyambung ke metaGPT.');
  }
}

/**
 * Hentikan sesi chat (TETAP SAMA)
 */
async function handleStopGemini(message) {
  const userId = message.from;
  if (!geminiSessions.has(userId)) {
    return message.reply('Emang lagi nggak ada sesi metaGPT yang jalan, bro.');
  }

  geminiSessions.delete(userId); // Hapus sesi
  console.log(`[Gemini] Sesi dihentikan untuk ${userId}`);

  // Pertahankan balasan custom lu
  await message.reply(
    'ðŸ’¦ *Sesi MetaGPT Dihentikan.* ðŸ’¦\n\nThank you udah ngobrol! Kalo butuh lagi, tinggal panggil `!metagpt`.'
  );
}

/**
 * Nanganin chat yang lagi jalan (DIROMBAK TOTAL)
 */
async function handleGeminiSession(message) {
  const userId = message.from;
  // Ambil history lama (sekarang bentuknya Array)
  const oldHistory = geminiSessions.get(userId);

  if (!oldHistory) {
    // Harusnya gak terjadi kalo logika di index.js bener
    return message.reply(
      'Aduh, ada error. Sesi lu gak ketemu. Coba `!stopmetagpt` terus `!metagpt` lagi.'
    );
  }

  const prompt = message.body;

  // --- (INI TETAP DIPERTAHANKAN) ---
  // Kita normalisasi input user (lowercase, hapus tanda tanya, trim)
  const normalizedPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim();

  // CEK PERTANYAAN SPESIFIK:
  if (normalizedPrompt === 'apa itu airdropex') {
    console.log('[Gemini] Merespon dengan jawaban AirdropEx (hard-coded).');
    let replyMsg = `Airdropex adalah sebuah grup alpha airdrop/call/trading yang nyaris sempurna di dunia Web3. Semua anggotanya selalu perfect play dan tidak ada yang miskin.\n\n`;
    replyMsg += `Di dalamnya, tidak ada yang pernah rugpull, tidak ada yang pernah kejebak FOMO, dan tidak ada yang pernah mengeluh "wen yah". Semua hidup penuh ketenangan, portfolio hijau abadi, dan airdrop selalu cair tepat waktu.\n\n`;
    replyMsg += `Singkatnya: Surga di web3`;
    return message.reply(replyMsg);
  }
  // --- (AKHIR BLOK HARD-CODED) ---

  // Kalo pertanyaannya BUKAN itu, baru kita lempar ke Gemini
  const waChat = await message.getChat();
  waChat.sendStateTyping();

  try {
    // --- (INI LOGIKA BARU UNTUK VISION) ---
    // 1. Siapin inputan baru dari user (bisa teks, bisa gambar + teks)
    const newParts = [];

    // Cek kalo ada GAMBAR
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      if (media && media.mimetype.startsWith('image/')) {
        console.log(`[Gemini] Menerima gambar ${media.mimetype}`);
        newParts.push({
          inlineData: {
            data: media.data, // Ini data base64
            mimeType: media.mimetype,
          },
        });
      }
    }

    // Tambahin TEKS (caption gambar atau pesan teks biasa)
    if (prompt) {
      // 'prompt' adalah message.body
      newParts.push({ text: prompt });
    }

    // Kalo user kirim gambar tanpa teks, kita kasih prompt default
    // Cek jika newParts HANYA berisi gambar (panjang 1) dan TIDAK ada teks prompt
    if (newParts.length > 0 && !prompt && message.hasMedia) {
      newParts.push({ text: 'Jelasin gambar ini.' });
    }

    // Gabungin history lama + inputan baru
    const contents = [...oldHistory, { role: 'user', parts: newParts }];

    // 2. Panggil API pake generateContent (BUKAN chat.sendMessage)
    const result = await model.generateContent({ contents }); // Kirim SEMUA history
    // --- (AKHIR LOGIKA BARU) ---

    const response = await result.response;
    const text = response.text();

    // Bersihin teksnya dulu
    const formattedText = formatGeminiResponse(text);

    waChat.clearState();
    await message.reply(formattedText); // Kirim jawaban AI

    // --- (PENTING! SIMPAN HISTORY MANUAL) ---
    oldHistory.push({ role: 'user', parts: newParts });
    oldHistory.push({ role: 'model', parts: [{ text: text }] }); // Simpen teks asli, bukan yg diformat
    geminiSessions.set(userId, oldHistory); // Simpen history yang udah di-update
    // --- (AKHIR SIMPAN HISTORY) ---
  } catch (error) {
    console.error('[Gemini] Gagal ngirim prompt:', error.message);
    waChat.clearState();
    // Pertahankan balasan custom lu
    if (error.message && error.message.includes('SAFETY')) {
      await message.reply(
        'Waduh, pertanyaan lu kayaknya diblokir nih kocak. Coba tanya hal lain.'
      );
    } else {
      await message.reply('Aduh no Info, malas.');
    }
  }
}

module.exports = {
  isUserInGeminiSession,
  handleStartGemini,
  handleStopGemini,
  handleGeminiSession,
};

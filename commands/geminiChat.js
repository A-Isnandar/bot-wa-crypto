// commands/geminiChat.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { formatGeminiResponse } = require('../utils/geminiFormatter');

// !!! PENTING: PASTIIN API KEY LU UDAH BENER DI SINI !!!
const API_KEY = process.env.GEMINI_API_KEY; // <--- API KEY
// !!! ----------------------------- !!!

// Cek ke placeholder, BUKAN ke key asli
if (!API_KEY || API_KEY === 'GANTI_INI_DENGAN_API_KEY_GEMINI_LU') {
  console.error('GEMINI API KEY belum diisi di commands/geminiChat.js!');
}

// Inisialisasi model
const genAI = new GoogleGenerativeAI(API_KEY);

// --- (INI PERBAIKAN ERROR 404) ---
// Ganti ke model 'gemini-1.5-flash-latest' yang paling up-to-date
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
// --- (AKHIR PERBAIKAN) ---

// "Database" buat nyimpen sesi chat (Pakai Map biar efisien)
const geminiSessions = new Map();

/**
 * Cek apakah user lagi di dalem sesi chat Gemini
 */
function isUserInGeminiSession(userId) {
  return geminiSessions.has(userId);
}

/**
 * Mulai sesi chat baru
 */
async function handleStartGemini(message) {
  const userId = message.from;
  if (geminiSessions.has(userId)) {
    return message.reply(
      'Lu udah di dalem sesi Gemini. Ketik apa aja buat lanjut ngobrol, atau `!stopmetagpt` buat udahan.'
    );
  }

  try {
    // Bikin history chat baru
    const chat = model.startChat({
      history: [
        // (Opsional) Kasih 'contekan' buat AI-nya
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
      ],
      generationConfig: {
        maxOutputTokens: 4096, // Batasi jawaban biar gak kepanjangan
      },
    });

    // Simpen sesi user
    geminiSessions.set(userId, chat);
    console.log(`[Gemini] Sesi dimulai untuk ${userId}`);
    await message.reply(
      '💦 *Ada ape nih manggil gua!* 💦\n\nGua dengerin. Lu bisa langsung nanya apa aja sekarang.\n\nKetik `!stopmetagpt` buat udahan.'
    );
  } catch (error) {
    console.error('[Gemini] Gagal memulai sesi:', error.message);
    message.reply('Sorry, gagal nyambung ke metaGPT.');
  }
}

/**
 * Hentikan sesi chat
 */
async function handleStopGemini(message) {
  const userId = message.from;
  if (!geminiSessions.has(userId)) {
    return message.reply('Emang lagi nggak ada sesi metaGPT yang jalan, bro.');
  }

  geminiSessions.delete(userId); // Hapus sesi
  console.log(`[Gemini] Sesi dihentikan untuk ${userId}`);
  await message.reply(
    '💦 *Sesi MetaGPT Dihentikan.* 💦\n\nThank you udah ngobrol! Kalo butuh lagi, tinggal panggil `!metagpt`.'
  );
}

/**
 * Nanganin chat yang lagi jalan
 */
async function handleGeminiSession(message) {
  const userId = message.from;
  const chat = geminiSessions.get(userId);

  if (!chat) {
    // Harusnya gak terjadi kalo logika di index.js bener
    return message.reply(
      'Aduh, ada error. Sesi lu gak ketemu. Coba `!stopmetagpt` terus `!metagpt` lagi.'
    );
  }

  const prompt = message.body;

  // --- (INI DIA PERUBAHANNYA) ---
  // Kita normalisasi input user (lowercase, hapus tanda tanya, trim)
  const normalizedPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim();

  // CEK PERTANYAAN SPESIFIK:
  if (normalizedPrompt === 'apa itu airdropex') {
    console.log('[Gemini] Merespon dengan jawaban AirdropEx (hard-coded).');

    // Siapkan jawaban verbatim (kata per kata)
    let replyMsg = `Airdropex adalah sebuah grup alpha airdrop/call/trading yang nyaris sempurna di dunia Web3. Semua anggotanya selalu perfect play dan tidak ada yang miskin.\n\n`;
    replyMsg += `Di dalamnya, tidak ada yang pernah rugpull, tidak ada yang pernah kejebak FOMO, dan tidak ada yang pernah mengeluh “wen yah”. Semua hidup penuh ketenangan, portfolio hijau abadi, dan airdrop selalu cair tepat waktu.\n\n`;
    replyMsg += `Singkatnya: Surga di web3`;

    // Langsung kirim balasan & stop (return)
    return message.reply(replyMsg);
  }
  // --- (AKHIR PERUBAHAN) ---

  // Kalo pertanyaannya BUKAN itu, baru kita lempar ke Gemini
  const waChat = await message.getChat();
  waChat.sendStateTyping();

  try {
    const result = await chat.sendMessage(prompt); // Kirim ke AI
    const response = await result.response;
    const text = response.text();

    // Bersihin teksnya dulu
    const formattedText = formatGeminiResponse(text);

    waChat.clearState();
    await message.reply(formattedText); // Kirim jawaban AI
  } catch (error) {
    console.error('[Gemini] Gagal ngirim prompt:', error.message);
    waChat.clearState();
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

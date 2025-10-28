// commands/priceAlert.js
const axios = require('axios');
const db = require('../utils/db'); // Import database

async function handlePantau(message, client) {
  try {
    console.log('[CommandHandler] Menjalankan perintah !pantau');
    const args = message.body.split(' ');

    if (args.length !== 3) {
      return message.reply(
        'Format salah 😭­.\nContoh: `!pantau sol ALAMAT_TOKEN`'
      );
    }

    const chain = args[1].toLowerCase();
    const tokenAddress = args[2];
    const chatId = message.from;

    // Akses object pantauJobs dari db
    if (db.pantauJobs[tokenAddress]) {
      return message.reply(
        `Token \`${tokenAddress}\` udah dipantau di grup ini.`
      );
    }

    await message.reply(
      `💦 Mencari info token \`${tokenAddress}\` di chain \`${chain}\`...`
    );

    const searchUrl = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
    const response = await axios.get(searchUrl);

    if (!response.data.pairs || response.data.pairs.length === 0) {
      return message.reply(
        'Gak nemu pair buat token itu. Cek lagi alamatnya 😭­.'
      );
    }

    const validPairs = response.data.pairs.filter((p) => p.chainId === chain);
    if (validPairs.length === 0) {
      return message.reply(
        `Gak nemu pair di chain \`${chain}\`. Coba cek chain lain (cth: eth, bsc) 😭­.`
      );
    }

    const pair = validPairs.sort(
      (a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0)
    )[0];

    const startMcap = parseFloat(pair.marketCap);
    if (!startMcap || startMcap === 0) {
      return message.reply(
        'Gak bisa dapet Market Cap (mungkin token baru/terlalu kecil). Gagal memantau 😭­.'
      );
    }

    const stepSize = startMcap * 0.1;

    // Modifikasi object pantauJobs dari db
    db.pantauJobs[tokenAddress] = {
      chatId: chatId,
      pairAddress: pair.pairAddress,
      tokenAddress: tokenAddress,
      tokenName: pair.baseToken.name,
      tokenSymbol: pair.baseToken.symbol,
      chain: chain,
      stepSize: stepSize,
      lastAlertedMcap: startMcap,
      startPriceUsd: parseFloat(pair.priceUsd),
    };

    db.saveDB(); // Panggil fungsi saveDB dari db

    message.reply(`🟢 *Pemantauan Dimulai!*

Token: *${pair.baseToken.name} (${pair.baseToken.symbol})*
Chain: \`${chain}\`
Pair: \`${pair.pairAddress}\`
MCap Awal: *$${startMcap.toLocaleString('en-US')}*
Harga Awal: *$${pair.priceUsd}*

Meta akan kirim notif setiap MCAP naik/turun *10%* dari pantauan terakhir (step: *$${stepSize.toLocaleString(
      'en-US'
    )}*).`);
  } catch (error) {
    console.error('[CommandHandler] Error di handlePantau:', error.message);
    message.reply('Aduh, error pas nyari data di DexScreener.');
  }
}

async function handleStop(message, client) {
  try {
    console.log('[CommandHandler] Menjalankan perintah !stop');
    const args = message.body.split(' ');

    if (args.length !== 2) {
      return message.reply('Format salah 😭­.\nContoh: `!stop ALAMAT_TOKEN`');
    }

    const tokenAddress = args[1];

    // Akses object pantauJobs dari db
    if (db.pantauJobs[tokenAddress]) {
      const jobName = db.pantauJobs[tokenAddress].tokenSymbol;
      delete db.pantauJobs[tokenAddress]; // Hapus dari object db
      db.saveDB(); // Simpan perubahan
      message.reply(
        `🔴 *Pemantauan Dihentikan* untuk ${jobName} (\`${tokenAddress}\`).`
      );
    } else {
      message.reply('Token itu emang nggak lagi dipantau.');
    }
  } catch (error) {
    console.error('[CommandHandler] Error di handleStop:', error.message);
    message.reply('Aduh, error pas menghentikan pantauan.');
  }
}

async function handleStopAll(message, client) {
  try {
    console.log('[CommandHandler] Menjalankan perintah !stopall');

    // Cek object pantauJobs dari db
    if (Object.keys(db.pantauJobs).length === 0) {
      return message.reply('Memang nggak ada token yang lagi dipantau.');
    }

    // Panggil fungsi reset dari db.js
    db.resetPantauJobs();

    message.reply(
      '🔴 *SEMUA Pemantauan Dihentikan!* Database pantauan sudah dikosongkan.'
    );
  } catch (error) {
    console.error('[CommandHandler] Error di handleStopAll:', error.message);
    message.reply('Aduh, error pas menghentikan semua pantauan.');
  }
}

async function handleList(message, client) {
  try {
    console.log('[CommandHandler] Menjalankan perintah !list');
    // Akses object pantauJobs dari db
    const jobKeys = Object.keys(db.pantauJobs);

    if (jobKeys.length === 0) {
      return message.reply('Belum ada token yang lagi dipantau.');
    }

    let replyMsg = `📝 *Daftar Token Dipantau (${jobKeys.length}):*\n\n`;

    jobKeys.forEach((tokenAddress, index) => {
      const job = db.pantauJobs[tokenAddress];
      replyMsg += `${index + 1}. *${job.tokenSymbol}* (${job.tokenName})\n`;
      replyMsg += `   Chain: \`${job.chain}\`\n`;
      replyMsg += `   Alamat: \`${job.tokenAddress}\`\n`;
      replyMsg += `\n`;
    });

    message.reply(replyMsg);
  } catch (error) {
    console.error('[CommandHandler] Error di handleList:', error.message);
    message.reply('Aduh, error pas menampilkan daftar pantauan.');
  }
}

module.exports = {
  handlePantau,
  handleStop,
  handleStopAll,
  handleList,
};

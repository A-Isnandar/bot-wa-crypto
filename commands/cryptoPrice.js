// commands/cryptoPrice.js
const axios = require('axios');
const { formatCurrency } = require('../utils/formatters'); // Import helper

async function handlePriceCheck(message, client) {
  try {
    console.log('[CommandHandler] Menjalankan perintah !cek crypto');
    const query = message.body.split(' ')[1]?.toLowerCase().trim();

    if (!query) {
      return message.reply(
        'Mau cek koin apa? \nContoh: `!cek bitcoin` atau `!cek arb`'
      );
    }

    const searchResponse = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${query}`
    );

    if (!searchResponse.data.coins || searchResponse.data.coins.length === 0) {
      return message.reply(
        `Damn, gak nemu koin yang namanya mirip *'${query}'* 😭­.`
      );
    }

    const coinId = searchResponse.data.coins[0].id;
    const coinName = searchResponse.data.coins[0].name;
    const priceResponse = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,idr&include_24hr_change=true`
    );

    if (priceResponse.data[coinId]) {
      const priceUSD = priceResponse.data[coinId].usd;
      const priceIDR = priceResponse.data[coinId].idr;
      const change24h = priceResponse.data[coinId].usd_24h_change;

      const formatIDR = formatCurrency(priceIDR, 'idr');
      const formatUSD = formatCurrency(priceUSD, 'usd');

      const changeEmoji = change24h > 0 ? '🟢' : '🔴';
      const changePercent = change24h.toFixed(2);

      let replyMsg = `💦 *Update Harga ${coinName} (${query.toUpperCase()})* Now💦\n\n`;
      replyMsg += `USD: *${formatUSD}*\n`;
      replyMsg += `IDR: *${formatIDR}*\n`;
      replyMsg += `24j: *${changePercent}%* ${changeEmoji}`;

      message.reply(replyMsg);
    } else {
      message.reply(`Gak nemu harga buat koin *'${query}'* 😭­.`);
    }
  } catch (error) {
    console.error('[CommandHandler] Error di handlePriceCheck:', error.message);
    message.reply(
      'Damn, lagi ada masalah ngambil data ke CoinGecko. Coba bentar lagi.'
    );
  }
}

module.exports = { handlePriceCheck };

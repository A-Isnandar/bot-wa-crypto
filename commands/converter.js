// commands/converter.js
const axios = require('axios');
const { formatCurrency } = require('../utils/formatters'); // Import helper

async function handleConversion(message, client) {
  try {
    console.log('[CommandHandler] Menjalankan perintah konversi');
    const parts = message.body.substring(1).split(' ');

    const amount = parseFloat(parts[0]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply('Jumlah harus angka positif, bro.');
    }

    const coinA_input = parts[1]?.toLowerCase();
    if (!coinA_input) {
      return message.reply(
        'Format salah. Contoh: `!1 eth to idr` atau `!0.2 sol`'
      );
    }

    const toIndex = parts.indexOf('to');
    let coinB_input = null;
    let targetCurrencies = 'usd';

    if (toIndex > 1 && parts.length > toIndex + 1) {
      coinB_input = parts[toIndex + 1].toLowerCase();
      targetCurrencies = `${coinB_input},usd`;
    } else if (toIndex !== -1) {
      return message.reply('Format salah. Contoh: `!1 eth to idr`');
    }

    const coinMap = {
      btc: 'bitcoin',
      eth: 'ethereum',
      sol: 'solana',
      bnb: 'binancecoin',
      usdc: 'usd-coin',
      usdt: 'tether',
      idr: 'idr',
      usd: 'usd',
    };

    const coinA_id = coinMap[coinA_input] || coinA_input;
    let coinA_name = coinA_id.charAt(0).toUpperCase() + coinA_id.slice(1); // Default name
    let coinA_symbol = coinA_input; // Default symbol

    const apiURL = `https://api.coingecko.com/api/v3/simple/price?ids=${coinA_id}&vs_currencies=${targetCurrencies}`;
    let response;
    let coinData;

    try {
      response = await axios.get(apiURL);
      if (!response.data || !response.data[coinA_id]) {
        throw new Error('Coin A not found directly'); // Pindah ke blok catch
      }
      coinData = response.data[coinA_id];
    } catch (initialError) {
      // Coba cari pake search jika gagal
      console.log(
        `[Converter] Coin ${coinA_id} tidak ditemukan langsung, mencoba search...`
      );
      const searchResponse = await axios.get(
        `https://api.coingecko.com/api/v3/search?query=${coinA_input}`
      );
      if (
        !searchResponse.data.coins ||
        searchResponse.data.coins.length === 0
      ) {
        return message.reply(`Gak nemu koin/mata uang '${coinA_input}' 😭­.`);
      }

      const foundCoin = searchResponse.data.coins[0];
      const foundCoinId = foundCoin.id;
      coinA_name = foundCoin.name; // Update nama dari hasil search
      coinA_symbol = foundCoin.symbol.toLowerCase(); // Update symbol

      const retryURL = `https://api.coingecko.com/api/v3/simple/price?ids=${foundCoinId}&vs_currencies=${targetCurrencies}`;
      const retryResponse = await axios.get(retryURL);

      if (!retryResponse.data || !retryResponse.data[foundCoinId]) {
        return message.reply(
          `Gak nemu harga konversi buat '${coinA_input}' (${coinA_name}) 😭­.`
        );
      }
      coinData = retryResponse.data[foundCoinId];
    }

    // Hitung hasil konversi
    const valueUSD = coinData.usd * amount;
    let replyMsg = `${amount} ${coinA_name} (${coinA_symbol}):\n`;
    replyMsg += `${formatCurrency(valueUSD, 'usd')}`; // Tidak perlu tambah 'usd' lagi

    if (coinB_input) {
      const coinB_id = coinMap[coinB_input] || coinB_input;
      // Pastikan target B ada di data balikan
      if (coinData[coinB_id] !== undefined) {
        const valueCoinB = coinData[coinB_id] * amount;
        replyMsg += `\n${formatCurrency(valueCoinB, coinB_id)}`; // Tidak perlu tambah ID lagi
      } else {
        replyMsg += `\n(Gagal konversi ke ${coinB_input})`;
      }
    }
    message.reply(replyMsg);
  } catch (error) {
    console.error('[CommandHandler] Error di handleConversion:', error.message);
    if (error.response && error.response.data && error.response.data.error) {
      message.reply(`Error dari CoinGecko: ${error.response.data.error}`);
    } else {
      message.reply(
        'Aduh, error pas ngitung konversi. Coba cek format/nama koin.'
      );
    }
  }
}

module.exports = { handleConversion };

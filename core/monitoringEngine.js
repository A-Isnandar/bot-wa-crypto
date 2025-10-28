// core/monitoringEngine.js
const axios = require('axios');
const db = require('../utils/db'); // Import database

const PANTAU_INTERVAL = 20000;
let whatsappClient = null; // Variabel buat nyimpen client

async function checkAlerts() {
  const jobKeys = Object.keys(db.pantauJobs); // Akses dari db
  if (jobKeys.length === 0) {
    return;
  }

  console.log(
    `[Pantau Engine] Menjalankan pengecekan untuk ${jobKeys.length} token...`
  );

  for (const tokenAddress of jobKeys) {
    try {
      const job = db.pantauJobs[tokenAddress]; // Akses dari db
      if (!job) continue;

      const url = `https://api.dexscreener.com/latest/dex/pairs/${job.chain}/${job.pairAddress}`;
      const response = await axios.get(url);

      if (!response.data || !response.data.pair) {
        console.warn(
          `[Pantau Engine] Data pair tidak valid dari API untuk ${job.tokenSymbol}. Skipping.`
        );
        continue;
      }

      const pairData = response.data.pair;
      const currentMcap = parseFloat(pairData.marketCap);
      const currentPriceUsd = parseFloat(pairData.priceUsd);

      if (!currentMcap || isNaN(currentMcap) || isNaN(currentPriceUsd)) {
        console.warn(
          `[Pantau Engine] Data MCap/Harga tidak valid untuk ${job.tokenSymbol}. Skipping.`
        );
        continue;
      }

      const mcapDifference = currentMcap - job.lastAlertedMcap;

      if (Math.abs(mcapDifference) >= job.stepSize) {
        const trend = mcapDifference > 0 ? '🟢 NAIK' : '🔴 TURUN';
        const percentChangeFromStart =
          ((currentPriceUsd - job.startPriceUsd) / job.startPriceUsd) * 100;

        let notifMsg = `💦 *HARGA* ${job.tokenSymbol} ${trend} 💦\n\n`;
        notifMsg += `Harga: *$${currentPriceUsd}*\n`;
        notifMsg += `MCap: *$${currentMcap.toLocaleString('en-US')}*\n\n`;
        notifMsg += `(Perubahan >10% dari pantauan terakhir. Total: *${percentChangeFromStart.toFixed(
          2
        )}%* dari awal)\n`;
        notifMsg += `Chart: \`https://dexscreener.com/${job.chain}/${job.pairAddress}\``;

        if (whatsappClient && whatsappClient.info) {
          await whatsappClient.sendMessage(job.chatId, notifMsg);
        } else {
          console.log('[Pantau Engine] Client belum siap, notif ditunda.');
        }

        // Update MCap terakhir di object db
        db.pantauJobs[tokenAddress].lastAlertedMcap = currentMcap;
        db.saveDB(); // Simpan perubahan
      }
    } catch (jobError) {
      console.error(
        `[Pantau Engine] Gagal memproses job ${tokenAddress}:`,
        jobError.message
      );
      // Jika error 404 (pair mati), mungkin bagusnya dihapus dari pantauan? (Opsional)
      if (jobError.response && jobError.response.status === 404) {
        console.warn(
          `[Pantau Engine] Pair ${pantauJobs[tokenAddress]?.pairAddress} sepertinya sudah tidak ada (404). Menghapus dari pantauan.`
        );
        delete db.pantauJobs[tokenAddress];
        db.saveDB();
      }
    }
  }
}

// Terima client sebagai argumen
function startPantauEngine(clientInstance) {
  whatsappClient = clientInstance; // Simpen client-nya
  console.log('Mesin Pemantau (Polling Engine) dinyalakan.');
  console.log(`Akan mengecek harga setiap ${PANTAU_INTERVAL / 1000} detik.`);
  checkAlerts();
  setInterval(checkAlerts, PANTAU_INTERVAL);
}

module.exports = { startPantauEngine }; // Hanya export fungsi start

// commands/metaInfo.js

async function handleMetaInfo(message, client) {
  try {
    console.log('[CommandHandler] Menjalankan Commands !meta');

    // Susun pesan informasinya (Versi Rapi)
    let replyMsg = `*💦 What's Up mate! Gua Meta Miner versi BOT! 💦*\n\n`;
    replyMsg += `Gua di sini buat bantu kalian semua langsung dari WhatsApp!\n\n`;
    replyMsg += `*Commands:*\n\n`;

    replyMsg += `*1. Tag Semua Anggota (Silent)*\n`;
    replyMsg += `   Commands: \`#A <teks_pesan>\`\n`;
    replyMsg += `   Contoh: \`#A info alpha\`\n`;
    replyMsg += `   Fungsi: Ngirim pesan sambil nge-tag semua anggota diem-diem. Pake buat pengumuman penting.\n\n`;

    replyMsg += `*2. Cek Harga Koin*\n`;
    replyMsg += `   Commands: \`!cek <nama_koin/simbol>\`\n`;
    replyMsg += `   Contoh: \`!cek btc\`, \`!cek solana\`\n`;
    replyMsg += `   Fungsi: Info harga real-time (USD, IDR, 24j %).\n\n`;

    replyMsg += `*3. Cek Nilai Koin (ke USD)*\n`;
    replyMsg += `   Commands: \`!<jumlah> <koin>\`\n`;
    replyMsg += `   Contoh: \`!0.5 eth\`, \`!100 usdc\`\n`;
    replyMsg += `   Fungsi: Konversi nilai jumlah koin ke USD.\n\n`;

    replyMsg += `*4. Konversi Koin/Fiat*\n`;
    replyMsg += `   Commands: \`!<jumlah> <koinA> to <koinB/fiat>\`\n`;
    replyMsg += `   Contoh: \`!1 btc to idr\`, \`!50 usdt to sol\`\n`;
    replyMsg += `   Fungsi: Konversi nilai koin A ke koin B/fiat (plus nilai USD).\n\n`;

    replyMsg += `*5. Pantau Harga DEX*\n`;
    replyMsg += `   Commands: \`!pantau <chain> <alamat_token>\`\n`;
    replyMsg += `   Contoh: \`!pantau sol ALAMAT_TOKEN_SOL\`\n`;
    replyMsg += `   Fungsi: *Andalan!* Mantau MCap token di DEX. Kirim notif tiap harga naik/turun *10%* dari notif terakhir. Bantu strategi *DCA* atau biar gak ketinggalan momen tanpa harus mantengin chart terus!\n\n`;

    replyMsg += `*6. Lihat Daftar Pantauan*\n`;
    replyMsg += `   Commands: \`!list\`\n`;
    replyMsg += `   Fungsi: Nampilin semua token yang lagi dipantau.\n\n`;

    replyMsg += `*7. Stop Pantau Satu Token*\n`;
    replyMsg += `   Commands: \`!stop <alamat_token>\`\n`;
    replyMsg += `   Fungsi: Berhentiin pantauan buat token spesifik.\n\n`;

    replyMsg += `*8. Stop Semua Pantauan*\n`;
    replyMsg += `   Commands: \`!stopall\`\n`;
    replyMsg += `   Fungsi: Berhentiin semua pantauan token.\n\n`;

    replyMsg += `*Gunakan gua dengan bijak & always DYOR!* 💦`;

    // Kirim balasan
    message.reply(replyMsg);
  } catch (error) {
    console.error('[CommandHandler] Error di handleMetaInfo:', error.message);
    message.reply('Aduh, error pas mau nampilin info bot.');
  }
}

module.exports = { handleMetaInfo };

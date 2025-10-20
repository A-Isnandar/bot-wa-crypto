// index.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios'); // Pastikan ini ada di atas

console.log("Mencoba menjalankan bot...");

const client = new Client({
    authStrategy: new LocalAuth(),
    // Opsi tambahan, kadang ngebantu
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    console.log('QR Diterima, silahkan scan:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot sudah online dan siap tempur!');
});

// --- HANYA SATU LISTENER UTAMA UNTUK SEMUA PESAN ---
client.on('message', async (message) => {
    // Jangan proses pesan dari status atau pesan yg gak jelas
    if (!message.body || !message.from) return; 

    console.log(`[PESAN MASUK] Dari: ${message.from} | Isi: ${message.body}`);
    const chat = await message.getChat();

    // --- Logika untuk GRUP ---
    if (chat.isGroup) {
        
        // FITUR 1: Tag "Silent" (Trigger '#<perintah> <teks>')
        if (message.body.startsWith('#')) {
            console.log('Menjalankan perintah Tag #');
            
            // Cari spasi pertama
            const firstSpaceIndex = message.body.indexOf(' ');

            // Kalo gak ada spasi (cth: "#doang"), kita abaikan
            if (firstSpaceIndex === -1) {
                 console.log('Perintah # dibatalkan, format salah (harus ada spasi).');
                 return; // Batal
            }

            // 1. Ambil text SETELAH spasi pertama
            const textToSend = message.body.substring(firstSpaceIndex + 1).trim(); 
            
            // Kalo gak ada teks setelah spasi, batalin
            if (textToSend.length === 0) {
                console.log('Perintah # dibatalkan, tidak ada teks setelah spasi.');
                return; // Batal
            }

            let mentions = [];
            
            // 2. Kumpulin semua anggota grup
            for (let participant of chat.participants) {
                mentions.push(participant.id._serialized);
            }

            // 3. Kirim ulang pesan user (HANYA TEKSNYA) DENGAN mentions
            await chat.sendMessage(textToSend, { mentions });

            // 4. React ke pesan asli user dengan emoji '💦' (air)
            try {
                await message.react('💦'); // Ganti emoji
            } catch (e) {
                console.log('Gagal react, mungkin nomor bot-nya kena limit.');
            }
            
            console.log('Berhasil tag silent!');
        
        // FITUR 2: Cek Harga Crypto (Perintah '!cek')
        } else if (message.body.startsWith('!cek ')) {
            console.log('Menjalankan perintah !cek crypto');
            
            const query = message.body.split(' ')[1]?.toLowerCase().trim();
            
            if (!query) {
                message.reply('Mau cek koin apa? \nContoh: `!cek bitcoin` atau `!cek arb`');
                return; // Stop
            }

            try {
                // --- (PERBAIKAN URL DI SINI) ---
                // STEP A: Cari ID Koinnya dulu
                const searchResponse = await axios.get(`https://api.coingecko.com/api/v3/search?query=${query}`);
                
                if (!searchResponse.data.coins || searchResponse.data.coins.length === 0) {
                    message.reply(`Gak nemu koin yang namanya mirip *'${query}'* 😭.`);
                    return; // Stop
                }

                const coinId = searchResponse.data.coins[0].id;
                const coinName = searchResponse.data.coins[0].name;

                // --- (PERBAIKAN URL DI SINI) ---
                // STEP B: Ambil Harganya pakai ID
                const priceResponse = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,idr&include_24hr_change=true`);
                
                if (priceResponse.data[coinId]) {
                    const priceUSD = priceResponse.data[coinId].usd;
                    const priceIDR = priceResponse.data[coinId].idr;
                    const change24h = priceResponse.data[coinId].usd_24h_change;

                    // Format angka, izinkan sampai 10 angka desimal
                    const formatIDR = new Intl.NumberFormat('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR',
                        maximumFractionDigits: 10 // Izinkan lebih banyak desimal
                    }).format(priceIDR);
                    
                    const formatUSD = new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: 'USD',
                        maximumFractionDigits: 10 // Izinkan lebih banyak desimal
                    }).format(priceUSD);

                    const changeEmoji = change24h > 0 ? '🟢' : '🔴';
                    const changePercent = change24h.toFixed(2);

                    let replyMsg = `💦 *Update Harga ${coinName} (${query.toUpperCase()})* Now💦\n\n`;
                    replyMsg += `USD: *${formatUSD}*\n`;
                    replyMsg += `IDR: *${formatIDR}*\n`;
                    replyMsg += `24j: *${changePercent}%* ${changeEmoji}`;
                    
                    message.reply(replyMsg);

                } else {
                    message.reply(`Gak nemu harga buat koin *'${query}'* 😭.`);
                }
                
            } catch (error) {
                console.error('Error pas ambil data crypto:', error.message);
                message.reply('Aduh, lagi ada masalah ngambil data ke CoinGecko. Coba bentar lagi.');
            }
        }

    // --- Logika untuk CHAT PRIBADI (PM) ---
    } else {
        if (message.body === '!ping') {
            message.reply('Pong!');
        }
        
        // Kalo mau !cek di PM, tinggal copy-paste logic !cek dari atas ke sini
    }
}); // --- AKHIR DARI LISTENER UTAMA ---

// Mulai koneksi
client.initialize();
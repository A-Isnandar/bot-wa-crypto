// index.js
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios'); // Pastikan ini ada di atas
const fs = require('fs'); // Kita butuh 'fs' buat nyimpen database

// --- (Database Pemantau) ---
const DB_FILE = './pantau_db.json';
let pantauJobs = {}; 
const PANTAU_INTERVAL = 20000; // 20 detik

function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE);
            pantauJobs = JSON.parse(data);
            console.log('Database pemantau berhasil di-load.');
        } else {
            pantauJobs = {};
            console.log('Database pemantau baru dibuat.');
        }
    } catch (err) {
        console.error('Gagal load DB pemantau:', err);
        pantauJobs = {};
    }
}

function saveDB() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(pantauJobs, null, 2));
    } catch (err) {
        console.error('Gagal simpen DB pemantau:', err);
    }
}
// --- (AKHIR Database) ---


console.log("Mencoba menjalankan bot...");

const client = new Client({
    authStrategy: new LocalAuth(),
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
    
    // Load database & Nyalain Mesin
    loadDB();
    startPantauEngine();
});

// --- LISTENER UTAMA ---
client.on('message', async (message) => {
    if (!message.body || !message.from) return; 

    console.log(`[PESAN MASUK] Dari: ${message.from} | Isi: ${message.body}`);
    const chat = await message.getChat();

    if (chat.isGroup) {
        
        // FITUR 1: Tag "Silent"
        if (message.body.startsWith('#')) {
            console.log('Menjalankan perintah Tag #');
            const firstSpaceIndex = message.body.indexOf(' ');

            if (firstSpaceIndex === -1) {
                 console.log('Perintah # dibatalkan, format salah (harus ada spasi).');
                 return; 
            }
            const textToSend = message.body.substring(firstSpaceIndex + 1).trim(); 
            if (textToSend.length === 0) {
                console.log('Perintah # dibatalkan, tidak ada teks setelah spasi.');
                return; 
            }

            let mentions = [];
            for (let participant of chat.participants) {
                mentions.push(participant.id._serialized);
            }
            await chat.sendMessage(textToSend, { mentions });

            try {
                await message.react('ðŸ’¦'); // (Emoji kode lu)
            } catch (e) {
                console.log('Gagal react, mungkin nomor bot-nya kena limit.');
            }
            console.log('Berhasil tag silent!');
        
        // FITUR 2: Cek Harga Crypto
        } else if (message.body.startsWith('!cek ')) {
            console.log('Menjalankan perintah !cek crypto');
            const query = message.body.split(' ')[1]?.toLowerCase().trim();
            
            if (!query) {
                message.reply('Mau cek koin apa? \nContoh: `!cek bitcoin` atau `!cek arb`');
                return;
            }

            try {
                const searchResponse = await axios.get(`https://api.coingecko.com/api/v3/search?query=${query}`);
                
                if (!searchResponse.data.coins || searchResponse.data.coins.length === 0) {
                    message.reply(`Damn, gak nemu koin yang namanya mirip *'${query}'* ðŸ˜­.`); 
                    return; 
                }

                const coinId = searchResponse.data.coins[0].id;
                const coinName = searchResponse.data.coins[0].name;
                const priceResponse = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,idr&include_24hr_change=true`);
                
                if (priceResponse.data[coinId]) {
                    const priceUSD = priceResponse.data[coinId].usd;
                    const priceIDR = priceResponse.data[coinId].idr;
                    const change24h = priceResponse.data[coinId].usd_24h_change;

                    const formatIDR = new Intl.NumberFormat('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR',
                        maximumFractionDigits: 10 
                    }).format(priceIDR);
                    
                    const formatUSD = new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: 'USD',
                        maximumFractionDigits: 10 
                    }).format(priceUSD);

                    const changeEmoji = change24h > 0 ? 'ðŸŸ¢' : 'ðŸ”´'; 
                    const changePercent = change24h.toFixed(2);

                    let replyMsg = `ðŸ’¦ *Update Harga ${coinName} (${query.toUpperCase()})* NowðŸ’¦\n\n`; 
                    replyMsg += `USD: *${formatUSD}*\n`;
                    replyMsg += `IDR: *${formatIDR}*\n`;
                    replyMsg += `24j: *${changePercent}%* ${changeEmoji}`;
                    
                    message.reply(replyMsg);
                } else {
                    message.reply(`Gak nemu harga buat koin *'${query}'* ðŸ˜­.`);
                }
            } catch (error) {
                console.error('Error pas ambil data crypto:', error.message);
                message.reply('Damn, lagi ada masalah ngambil data ke CoinGecko. Coba bentar lagi.');
            }
        
        // FITUR 3: !pantau (LOGIKA BARU)
        } else if (message.body.startsWith('!pantau ')) {
            console.log('Menjalankan perintah !pantau');
            const args = message.body.split(' '); 
            
            if (args.length !== 3) {
                return message.reply('Format salah ðŸ˜­.\nContoh: `!pantau sol ALAMAT_TOKEN`');
            }

            const chain = args[1].toLowerCase();
            const tokenAddress = args[2];
            const chatId = message.from;

            if (pantauJobs[tokenAddress]) {
                return message.reply(`Token \`${tokenAddress}\` udah dipantau di grup ini.`);
            }

            await message.reply(`ðŸ’¦ Mencari info token \`${tokenAddress}\` di chain \`${chain}\`...`);

            try {
                // Endpoint !pantau (search) UDAH BENER
                const searchUrl = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
                const response = await axios.get(searchUrl);

                if (!response.data.pairs || response.data.pairs.length === 0) {
                    return message.reply('Gak nemu pair buat token itu. Cek lagi alamatnya ðŸ˜­.');
                }
                
                const validPairs = response.data.pairs.filter(p => p.chainId === chain);
                if (validPairs.length === 0) {
                    return message.reply(`Gak nemu pair di chain \`${chain}\`. Coba cek chain lain (cth: eth, bsc) ðŸ˜­.`);
                }

                const pair = validPairs.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))[0];
                
                const startMcap = parseFloat(pair.marketCap);
                if (!startMcap || startMcap === 0) {
                    return message.reply('Gak bisa dapet Market Cap (mungkin token baru/terlalu kecil). Gagal memantau ðŸ˜­.');
                }

                const stepSize = startMcap * 0.10; // 10% step

                pantauJobs[tokenAddress] = {
                    chatId: chatId,
                    pairAddress: pair.pairAddress,
                    tokenAddress: tokenAddress,
                    tokenName: pair.baseToken.name,
                    tokenSymbol: pair.baseToken.symbol,
                    chain: chain,
                    stepSize: stepSize, // Simpen nilai 10%-nya
                    lastAlertedMcap: startMcap, // Simpen harga MCap terakhir
                    startPriceUsd: parseFloat(pair.priceUsd) // Simpen harga awal
                };
                
                saveDB(); 

                message.reply(`ðŸŸ¢ *Pemantauan Dimulai!*

Token: *${pair.baseToken.name} (${pair.baseToken.symbol})*
Chain: \`${chain}\`
Pair: \`${pair.pairAddress}\`
MCap Awal: *$${startMcap.toLocaleString('en-US')}*
Harga Awal: *$${pair.priceUsd}*

Meta akan kirim notif setiap MCAP naik/turun *10%* dari pantauan terakhir (step: *$${stepSize.toLocaleString('en-US')}*).`);

            } catch (error) {
                console.error('Error di !pantau:', error.message);
                message.reply('Aduh, error pas nyari data di DexScreener.');
            }

        // FITUR 4: !stop
        } else if (message.body.startsWith('!stop ')) {
            console.log('Menjalankan perintah !stop');
            const args = message.body.split(' ');
            
            if (args.length !== 2) {
                return message.reply('Format salah ðŸ˜­.\nContoh: `!stop ALAMAT_TOKEN`');
            }

            const tokenAddress = args[1];

            if (pantauJobs[tokenAddress]) {
                const jobName = pantauJobs[tokenAddress].tokenSymbol;
                delete pantauJobs[tokenAddress]; 
                saveDB(); 
                message.reply(`ðŸ”´ *Pemantauan Dihentikan* untuk ${jobName} (\`${tokenAddress}\`).`);
            } else {
                message.reply('Token itu emang nggak lagi dipantau.');
            }
        }

    // --- Logika untuk CHAT PRIBADI (PM) ---
    } else {
        if (message.body === '!ping') {
            message.reply('Pong!');
        }
    }
}); // --- AKHIR DARI LISTENER UTAMA ---


// --- (MESIN PEMANTAU - INI DIA PERBAIKAN TOTALNYA) ---

async function checkAlerts() {
    const jobKeys = Object.keys(pantauJobs);
    if (jobKeys.length === 0) {
        return; // Gak ada kerjaan
    }

    console.log(`[Pantau Engine] Menjalankan pengecekan untuk ${jobKeys.length} token...`);

    // Loop setiap job SATU PER SATU
    for (const tokenAddress of jobKeys) {
        try {
            const job = pantauJobs[tokenAddress];
            if (!job) continue; 

            // 1. BUAT URL YANG BENAR (SATU PER SATU)
            // API-nya butuh chain DAN pair address
            const url = `https://api.dexscreener.com/latest/dex/pairs/${job.chain}/${job.pairAddress}`;
            
            // 2. Tembak API
            const response = await axios.get(url);
            
            // Cek data balikan (API ini balikin 'pair', bukan 'pairs')
            if (!response.data || !response.data.pair) {
                console.warn(`[Pantau Engine] Data pair tidak valid dari API untuk ${job.tokenSymbol}. Skipping.`);
                continue;
            }

            const pairData = response.data.pair;
            
            const currentMcap = parseFloat(pairData.marketCap);
            const currentPriceUsd = parseFloat(pairData.priceUsd);
            
            if (!currentMcap || isNaN(currentMcap) || isNaN(currentPriceUsd)) {
                console.warn(`[Pantau Engine] Data MCap/Harga tidak valid untuk ${job.tokenSymbol}. Skipping.`);
                continue;
            }

            // 3. Cek selisih dari MCap terakhir
            const mcapDifference = currentMcap - job.lastAlertedMcap;
            
            // 4. Cek apakah selisih (absolut) >= 10% (stepSize)
            if (Math.abs(mcapDifference) >= job.stepSize) {
                
                // --- WAKTUNYA NOTIFIKASI! ---
                const trend = mcapDifference > 0 ? 'ðŸŸ¢ NAIK' : 'ðŸ”´ TURUN';
                
                const percentChangeFromStart = ((currentPriceUsd - job.startPriceUsd) / job.startPriceUsd) * 100;

                let notifMsg = `ðŸ’¦ *HARGA* ${job.tokenSymbol} ${trend} ðŸ’¦\n\n`;
                notifMsg += `Harga: *$${currentPriceUsd}*\n`;
                notifMsg += `MCap: *$${currentMcap.toLocaleString('en-US')}*\n\n`;
                notifMsg += `(Perubahan >10% dari pantauan terakhir. Total: *${percentChangeFromStart.toFixed(2)}%* dari awal)\n`;
                notifMsg += `Chart: \`https://dexscreener.com/${job.chain}/${job.pairAddress}\``;

                if (client.info) {
                    await client.sendMessage(job.chatId, notifMsg);
                } else {
                    console.log('Client belum siap, notif ditunda.');
                }
                
                // 5. Update database biar ga spam
                pantauJobs[tokenAddress].lastAlertedMcap = currentMcap;
                saveDB(); 
            }
        } catch (jobError) {
            // Kalo 1 job error (mungkin 404 krn pair-nya mati), log, tapi lanjut ke job berikutnya
            console.error(`[Pantau Engine] Gagal memproses job ${tokenAddress}:`, jobError.message);
        }
    }
}

// Fungsi yg ngejalanin "Mesin"-nya
function startPantauEngine() {
    console.log('Mesin Pemantau (Polling Engine) dinyalakan.');
    console.log(`Akan mengecek harga setiap ${PANTAU_INTERVAL / 1000} detik.`);
    
    // Jalanin 'checkAlerts' sekali di awal
    checkAlerts(); 
    
    // Terus jalanin tiap 20 detik
    setInterval(checkAlerts, PANTAU_INTERVAL);
}
// --- (AKHIR MESIN PEMANTAU) ---


// Mulai koneksi
client.initialize();
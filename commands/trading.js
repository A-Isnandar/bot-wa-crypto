// commands/trading.js
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58').default || require('bs58');
const db = require('../utils/db');
const { encrypt } = require('../utils/security');
const { getSolBalance, executeSwap } = require('../core/solanaEngine');

const SOL_MINT = 'So11111111111111111111111111111111111111112';

async function handleWallet(message) {
  const chat = await message.getChat();

  // --- LOGIKA 1: JIKA DI GRUP (Tolak Create) ---
  if (chat.isGroup) {
    return message.reply(
      '🔒 *Mode Trading*\n\nUntuk membuat wallet, cek saldo, dan trading, silakan Chat Pribadi (PM) ke bot ini dengan ketik:\n\n`!wallet`\n\nDemi keamanan Private Key Anda.'
    );
  }

  // --- LOGIKA 2: JIKA DI PM (Lanjut Proses) ---
  // Di PM, message.from PASTI ID user yang unik (@c.us)
  const userId = message.from;

  // Cek database
  if (!db.userWallets[userId]) {
    // --- BUAT WALLET BARU ---
    console.log(`[Trading] Membuat wallet baru untuk user (PM): ${userId}`);

    const newWallet = Keypair.generate();
    const privateKey = bs58.encode(newWallet.secretKey);
    const publicKey = newWallet.publicKey.toString();

    // Simpan
    db.userWallets[userId] = {
      publicKey: publicKey,
      encryptedKey: encrypt(privateKey),
    };
    db.saveUserDB();

    const reply = `✅ *Wallet Trading Dibuat!*\n\nAddress:\n\`${publicKey}\`\n\nPrivate Key (JANGAN KASIH SIAPA2):\n\`${privateKey}\`\n\nSilakan deposit SOL ke address di atas buat mulai trading.\nKetik \`!balance\` buat cek saldo.`;
    return message.reply(reply);
  } else {
    // --- TAMPILKAN INFO WALLET ---
    const userData = db.userWallets[userId];
    // Kita panggil handleBalance biar DRY (Don't Repeat Yourself)
    return handleBalance(message);
  }
}

async function handleBalance(message) {
  // Pastikan ini di PM (Guard clause)
  const chat = await message.getChat();
  if (chat.isGroup)
    return message.reply(
      'Cek saldo cuma bisa di PM bro. Ketik `!wallet` di PM.'
    );

  const userId = message.from;
  if (!db.userWallets[userId])
    return message.reply(
      'Lu belum punya wallet! Ketik `!wallet` dulu di sini.'
    );

  const userData = db.userWallets[userId];
  await message.reply('⏳ Lagi ngecek saldo di blockchain...');

  const balanceData = await getSolBalance(userData.encryptedKey);

  let msg = `💰 *Informasi Saldo*\n\n`;
  msg += `Address: \`${userData.publicKey}\`\n`;
  msg += `SOL: *${balanceData ? balanceData.sol.toFixed(4) : 0} SOL*\n\n`;
  msg += `*Cara Trading:*\n`;
  msg += `Beli: \`!buy <CA_TOKEN> <JUMLAH_SOL>\`\n`;
  msg += `Jual: \`!sell <CA_TOKEN> <PERSEN>\` (Soon)`;

  return message.reply(msg);
}

async function handleBuy(message) {
  const chat = await message.getChat();
  if (chat.isGroup)
    return message.reply(
      '⚠️ Bahaya! Jangan trading di grup. Chat bot ini di PM (Japri).'
    );

  const userId = message.from;
  const args = message.body.split(' ');

  if (!db.userWallets[userId])
    return message.reply('Lu belum punya wallet! Ketik `!wallet` dulu.');
  if (args.length !== 3)
    return message.reply('Format salah.\nContoh: `!buy 2qEHj...pump 0.1`');

  const tokenAddress = args[1];
  const amountSol = parseFloat(args[2]);

  if (isNaN(amountSol) || amountSol <= 0)
    return message.reply('Jumlah SOL gak valid.');

  await message.reply(
    `⏳ *OTW Beli...*\nTarget: \`${tokenAddress}\`\nNominal: ${amountSol} SOL`
  );

  try {
    const txLink = await executeSwap(
      db.userWallets[userId].encryptedKey,
      SOL_MINT,
      tokenAddress,
      amountSol
    );
    message.reply(`✅ *Sukses Beli!* 🚀\n\nLihat TX: ${txLink}`);
  } catch (error) {
    console.error('[Buy Error]', error);
    message.reply(
      `❌ Gagal Beli: ${error.message}\n_(Coba lagi, mungkin jaringan sibuk)_`
    );
  }
}

async function handleSell(message) {
  message.reply('🚧 Fitur `!sell` masih dalam pengembangan.');
}

module.exports = { handleWallet, handleBuy, handleBalance, handleSell };

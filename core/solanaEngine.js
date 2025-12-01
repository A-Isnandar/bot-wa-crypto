// core/solanaEngine.js
const {
  Connection,
  Keypair,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const axios = require('axios');
const bs58 = require('bs58').default || require('bs58');
const { decrypt } = require('../utils/security');
require('dotenv').config(); // Pastikan bisa baca .env

// 1. Setup Koneksi RPC (Pake Helius dari .env, fallback ke public kalo error)
const RPC_URL =
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

console.log(
  `[SolanaEngine] Menggunakan RPC: ${
    RPC_URL.includes('helius') ? 'Helius (Turbo) 🚀' : 'Public (Lambat) 🐢'
  }`
);

// 2. Setup API Jupiter (Sesuai Request Lu)
const JUPITER_QUOTE_API = 'https://lite-api.jup.ag/swap/v1/quote'; // v1 Lite
const JUPITER_SWAP_API = 'https://lite-api.jup.ag/swap/v1/swap'; // v1 Lite

async function getSolBalance(encryptedPrivateKey) {
  try {
    const privateKey = bs58.decode(decrypt(encryptedPrivateKey));
    const wallet = Keypair.fromSecretKey(privateKey);
    const balance = await connection.getBalance(wallet.publicKey);
    return {
      address: wallet.publicKey.toString(),
      sol: balance / LAMPORTS_PER_SOL,
    };
  } catch (error) {
    console.error('Error get balance:', error);
    return null;
  }
}

async function executeSwap(encryptedPrivateKey, inputMint, outputMint, amount) {
  try {
    // A. Decrypt Wallet User
    const privateKey = bs58.decode(decrypt(encryptedPrivateKey));
    const wallet = Keypair.fromSecretKey(privateKey);

    // B. Hitung Amount (Lamports)
    // Asumsi: Input adalah SOL (9 decimals)
    let amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL);

    // C. Get Quote dari Jupiter
    // Note: v1 mungkin butuh parameter beda dikit, kita sesuaikan standar umum
    const quoteUrl = `${JUPITER_QUOTE_API}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLamports}&slippageBps=50`; // 0.5% Slippage
    const quoteResponse = await axios.get(quoteUrl);
    const quoteData = quoteResponse.data;

    if (!quoteData) throw new Error('Gagal dapet quote harga dari Jupiter.');

    // D. Minta Transaksi Swap ke Jupiter
    // Payload v1 biasanya mirip v6, tapi kalo error, coba cek dokumentasi v1 spesifik
    const swapResponse = await axios.post(JUPITER_SWAP_API, {
      quoteResponse: quoteData,
      userPublicKey: wallet.publicKey.toString(),
      wrapAndUnwrapSol: true,
    });

    const { swapTransaction } = swapResponse.data;

    if (!swapTransaction) throw new Error('Gagal generate swap transaction.');

    // E. Sign & Send Transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    transaction.sign([wallet]);

    const rawTransaction = transaction.serialize();

    // Kirim pake Helius RPC
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });

    // F. Confirm Transaction
    const confirmation = await connection.confirmTransaction(txid);

    if (confirmation.value.err)
      throw new Error('Transaksi gagal di blockchain.');

    return `https://solscan.io/tx/${txid}`;
  } catch (error) {
    console.error('Swap Error:', error.message);
    // Error handling biar user tau kenapa
    throw new Error(error.response?.data?.error || error.message);
  }
}

module.exports = { getSolBalance, executeSwap };

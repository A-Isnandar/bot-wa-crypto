// commands/audit.js
const axios = require('axios');

// Mapping Chain ID untuk GoPlus (EVM)
// Update: Ditambahin Monad (Chain ID 143)
const EVM_CHAIN_MAP = {
    'eth': '1',
    'ethereum': '1',
    'bsc': '56',
    'bnb': '56',
    'arb': '42161',
    'arbitrum': '42161',
    'matic': '137',
    'polygon': '137',
    'base': '8453',
    'op': '10',
    'optimism': '10',
    'avax': '43114',
    'avalanche': '43114',
    'monad': '143',  // <-- BARU: Monad Mainnet
    'mon': '143'     // <-- BARU: Alias Monad
};

async function handleAudit(message, client) {
    try {
        console.log('[CommandHandler] Menjalankan perintah !audit');
        const args = message.body.split(' ');

        // Validasi: !audit <chain> <address>
        if (args.length !== 3) {
            return message.reply('Format salah 🚫\nContoh: `!audit sol <address>` atau `!audit monad <address>`');
        }

        const chain = args[1].toLowerCase();
        const tokenAddress = args[2];

        await message.reply(`🕵️‍♂️ Lagi nge-scan smart contract di *${chain.toUpperCase()}*...\nTunggu bentar...`);

        // --- STRATEGI 1: SOLANA (RugCheck.xyz) ---
        if (chain === 'sol' || chain === 'solana') {
            try {
                const url = `https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report/summary`;
                const response = await axios.get(url);
                const data = response.data;

                if (!data || data.error) {
                    return message.reply('Gagal dapet data audit Solana. Token mungkin terlalu baru atau server sibuk.');
                }

                const riskScore = data.risks ? data.risks.length * 100 : 0; 
                
                let riskLevel = '🟢 AMAN (Low Risk)';
                if (data.risks.length > 2) riskLevel = '🟡 WASPADA (Medium Risk)';
                if (data.risks.length > 5) riskLevel = '🔴 BAHAYA (High Risk)';

                let replyMsg = `🚨 *AUDIT RESULT: ${chain.toUpperCase()}* 🚨\n`;
                replyMsg += `Token: \`${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}\`\n\n`;
                replyMsg += `Risk Level: *${riskLevel}*\n`;
                replyMsg += `Total Red Flags: *${data.risks.length}*\n\n`;

                if (data.risks.length > 0) {
                    replyMsg += `🚩 *Red Flags Ditemukan:*\n`;
                    data.risks.slice(0, 5).forEach(risk => {
                        replyMsg += `• ${risk.name} (${risk.level})\n`;
                    });
                    if (data.risks.length > 5) replyMsg += `• ...dan ${data.risks.length - 5} lainnya.\n`;
                } else {
                    replyMsg += `✅ Tidak ditemukan masalah kritikal (tapi tetep DYOR!)\n`;
                }
                
                replyMsg += `\nCek detail: https://rugcheck.xyz/tokens/${tokenAddress}`;
                
                return message.reply(replyMsg);

            } catch (err) {
                console.error('[Audit SOL] Error:', err.message);
                if (err.response && err.response.status === 404) {
                    return message.reply('Laporan belum tersedia di database RugCheck. NT bro.');
                }
                return message.reply('Gagal konek ke RugCheck API.');
            }
        }

        // --- STRATEGI 2: EVM (GoPlus Security) - Termasuk Monad ---
        const chainId = EVM_CHAIN_MAP[chain];
        if (chainId) {
            try {
                // GoPlus support Monad di endpoint standar mereka
                const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${tokenAddress}`;
                const response = await axios.get(url);
                
                if (!response.data.result || !response.data.result[tokenAddress.toLowerCase()]) {
                    return message.reply(`Gagal dapet data audit ${chain.toUpperCase()}. Cek address lagi atau mungkin token belum terindex.`);
                }

                const data = response.data.result[tokenAddress.toLowerCase()];
                
                // Analisa Flag GoPlus
                const flags = [];
                if (data.is_honeypot === "1") flags.push("🍯 HONEYPOT (Gak bisa jual!)");
                if (data.is_mintable === "1") flags.push("🖨️ Mintable (Dev bisa cetak token)");
                if (data.is_proxy === "1") flags.push("🔄 Proxy Contract (Logic bisa diubah)");
                if (data.owner_change_balance === "1") flags.push("⚠️ Owner Change Balance");
                if (data.buy_tax && parseFloat(data.buy_tax) > 0.2) flags.push(`📈 Buy Tax Tinggi: ${(parseFloat(data.buy_tax) * 100).toFixed(2)}%`);
                if (data.sell_tax && parseFloat(data.sell_tax) > 0.2) flags.push(`📉 Sell Tax Tinggi: ${(parseFloat(data.sell_tax) * 100).toFixed(2)}%`);
                if (data.cannot_sell_all === "1") flags.push("🚫 Cannot Sell All");

                let riskLevel = '🟢 AMAN (Low Risk)';
                if (flags.length > 0) riskLevel = '🟡 WASPADA (Medium Risk)';
                if (data.is_honeypot === "1" || flags.length >= 3) riskLevel = '🔴 BAHAYA (High Risk)';

                let replyMsg = `🚨 *AUDIT RESULT: ${chain.toUpperCase()}* 🚨\n`;
                replyMsg += `Token: *${data.token_name || 'Unknown'} (${data.token_symbol || '???'})*\n\n`;
                replyMsg += `Risk Level: *${riskLevel}*\n`;
                
                // Nampilin Tax (kalo ada datanya)
                const buyTax = data.buy_tax ? (parseFloat(data.buy_tax) * 100).toFixed(2) : '?';
                const sellTax = data.sell_tax ? (parseFloat(data.sell_tax) * 100).toFixed(2) : '?';
                replyMsg += `Tax: Beli ${buyTax}% | Jual ${sellTax}%\n\n`;

                if (flags.length > 0) {
                    replyMsg += `🚩 *Red Flags Ditemukan:*\n`;
                    flags.forEach(flag => replyMsg += `• ${flag}\n`);
                } else {
                    replyMsg += `✅ Kontrak terlihat standar (No major flags).\n`;
                }

                replyMsg += `\n(Powered by GoPlus Security)`;
                return message.reply(replyMsg);

            } catch (err) {
                console.error('[Audit EVM] Error:', err.message);
                return message.reply('Gagal konek ke GoPlus API.');
            }
        }

        // Kalo chain gak dikenal
        message.reply(`Chain *${chain}* belum disupport. Coba: sol, monad, bsc, eth, arb, base, matic, avax.`);

    } catch (error) {
        console.error('[CommandHandler] Error di handleAudit:', error.message);
        message.reply('Terjadi kesalahan internal saat audit.');
    }
}

module.exports = { handleAudit };
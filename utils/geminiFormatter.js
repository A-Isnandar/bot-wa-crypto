// utils/geminiFormatter.js

/**
 * Membersihkan teks Markdown dari Gemini agar rapi di WhatsApp.
 * @param {string} text Teks asli dari Gemini API
 * @returns {string} Teks yang sudah diformat untuk WA
 */
function formatGeminiResponse(text) {
    if (!text) return '';

    let formattedText = text;

    // (TAMBAHAN 1: Ganti spasi aneh jadi spasi normal DULU)
    formattedText = formattedText.replace(/ /g, ' ');

    // 1. Ganti list '*' atau '-' dengan bullet point WA (•)
    // Pola: spasi di awal (opsional), lalu '*' atau '-', lalu spasi
    formattedText = formattedText.replace(/^[ \t]*[\*-][ \t]/gm, '• ');

    // 2. Ganti list bernomor (cth: "1. ")
    // Pola: spasi di awal (opsional), angka, titik, lalu spasi
    formattedText = formattedText.replace(/^[ \t]*(\d+)\.[ \t]/gm, '$1. ');

    // 3. Hapus spasi indentasi di awal setiap baris (penting!)
    formattedText = formattedText.replace(/^[ \t]+/gm, '');

    // 4. (Dihapus) formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '*$1*');

    // 5. Ganti horizontal rule (---)
    // (*** udah dihapus di langkah 7)
    formattedText = formattedText.replace(/^[ \t]*[---]{3,}[ \t]*$/gm, '\n');

    // 6. (MODIFIKASI) Ganti heading (#, ##) jadi PLAIN TEXT (bukan bold)
    // Pola: spasi di awal (opsional), 1-3 tanda #, spasi, lalu teks
    // Kita hapus # nya, tapi GAK nambahin * (sesuai request)
    formattedText = formattedText.replace(/^[ \t]*[#]{1,3}[ \t](.*)/gm, '$1');

    // 7. (TAMBAHAN 2: "Metode Nuklir" Sesuai Request)
    // Hapus SEMUA sisa karakter asterisk (*) dan underscore (_)
    // Ini akan menghapus bold, italic, dan semua sisa karakter nyangkut.
    formattedText = formattedText.replace(/[\*_]/g, '');

    // 8. Rapikan line break yang berlebihan (maksimal 2x line break)
    formattedText = formattedText.replace(/\n{3,}/g, '\n\n');

    // 9. Trim spasi di awal dan akhir
    formattedText = formattedText.trim();

    return formattedText;
}

module.exports = { formatGeminiResponse };
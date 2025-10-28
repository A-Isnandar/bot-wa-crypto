// commands/tagging.js
async function handleTagging(message, client) {
  try {
    const chat = await message.getChat();
    if (!chat.isGroup) return; // Seharusnya sudah difilter di index.js, tapi double check

    console.log('[CommandHandler] Menjalankan perintah Tag #');
    const firstSpaceIndex = message.body.indexOf(' ');

    if (firstSpaceIndex === -1) {
      console.log('[CommandHandler] Perintah # dibatalkan, format salah.');
      return;
    }
    const textToSend = message.body.substring(firstSpaceIndex + 1).trim();
    if (textToSend.length === 0) {
      console.log('[CommandHandler] Perintah # dibatalkan, tidak ada teks.');
      return;
    }

    let mentions = [];
    for (let participant of chat.participants) {
      mentions.push(participant.id._serialized);
    }
    await chat.sendMessage(textToSend, { mentions });

    try {
      await message.react('💦'); // (Emoji kode lu)
    } catch (e) {
      console.log('[CommandHandler] Gagal react:', e.message);
    }
    console.log('[CommandHandler] Berhasil tag silent!');
  } catch (error) {
    console.error('[CommandHandler] Error di handleTagging:', error.message);
    // Pertimbangkan untuk membalas pesan error ke user jika perlu
    // message.reply('Aduh, ada error pas nge-tag.');
  }
}

module.exports = { handleTagging };

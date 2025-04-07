const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');

// Google TTS API භාවිතා කරන TTS ක්‍රියාකරු
cmd({
  pattern: "tts",
  desc: "Convert text to speech",
  category: "tools",
  react: "🗣️",
  filename: __filename
}, async (message, match) => {
  try {
    if (!match) return await message.reply("🔊 *Please provide text to convert*\nExample: .tts Hello world");

    // ප්‍රගති පණිවිඩය
    const processingMsg = await message.reply("⏳ Processing your TTS request...");

    // භාෂාව සකස් කිරීම (default: English)
    let language = 'en';
    if (match.includes('{')) {
      const langMatch = match.match(/\{([a-z]+)\}/i);
      if (langMatch) {
        language = langMatch[1];
        match = match.replace(langMatch[0], '').trim();
      }
    }

    // Google TTS API URL
    const ttsUrl = `http://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=tw-ob&q=${encodeURIComponent(match)}`;

    // ඕඩියෝ ගොනුව ලබා ගැනීම
    const response = await axios({
      method: 'GET',
      url: ttsUrl,
      responseType: 'stream'
    });

    const audioPath = `./temp/${Date.now()}.mp3`;
    const writer = fs.createWriteStream(audioPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // ඕඩියෝ ගොනුව යැවීම
    await message.client.sendMessage(message.jid, {
      audio: fs.readFileSync(audioPath),
      mimetype: 'audio/mpeg',
      ptt: true
    });

    // ප්‍රගති පණිවිඩය මකාදැමීම
    await processingMsg.delete();

    // තාවකාලික ගොනුව මකාදැමීම
    fs.unlinkSync(audioPath);

  } catch (error) {
    console.error('TTS Error:', error);
    await message.reply("❌ Error generating speech. Please try again later.");
  }
});

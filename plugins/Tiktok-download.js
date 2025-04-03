const { cmd } = require('../command');
const { getVideoMeta } = require('tiktok-scraper');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

cmd({
  pattern: "tiktok",
  alias: ["tt", "ttdl"],
  desc: "Download TikTok videos with options",
  category: "download",
  react: "⬇️",
  filename: __filename
}, async (messageHandler, { from, reply, quoted, args }) => {
  try {
    if (!args[0]) return reply("⚠️ *කරුණාකර TikTok වීඩියෝ URL එකක් ඇතුළත් කරන්න!*\nඋදා: .tt https://vm.tiktok.com/XYZ");

    const processingMsg = await reply("⏳ *TikTok වීඩියෝව විශ්ලේෂණය කරමින්...*");

    // Get TikTok video metadata
    const meta = await getVideoMeta(args[0]);
    const videoData = meta.collector[0];
    
    // Prepare options message
    let optionsMsg = `*──────────────────────────────*\n`;
    optionsMsg += `       *TikTok වීඩියෝව*       \n\n`;
    optionsMsg += `🎬 *මාතෘකාව:* ${videoData.text || 'නොමැත'}\n`;
    optionsMsg += `👤 *නිර්මාතෘ:* ${videoData.authorMeta.name}\n`;
    optionsMsg += `❤️ *ලයික්:* ${videoData.diggCount.toLocaleString()}\n`;
    optionsMsg += `💬 *අදහස්:* ${videoData.commentCount.toLocaleString()}\n`;
    optionsMsg += `⏱️ *කාලය:* ${videoData.videoMeta.duration}s\n\n`;
    optionsMsg += `*බාගත කිරීමේ විකල්ප තෝරන්න:*\n\n`;
    optionsMsg += `1️⃣ - වීඩියෝව (ජල සලකුණු නැතිව)\n`;
    optionsMsg += `2️⃣ - ශ්‍රව්‍ය පමණක්\n`;
    optionsMsg += `3️⃣ - විස්තර පමණක්\n\n`;
    optionsMsg += `*Rasiya-MD බොට්* 🇱🇰\n`;
    optionsMsg += `*──────────────────────────────*`;

    const sentMessage = await messageHandler.sendMessage(from, {
      image: { url: videoData.covers.default },
      caption: optionsMsg
    }, { quoted: quoted });

    // Store video data temporarily
    messageHandler.tiktokData = messageHandler.tiktokData || {};
    messageHandler.tiktokData[from] = {
      videoUrl: videoData.videoUrl,
      audioUrl: videoData.musicMeta.musicUrl,
      metadata: {
        title: videoData.text,
        author: videoData.authorMeta.name,
        duration: videoData.videoMeta.duration
      },
      timestamp: Date.now()
    };

    // Delete processing message
    await messageHandler.deleteMessage(from, processingMsg.key);

    // Handle user response
    messageHandler.ev.on("messages.upsert", async (update) => {
      const message = update.messages[0];
      if (!message.message || !message.message.extendedTextMessage) return;

      const userReply = message.message.extendedTextMessage.text.trim();
      const context = message.message.extendedTextMessage.contextInfo;

      if (context.stanzaId === sentMessage.key.id) {
        const { videoUrl, audioUrl, metadata } = messageHandler.tiktokData[from] || {};

        if (!videoUrl) {
          return reply("❌ *සැසිය කල් ඉකුත් වී ඇත! නැවත උත්සාහ කරන්න.*");
        }

        try {
          switch(userReply) {
            case '1': // Video download
              await reply("⏳ *වීඩියෝව බාගත කරමින්...*");
              
              const videoPath = path.join(__dirname, '../temp', `tiktok_${Date.now()}.mp4`);
              const writer = fs.createWriteStream(videoPath);
              const videoResponse = await axios.get(videoUrl, { responseType: 'stream' });
              videoResponse.data.pipe(writer);

              await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
              });

              await messageHandler.sendMessage(from, {
                video: fs.readFileSync(videoPath),
                caption: `🎬 *${metadata.title || 'TikTok වීඩියෝව'}*\n👤 ${metadata.author}\n⏱️ ${metadata.duration}s\n\n*Rasiya-MD* 🇱🇰`
              }, { quoted: quoted });

              fs.unlinkSync(videoPath);
              break;

            case '2': // Audio only
              await reply("⏳ *ශ්‍රව්‍ය ගොනුව බාගත කරමින්...*");
              
              const audioPath = path.join(__dirname, '../temp', `tiktok_audio_${Date.now()}.mp3`);
              const audioWriter = fs.createWriteStream(audioPath);
              const audioResponse = await axios.get(audioUrl, { responseType: 'stream' });
              audioResponse.data.pipe(audioWriter);

              await new Promise((resolve, reject) => {
                audioWriter.on('finish', resolve);
                audioWriter.on('error', reject);
              });

              await messageHandler.sendMessage(from, {
                audio: fs.readFileSync(audioPath),
                mimetype: 'audio/mpeg',
                ptt: false,
                caption: `🎵 *TikTok ශ්‍රව්‍යය*\n👤 ${metadata.author}\n⏱️ ${metadata.duration}s\n\n*Rasiya-MD* 🇱🇰`
              }, { quoted: quoted });

              fs.unlinkSync(audioPath);
              break;

            case '3': // Info only
              await reply("ℹ️ *වීඩියෝ විස්තර ලබා දෙමින්...*");
              break;

            default:
              await reply("⚠️ *වලංගු විකල්පයක් තෝරන්න! (1, 2 හෝ 3)*");
              return;
          }
        } catch (error) {
          console.error(error);
          reply("❌ *බාගත කිරීමේදී දෝෂයක් ඇතිවිය!*");
        } finally {
          delete messageHandler.tiktokData[from];
        }
      }
    });
  } catch (error) {
    console.error(error);
    reply("❌ *වීඩියෝව ලබා ගැනීමේදී දෝෂයක් ඇතිවිය!*");
  }
});

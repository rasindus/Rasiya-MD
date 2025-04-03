const { cmd } = require('../command');
const { getVideoMeta } = require('tiktok-scraper');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

cmd({
  pattern: "tiktok",
  alias: ["tt", "ttdl"],
  desc: "Download high quality TikTok videos",
  category: "download",
  react: "⬇️",
  filename: __filename
}, async (messageHandler, { from, reply, quoted, args }) => {
  try {
    // Validate input
    if (!args[0]) {
      return reply("⚠️ *කරුණාකර TikTok වීඩියෝ URL එකක් ඇතුළත් කරන්න!*\nඋදා: .tt https://vm.tiktok.com/XYZ");
    }

    // Validate URL format
    if (!args[0].match(/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/)) {
      return reply("❌ *වලංගු නොවන TikTok URL!* ඔබගේ URL නැවත පරීක්ෂා කරන්න.");
    }

    const processingMsg = await reply("⏳ *TikTok වීඩියෝව විශ්ලේෂණය කරමින්...*");

    try {
      // Get TikTok video metadata with timeout
      const meta = await Promise.race([
        getVideoMeta(args[0]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 30000))
      ]);

      if (!meta || !meta.collector || meta.collector.length === 0) {
        throw new Error('No video data found');
      }

      const videoData = meta.collector[0];
      
      // Prepare options message
      let optionsMsg = `*──────────────────────────────*\n`;
      optionsMsg += `       *TikTok වීඩියෝව*       \n\n`;
      optionsMsg += `🎬 *මාතෘකාව:* ${videoData.text || 'නොමැත'}\n`;
      optionsMsg += `👤 *නිර්මාතෘ:* ${videoData.authorMeta?.name || 'නොදනී'}\n`;
      optionsMsg += `❤️ *ලයික්:* ${videoData.diggCount?.toLocaleString() || '0'}\n`;
      optionsMsg += `⏱️ *කාලය:* ${videoData.videoMeta?.duration || 'N/A'}s\n\n`;
      optionsMsg += `*බාගත කිරීමේ විකල්ප තෝරන්න:*\n\n`;
      optionsMsg += `1️⃣ - වීඩියෝව (ජල සලකුණු නැතිව)\n`;
      optionsMsg += `2️⃣ - ශ්‍රව්‍ය පමණක්\n\n`;
      optionsMsg += `*Rasiya-MD බොට්* 🇱🇰\n`;
      optionsMsg += `*──────────────────────────────*`;

      const sentMessage = await messageHandler.sendMessage(from, {
        image: { url: videoData.covers?.default || '' },
        caption: optionsMsg
      }, { quoted: quoted });

      // Store video data temporarily
      messageHandler.tiktokTemp = {
        videoUrl: videoData.videoUrl,
        audioUrl: videoData.musicMeta?.musicUrl,
        timestamp: Date.now()
      };

      // Set up response handler
      const responseHandler = async (message) => {
        if (!message.message?.extendedTextMessage || 
            message.key.remoteJid !== from ||
            message.message.extendedTextMessage.contextInfo.stanzaId !== sentMessage.key.id) {
          return;
        }

        const userChoice = message.message.extendedTextMessage.text.trim();
        
        try {
          if (!['1', '2'].includes(userChoice)) {
            await reply("⚠️ *වලංගු නොවන තේරීම! කරුණාකර 1 හෝ 2 ලෙස යොමු කරන්න.*");
            return;
          }

          await reply("⏳ *ඔබගේ ඉල්ලීම සකසමින්...*");

          const downloadType = userChoice === '1' ? 'video' : 'audio';
          const filePath = path.join(__dirname, '../temp', `tiktok_${Date.now()}.${downloadType === 'video' ? 'mp4' : 'mp3'}`);
          const downloadUrl = downloadType === 'video' ? messageHandler.tiktokTemp.videoUrl : messageHandler.tiktokTemp.audioUrl;

          // Download the file
          const writer = fs.createWriteStream(filePath);
          const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream',
            timeout: 60000
          });

          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          // Send the file
          if (downloadType === 'video') {
            await messageHandler.sendMessage(from, {
              video: fs.readFileSync(filePath),
              caption: `🎬 *TikTok වීඩියෝව*\n👤 ${videoData.authorMeta?.name || ''}\n\n*Rasiya-MD* 🇱🇰`
            }, { quoted: quoted });
          } else {
            await messageHandler.sendMessage(from, {
              audio: fs.readFileSync(filePath),
              mimetype: 'audio/mpeg',
              ptt: false,
              caption: `🎵 *TikTok ශ්‍රව්‍යය*\n👤 ${videoData.authorMeta?.name || ''}\n\n*Rasiya-MD* 🇱🇰`
            }, { quoted: quoted });
          }

          // Clean up
          fs.unlinkSync(filePath);

        } catch (error) {
          console.error('Download error:', error);
          await reply("❌ *බාගත කිරීමේදී දෝෂයක් ඇතිවිය!*");
        } finally {
          // Remove listener after processing
          messageHandler.ev.off('messages.upsert', responseHandler);
        }
      };

      // Add listener for user response
      messageHandler.ev.on('messages.upsert', responseHandler);

      // Set timeout to remove listener if no response
      setTimeout(() => {
        messageHandler.ev.off('messages.upsert', responseHandler);
      }, 60000);

    } catch (error) {
      console.error('Metadata error:', error);
      throw new Error('වීඩියෝ තොරතුරු ලබා ගැනීමට අසමත් විය');
    } finally {
      await messageHandler.deleteMessage(from, processingMsg.key);
    }

  } catch (error) {
    console.error('Main error:', error);
    reply(`❌ *දෝෂය:* ${error.message || 'වීඩියෝව ලබා ගැනීමේදී දෝෂයක් ඇතිවිය!'}`);
  }
});

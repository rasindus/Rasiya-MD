const { cmd } = require('../command');
const { getVideoMeta } = require('tiktok-scraper');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

cmd({
  pattern: "tiktok",
  alias: ["tt", "ttdl"],
  desc: "Download TikTok videos with watermark removed",
  category: "download",
  react: "⬇️",
  filename: __filename
}, async (messageHandler, { from, reply, quoted, args }) => {
  try {
    // Validate input
    if (!args[0]) {
      return reply("⚠️ *Please provide a TikTok URL!*\nExample: .tt https://vm.tiktok.com/XYZ");
    }

    // Validate URL format
    const tiktokRegex = /(vm|vt|www)\.tiktok\.com|tiktok\.com/;
    if (!tiktokRegex.test(args[0])) {
      return reply("❌ *Invalid TikTok URL!* Please check your URL and try again.");
    }

    const processingMsg = await reply("⏳ *Processing TikTok video...*");

    try {
      // Get TikTok video metadata with timeout
      const meta = await Promise.race([
        getVideoMeta(args[0]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000))
      ]);

      // Validate response structure
      if (!meta?.collector?.[0]?.videoUrl) {
        throw new Error('Invalid TikTok API response structure');
      }

      const videoData = meta.collector[0];
      
      // Prepare options message
      let optionsMsg = `*────── TikTok Video ──────*\n\n`;
      optionsMsg += `🎬 *Title:* ${videoData.text || 'No title'}\n`;
      optionsMsg += `👤 *Author:* ${videoData.authorMeta?.name || 'Unknown'}\n`;
      optionsMsg += `❤️ *Likes:* ${videoData.diggCount?.toLocaleString() || '0'}\n`;
      optionsMsg += `⏱️ *Duration:* ${videoData.videoMeta?.duration || 'N/A'}s\n\n`;
      optionsMsg += `*Download Options:*\n\n`;
      optionsMsg += `1️⃣ - Video (No watermark)\n`;
      optionsMsg += `2️⃣ - Audio only\n\n`;
      optionsMsg += `*Rasiya-MD Bot*`;

      const sentMessage = await messageHandler.sendMessage(from, {
        image: { url: videoData.covers?.default || '' },
        caption: optionsMsg
      }, { quoted: quoted });

      // Store video data temporarily
      messageHandler.tiktokTemp = messageHandler.tiktokTemp || {};
      messageHandler.tiktokTemp[from] = {
        videoUrl: videoData.videoUrl,
        audioUrl: videoData.musicMeta?.musicUrl,
        timestamp: Date.now(),
        messageId: sentMessage.key.id
      };

      // Set up response handler
      const handleResponse = async (update) => {
        const message = update.messages?.[0];
        if (!message || 
            message.key.remoteJid !== from ||
            !message.message?.extendedTextMessage ||
            message.message.extendedTextMessage.contextInfo?.stanzaId !== messageHandler.tiktokTemp[from]?.messageId) {
          return;
        }

        const userChoice = message.message.extendedTextMessage.text.trim();
        
        try {
          if (!['1', '2'].includes(userChoice)) {
            await reply("⚠️ *Invalid choice! Please reply with 1 or 2*");
            return;
          }

          await reply("⏳ *Processing your request...*");

          const { videoUrl, audioUrl } = messageHandler.tiktokTemp[from];
          const downloadUrl = userChoice === '1' ? videoUrl : audioUrl;
          const fileType = userChoice === '1' ? 'video' : 'audio';
          const fileExt = userChoice === '1' ? 'mp4' : 'mp3';
          const tempFile = path.join(__dirname, '../temp', `tiktok_${Date.now()}.${fileExt}`);

          // Download the file
          const writer = fs.createWriteStream(tempFile);
          const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream',
            timeout: 60000
          });

          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', () => reject(new Error('Download failed')));
          });

          // Send the file
          if (fileType === 'video') {
            await messageHandler.sendMessage(from, {
              video: fs.readFileSync(tempFile),
              caption: `🎬 *TikTok Video*\n\n*Rasiya-MD Bot*`
            }, { quoted: quoted });
          } else {
            await messageHandler.sendMessage(from, {
              audio: fs.readFileSync(tempFile),
              mimetype: 'audio/mpeg',
              ptt: false,
              caption: `🎵 *TikTok Audio*\n\n*Rasiya-MD Bot*`
            }, { quoted: quoted });
          }

        } catch (error) {
          console.error('Download error:', error);
          await reply("❌ *Download failed!* Please try again later.");
        } finally {
          // Clean up
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
          delete messageHandler.tiktokTemp[from];
          messageHandler.ev.off('messages.upsert', handleResponse);
        }
      };

      // Add listener
      messageHandler.ev.on('messages.upsert', handleResponse);

      // Auto-remove listener after 2 minutes
      setTimeout(() => {
        if (messageHandler.tiktokTemp[from]) {
          delete messageHandler.tiktokTemp[from];
          messageHandler.ev.off('messages.upsert', handleResponse);
        }
      }, 120000);

    } catch (error) {
      console.error('API error:', error);
      throw new Error('Failed to get video information from TikTok');
    } finally {
      await messageHandler.deleteMessage(from, processingMsg.key);
    }

  } catch (error) {
    console.error('Main error:', error);
    reply(`❌ *Error:* ${error.message || 'Failed to process TikTok video'}`);
  }
});

const TikTokScraper = require('tiktok-scraper');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports = {
  name: "tiktok",
  alias: ["tt", "tiktokdl"],
  desc: "Download TikTok videos with multiple options",
  category: "Downloads",
  usage: `tiktok <video URL>`,
  react: "🎬",
  start: async (RasiyaMD, m, { text, prefix, args }) => {
    if (!args[0]) {
      await RasiyaMD.sendMessage(m.from, { 
        text: `Please provide a TikTok video URL!\n\nExample: ${prefix}tiktok https://vm.tiktok.com/xyz` 
      }, { quoted: m });
      return;
    }

    try {
      if (!text.match(/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/)) {
        await RasiyaMD.sendMessage(m.from, { 
          text: "❌ Invalid TikTok URL! Please provide a valid TikTok video link." 
        }, { quoted: m });
        return;
      }

      const processingMsg = await RasiyaMD.sendMessage(m.from, { 
        text: "⏳ Processing your TikTok video... Please wait!" 
      }, { quoted: m });

      const videoMeta = await TikTokScraper.getVideoMeta(text);
      const videoData = videoMeta.collector[0];
      
      // Prepare options message
      const optionsMsg = `🎬 *TikTok Video Options* \n\n` +
                        `1. *Download Video* (No Watermark)\n` +
                        `2. *Video Info* (Metadata only)\n` +
                        `3. *Download Audio Only*\n` +
                        `4. *All Above Options*\n\n` +
                        `*Reply with the number* of your choice (1-4)`;
      
      // Send options and store video data temporarily
      await RasiyaMD.sendMessage(m.from, { text: optionsMsg }, { quoted: m });
      
      // Store the video data for later use
      RasiyaMD.tiktokData = RasiyaMD.tiktokData || {};
      RasiyaMD.tiktokData[m.from] = {
        videoUrl: videoData.videoUrl,
        audioUrl: videoData.musicMeta.musicUrl,
        metadata: {
          author: videoData.authorMeta.name,
          description: videoData.text || "No description",
          duration: videoData.videoMeta.duration || "N/A",
          likes: videoData.diggCount || 0,
          comments: videoData.commentCount || 0,
          shares: videoData.shareCount || 0
        },
        timestamp: Date.now()
      };

      // Delete the processing message
      await RasiyaMD.deleteMessage(m.from, processingMsg.key);

      // Set up response handler
      RasiyaMD.on('message_create', async (response) => {
        if (response.from === m.from && 
            response.body.match(/^[1-4]$/) && 
            RasiyaMD.tiktokData[m.from] && 
            Date.now() - RasiyaMD.tiktokData[m.from].timestamp < 60000) {
          
          const choice = parseInt(response.body);
          const { videoUrl, audioUrl, metadata } = RasiyaMD.tiktokData[m.from];
          
          try {
            await RasiyaMD.sendMessage(m.from, { 
              text: `Processing your selection (Option ${choice})...` 
            }, { quoted: m });

            switch(choice) {
              case 1: // Video only
                await sendVideo(RasiyaMD, m, videoUrl, metadata);
                break;
              case 2: // Info only
                await sendInfo(RasiyaMD, m, metadata);
                break;
              case 3: // Audio only
                await sendAudio(RasiyaMD, m, audioUrl, metadata);
                break;
              case 4: // All options
                await sendInfo(RasiyaMD, m, metadata);
                await sendVideo(RasiyaMD, m, videoUrl, metadata);
                await sendAudio(RasiyaMD, m, audioUrl, metadata);
                break;
            }
          } catch (error) {
            console.error(error);
            await RasiyaMD.sendMessage(m.from, { 
              text: `❌ Error processing your request: ${error.message}` 
            }, { quoted: m });
          } finally {
            // Clean up
            delete RasiyaMD.tiktokData[m.from];
          }
        }
      });

    } catch (error) {
      console.error(error);
      await RasiyaMD.sendMessage(m.from, { 
        text: `❌ Error downloading TikTok video: ${error.message}` 
      }, { quoted: m });
    }
  }
};

// Helper functions
async function sendVideo(RasiyaMD, m, videoUrl, metadata) {
  const response = await axios({ method: 'GET', url: videoUrl, responseType: 'stream' });
  const tempFilePath = path.join(__dirname, `../temp/tiktok_${Date.now()}.mp4`);
  const writer = fs.createWriteStream(tempFilePath);
  
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const caption = `🎬 *TikTok Video*\n\n` +
                 `👤 *Author:* ${metadata.author}\n` +
                 `📝 *Description:* ${metadata.description}\n` +
                 `⏱️ *Duration:* ${metadata.duration}s`;

  await RasiyaMD.sendMessage(
    m.from,
    {
      video: fs.readFileSync(tempFilePath),
      caption: caption,
      gifPlayback: false
    },
    { quoted: m }
  );

  fs.unlinkSync(tempFilePath);
}

async function sendAudio(RasiyaMD, m, audioUrl, metadata) {
  const response = await axios({ method: 'GET', url: audioUrl, responseType: 'stream' });
  const tempFilePath = path.join(__dirname, `../temp/audio_${Date.now()}.mp3`);
  const writer = fs.createWriteStream(tempFilePath);
  
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const caption = `🎵 *TikTok Audio*\n\n` +
                 `👤 *Author:* ${metadata.author}\n` +
                 `⏱️ *Duration:* ${metadata.duration}s`;

  await RasiyaMD.sendMessage(
    m.from,
    {
      audio: fs.readFileSync(tempFilePath),
      mimetype: 'audio/mpeg',
      ptt: false,
      caption: caption
    },
    { quoted: m }
  );

  fs.unlinkSync(tempFilePath);
}

async function sendInfo(RasiyaMD, m, metadata) {
  const infoMsg = `📋 *TikTok Video Info*\n\n` +
                 `👤 *Author:* ${metadata.author}\n` +
                 `📝 *Description:* ${metadata.description}\n` +
                 `⏱️ *Duration:* ${metadata.duration}s\n` +
                 `❤️ *Likes:* ${metadata.likes.toLocaleString()}\n` +
                 `💬 *Comments:* ${metadata.comments.toLocaleString()}\n` +
                 `↗️ *Shares:* ${metadata.shares.toLocaleString()}`;

  await RasiyaMD.sendMessage(m.from, { text: infoMsg }, { quoted: m });
}

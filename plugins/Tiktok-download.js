const { getVideoMeta } = require('tiktok-scraper');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports = {
  name: "tt",
  alias: ["tiktok", "ttdl"],
  desc: "Download TikTok videos with interactive options",
  category: "Downloads",
  usage: "tt <TikTok URL>",
  react: "⬇️",
  start: async (RasiyaMD, m, { text, args }) => {
    if (!args[0]) {
      return RasiyaMD.sendMessage(m.from, {
        text: `🔍 *TikTok Downloader*\n\nඔබගේ TikTok URL ඇතුළත් කරන්න\nඋදාහරණය: *!tt https://vm.tiktok.com/XYZ*`
      }, { quoted: m });
    }

    try {
      const processingMsg = await RasiyaMD.sendMessage(m.from, {
        text: "⏳ TikTok වීඩියෝව විශ්ලේෂණය කරමින්..."
      }, { quoted: m });

      // Get video metadata
      const meta = await getVideoMeta(args[0]);
      const videoData = meta.collector[0];
      
      // Prepare options
      const options = {
        1: { text: "🎥 වීඩියෝව ඩවුන්ලෝඩ් කරන්න (ජල සලකුණු නැත)", type: "video" },
        2: { text: "🔈 ශ්‍රව්‍ය ගොනුව පමණක් ඩවුන්ලෝඩ් කරන්න", type: "audio" },
        3: { text: "📋 වීඩියෝ තොරතුරු පමණක් ලබා ගන්න", type: "info" },
        4: { text: "✨ සියල්ල ලබා ගන්න (වීඩියෝ, ශ්‍රව්‍ය, තොරතුරු)", type: "all" }
      };

      // Send options menu
      let optionsText = "📱 *TikTok Download Options*\n\n";
      Object.keys(options).forEach(num => {
        optionsText += `${num}. ${options[num].text}\n`;
      });
      optionsText += "\nඔබට අවශ්‍ය විකල්පයේ අංකය යොමු කරන්න (1-4)";

      await RasiyaMD.sendMessage(m.from, { text: optionsText }, { quoted: m });

      // Store video data temporarily
      RasiyaMD.tiktokTemp = RasiyaMD.tiktokTemp || {};
      RasiyaMD.tiktokTemp[m.from] = {
        videoUrl: videoData.videoUrl,
        audioUrl: videoData.musicMeta.musicUrl,
        metadata: {
          author: videoData.authorMeta.name,
          description: videoData.text,
          likes: videoData.diggCount,
          comments: videoData.commentCount,
          shares: videoData.shareCount,
          duration: videoData.videoMeta.duration
        },
        timestamp: Date.now()
      };

      // Delete processing message
      await RasiyaMD.deleteMessage(m.from, processingMsg.key);

      // Handle user selection
      RasiyaMD.on('message_create', async (msg) => {
        if (msg.from === m.from && 
            RasiyaMD.tiktokTemp[m.from] && 
            Date.now() - RasiyaMD.tiktokTemp[m.from].timestamp < 60000) {
          
          const choice = parseInt(msg.body);
          if (choice >= 1 && choice <= 4) {
            const { videoUrl, audioUrl, metadata } = RasiyaMD.tiktokTemp[m.from];
            
            try {
              await RasiyaMD.sendMessage(m.from, {
                text: `⚙️ ${options[choice].text}...`
              }, { quoted: m });

              switch(choice) {
                case 1:
                  await sendVideo(RasiyaMD, m, videoUrl, metadata);
                  break;
                case 2:
                  await sendAudio(RasiyaMD, m, audioUrl, metadata);
                  break;
                case 3:
                  await sendInfo(RasiyaMD, m, metadata);
                  break;
                case 4:
                  await sendInfo(RasiyaMD, m, metadata);
                  await sendVideo(RasiyaMD, m, videoUrl, metadata);
                  await sendAudio(RasiyaMD, m, audioUrl, metadata);
                  break;
              }
            } catch (error) {
              console.error(error);
              await RasiyaMD.sendMessage(m.from, {
                text: `❌ දෝෂය: ${error.message}`
              }, { quoted: m });
            } finally {
              delete RasiyaMD.tiktokTemp[m.from];
            }
          }
        }
      });

    } catch (error) {
      console.error(error);
      await RasiyaMD.sendMessage(m.from, {
        text: `❌ දෝෂය: ${error.message}\n\nURL එක නැවත පරීක්ෂා කරන්න හෝ පසුව උත්සාහ කරන්න`
      }, { quoted: m });
    }
  }
};

// Helper functions
async function sendVideo(RasiyaMD, m, url, meta) {
  const response = await axios.get(url, { responseType: 'stream' });
  const tempFile = path.join(__dirname, `../temp/tt_${Date.now()}.mp4`);
  const writer = fs.createWriteStream(tempFile);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const caption = `🎬 *${meta.author}*\n${meta.description || ''}\n\n❤️ ${meta.likes} | 💬 ${meta.comments} | ↗️ ${meta.shares}`;

  await RasiyaMD.sendMessage(
    m.from,
    {
      video: fs.readFileSync(tempFile),
      caption: caption,
      gifPlayback: false
    },
    { quoted: m }
  );

  fs.unlinkSync(tempFile);
}

async function sendAudio(RasiyaMD, m, url, meta) {
  const response = await axios.get(url, { responseType: 'stream' });
  const tempFile = path.join(__dirname, `../temp/tt_${Date.now()}.mp3`);
  const writer = fs.createWriteStream(tempFile);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const caption = `🎵 ${meta.author} - TikTok Audio`;

  await RasiyaMD.sendMessage(
    m.from,
    {
      audio: fs.readFileSync(tempFile),
      mimetype: 'audio/mpeg',
      ptt: false,
      caption: caption
    },
    { quoted: m }
  );

  fs.unlinkSync(tempFile);
}

async function sendInfo(RasiyaMD, m, meta) {
  const infoText = `📋 *TikTok Video Info*\n\n` +
                 `👤 *Author:* ${meta.author}\n` +
                 `📝 *Description:* ${meta.description || 'N/A'}\n` +
                 `⏱️ *Duration:* ${meta.duration}s\n` +
                 `❤️ *Likes:* ${meta.likes.toLocaleString()}\n` +
                 `💬 *Comments:* ${meta.comments.toLocaleString()}\n` +
                 `↗️ *Shares:* ${meta.shares.toLocaleString()}`;

  await RasiyaMD.sendMessage(m.from, { text: infoText }, { quoted: m });
}

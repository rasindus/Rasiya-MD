const { cmd } = require("../command");
const yts = require("yt-search");
const ytdl = require('ytdl-core');
const fs = require('fs');
const axios = require('axios');

cmd(
  {
    pattern: "song",
    react: "🎵",
    desc: "ගීත බාගත කිරීම සමඟ විස්තර",
    category: "music",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      // 1. පරිශීලක ආදානය පරීක්ෂා කිරීම
      if (!q) return reply("🎵 කරුණාකර ගීතයේ නම ඇතුළත් කරන්න\nඋදා: *ගැලුම් රන්මාලි*");

      // 2. සෙවුම් පණිවුඩය යැවීම
      const searchMsg = await reply("🔍 ඔබගේ ගීතය සොයමින්...");

      // 3. ගීතය සොයා ගැනීම
      const { videos } = await yts(q);
      if (!videos.length) {
        await robin.sendMessage(from, { delete: searchMsg.key });
        return reply("❌ ගීතය හමු නොවීය");
      }

      const video = videos[0];
      
      // 4. විස්තර සහිත මාධ්‍ය කාඩ්පත යැවීම
      await robin.sendMessage(from, {
        image: { url: video.thumbnail },
        caption: `✨ *${video.title}*\n\n` +
                 `👤 කලාකරු: ${video.author.name}\n` +
                 `⏱️ දිග: ${video.timestamp}\n` +
                 `👀 බැලුම්: ${video.views}\n` +
                 `📅 උඩුගත කලේ: ${video.ago}\n\n` +
                 `_ගීතය බාගන්න සූදානම් වෙමින්..._`
      }, { quoted: mek });

      // 5. ගීතය බාගත කිරීම - වැඩිදියුණු කළ ක්‍රමය
      const tempFile = `./temp_${Date.now()}.mp3`;
      
      // වැඩිදියුණු කළ බාගැනීමේ විකල්ප
      const audioStream = ytdl(video.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        dlChunkSize: 0,
      });

      const writer = fs.createWriteStream(tempFile);
      audioStream.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
        audioStream.on('error', reject);
      });

      // 6. ගීතය යැවීම - වැඩිදියුණු කළ ක්‍රමය
      await robin.sendMessage(from, {
        audio: { 
          url: video.url, // සෘජු URL භාවිතා කිරීම
          mimetype: 'audio/mpeg',
          ptt: false
        },
        fileName: `${video.title.replace(/[^\w\s]/gi, '')}.mp3`,
        mimetype: 'audio/mpeg'
      }, { quoted: mek });

      // 7. පිරිසිදු කිරීම
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      await robin.sendMessage(from, { delete: searchMsg.key });
      reply("✅ ගීතය සාර්ථකව යැව්වා!");

    } catch (error) {
      console.error('දෝෂය:', error);
      reply("❌ දෝෂය: " + error.message + "\nකරුණාකර නැවත උත්සාහ කරන්න");
      
      // දෝෂ තත්ත්වයේදී තාවකාලික ගොනු පිරිසිදු කිරීම
      if (tempFile && fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
);

const { cmd } = require("../command");
const yts = require("yt-search");
const ytdl = require('ytdl-core');
const fs = require('fs');

cmd(
  {
    pattern: "song",
    react: "👻", // Rasiya Bot ගේ අනන්‍ය ඉමොජි
    desc: "Rasiya Music Bot - ගීත බාගත කිරීම",
    category: "music",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      // 1. පරිශීලක ආදානය පරීක්ෂා කිරීම
      if (!q) {
        return await robin.sendMessage(from, {
          text: `👻 *Rasiya Music Bot* 👻\n\nගීතයේ නම හෝ YouTube ලින්ක් එක ඇතුළත් කරන්න\nඋදා: *හිත පැනලා*`,
          footer: "Rasiya Bot © 2024 - සංගීත ගවේෂණය",
          buttons: [
            { buttonId: `!help song`, buttonText: { displayText: "🆘 උදව්" }, type: 1 }
          ]
        }, { quoted: mek });
      }

      // 2. සෙවුම් පණිවුඩය යැවීම
      const searchMsg = await robin.sendMessage(from, {
        text: `👻 *Rasiya Bot* ඔබගේ ගීතය සොයමින්...\n"${q}"`,
        footer: "Rasiya Music Search"
      }, { quoted: mek });

      // 3. ගීතය සොයා ගැනීම
      const { videos } = await yts(q);
      if (!videos.length) {
        await robin.sendMessage(from, { delete: searchMsg.key });
        return reply("❌ Rasiya Botට ගීතය හමු නොවීය");
      }

      const video = videos[0];
      
      // 4. Rasiya-styled media card යැවීම
      await robin.sendMessage(from, {
        image: { url: video.thumbnail },
        caption: `👻 *Rasiya Music Player* 👻\n\n` +
                 `🎵 *${video.title}*\n` +
                 `👤 ${video.author.name}\n\n` +
                 `⏱️ ${video.timestamp} | 👀 ${video.views}\n` +
                 `📅 ${video.ago}\n\n` +
                 `_Rasiya Bot ගීතය සූදානම් කරමින්..._`,
        footer: "Powered by Rasiya Bot",
        buttons: [
          { buttonId: `!dl ${video.videoId}`, buttonText: { displayText: "⬇️ බාගන්න" }, type: 1 }
        ]
      }, { quoted: mek });

      // 5. ගීතය බාගත කිරීම
      const tempFile = `./rasiya_${Date.now()}.mp3`;
      const stream = ytdl(video.url, { 
        quality: 'highestaudio',
        highWaterMark: 1 << 25
      }).pipe(fs.createWriteStream(tempFile));

      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // 6. Rasiya-branded audio යැවීම
      await robin.sendMessage(from, {
        audio: fs.readFileSync(tempFile),
        mimetype: 'audio/mpeg',
        fileName: `${video.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: `Rasiya Bot - ${video.title}`,
            body: `කලාකරු: ${video.author.name}`,
            thumbnail: await downloadImage(video.thumbnail),
            mediaType: 2,
            sourceUrl: video.url
          }
        }
      }, { quoted: mek });

      // 7. පිරිසිදු කිරීම සහ අවසාන පණිවුඩය
      fs.unlinkSync(tempFile);
      await robin.sendMessage(from, { delete: searchMsg.key });
      await reply(`✅ *Rasiya Bot* විසින් "${video.title}" ගීතය සාර්ථකව යැව්වා!`);

    } catch (error) {
      console.error('Rasiya Bot Error:', error);
      await reply(`❌ Rasiya Bot: ${error.message}`);
    }
  }
);

// Helper function to download thumbnails
async function downloadImage(url) {
  const path = `./rasiya_thumb_${Date.now()}.jpg`;
  const writer = fs.createWriteStream(path);
  const response = await axios.get(url, { responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(fs.readFileSync(path)));
    writer.on('error', reject);
  });
}

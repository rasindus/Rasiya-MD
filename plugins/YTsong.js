const { cmd } = require("../command");
const yts = require("yt-search"); // නව yt-search පැකේජය භාවිතා කරයි
const ytdl = require('ytdl-core');
const fs = require('fs');

cmd(
  {
    pattern: "song",
    react: "🎵",
    desc: "Download songs with full metadata",
    category: "music",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎵 ගීතයේ නම හෝ YouTube ලින්ක් එක ඇතුළත් කරන්න\nඋදා: *Shape of You*");

      // 1. Show searching message
      const searchMsg = await reply("🔍 ඔබගේ ගීතය සොයමින්...");

      // 2. Search using yt-search package (more reliable)
      let videoUrl;
      if (ytdl.validateURL(q)) {
        videoUrl = q;
      } else {
        const searchResults = await yts(q);
        if (!searchResults.videos.length) {
          await robin.sendMessage(from, { delete: searchMsg.key });
          return reply("❌ ගීතය හමු නොවීය. වෙනත් නමක් උත්සාහ කරන්න");
        }
        videoUrl = searchResults.videos[0].url;
      }

      // 3. Get video info
      const info = await ytdl.getInfo(videoUrl);
      const { title, author, lengthSeconds, viewCount, uploadDate, thumbnails } = info.videoDetails;

      // 4. Send metadata preview
      await robin.sendMessage(from, {
        image: { url: thumbnails[thumbnails.length-1].url },
        caption: `🎵 *${title}*\n👤 ${author.name || "Unknown Artist"}\n\n` +
                 `⏱️ දිග: ${formatTime(lengthSeconds)}\n` +
                 `👀 බැලුම්: ${formatViews(viewCount)}\n` +
                 `📅 උඩුගත කලේ: ${new Date(uploadDate).toLocaleDateString()}\n\n` +
                 `_ගීතය බාගන්න සූදානම් වෙමින්..._`
      }, { quoted: mek });

      // 5. Download and send audio
      const tempFile = `./temp_${Date.now()}.mp3`;
      const stream = ytdl(videoUrl, { quality: 'highestaudio' })
        .pipe(fs.createWriteStream(tempFile));

      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      await robin.sendMessage(from, {
        audio: fs.readFileSync(tempFile),
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`
      }, { quoted: mek });

      // 6. Cleanup
      fs.unlinkSync(tempFile);
      await robin.sendMessage(from, { delete: searchMsg.key });
      await reply("✅ ගීතය සාර්ථකව බාගත කර ඇත!");

    } catch (error) {
      console.error('Error:', error);
      reply(`❌ දෝෂය: ${error.message}\nකරුණාකර නැවත උත්සාහ කරන්න`);
    }
  }
);

// Helper functions
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s]
    .filter(Boolean)
    .join(':');
}

function formatViews(views) {
  return parseInt(views).toLocaleString();
}

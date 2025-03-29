const { cmd } = require("../command");
const ytdl = require('ytdl-core');
const fs = require('fs');
const axios = require('axios');

cmd(
  {
    pattern: "song",
    react: "🎵",
    desc: "Download songs with full metadata preview",
    category: "music",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      // 1. Check user input
      if (!q) {
        return await robin.sendMessage(from, {
          text: `🎵 *Rasiya Music Bot* 🎵\n\nPlease enter a song name or YouTube link\nExample: *Shape of You - Ed Sheeran*`,
          footer: "Rasiya Bot © 2024"
        }, { quoted: mek });
      }

      // 2. Show searching status
      const searchMsg = await robin.sendMessage(from, {
        text: `🔍 Searching for "${q}"...`,
        footer: "Please wait..."
      }, { quoted: mek });

      // 3. Get video info with full metadata
      const info = await ytdl.getInfo(ytdl.validateURL(q) ? q : await searchYoutube(q));
      const { 
        title, 
        author, 
        lengthSeconds, 
        viewCount, 
        uploadDate,
        video_url,
        thumbnails
      } = info.videoDetails;

      const thumbnail = thumbnails[thumbnails.length - 1].url;

      // 4. Format metadata
      const duration = formatTime(lengthSeconds);
      const views = formatViews(viewCount);
      const upload = formatDate(uploadDate);
      const artist = author.name || "Unknown Artist";

      // 5. Send rich media card with all details
      await robin.sendMessage(from, {
        image: { url: thumbnail },
        caption: `🎵 *${title}*\n👤 ${artist}\n\n` +
                 `⏱️ Duration: ${duration}\n` +
                 `👀 Views: ${views}\n` +
                 `📅 Uploaded: ${upload}\n\n` +
                 `_Preparing your audio download..._`,
        footer: "Rasiya Music Bot"
      }, { quoted: mek });

      // 6. Download audio
      const tempFile = `./temp_${Date.now()}.mp3`;
      await new Promise((resolve, reject) => {
        ytdl(video_url, { quality: 'highestaudio' })
          .pipe(fs.createWriteStream(tempFile))
          .on('finish', resolve)
          .on('error', reject);
      });

      // 7. Send audio file
      await robin.sendMessage(from, {
        audio: fs.readFileSync(tempFile),
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`
      }, { quoted: mek });

      // 8. Cleanup
      fs.unlinkSync(tempFile);
      await robin.sendMessage(from, { delete: searchMsg.key });
      await reply(`✅ "${title}" downloaded successfully!`);

    } catch (error) {
      console.error('Error:', error);
      await reply(`❌ Error: ${error.message}\nPlease try again`);
    }
  }
);

/* Helper Functions */
async function searchYoutube(query) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const response = await axios.get(searchUrl);
  const videoId = response.data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)[1];
  return `https://www.youtube.com/watch?v=${videoId}`;
}

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

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

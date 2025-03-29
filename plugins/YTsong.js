const { cmd } = require("../command");
const ytdl = require('ytdl-core');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');

cmd(
  {
    pattern: "song",
    react: "🎼",
    desc: "Download songs with complete metadata preview",
    category: "music",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      // 1. Check user input
      if (!q) {
        return await robin.sendMessage(from, {
          text: `🎵 *Rasiya Music Bot* 🎵\n\nගීතයේ නම හෝ YouTube ලින්ක් එක ඇතුළත් කරන්න\nඋදා: *!song Shape of You - Ed Sheeran*`,
          footer: "Rasiya Bot © 2024",
          buttons: [
            { buttonId: `${prefix}help song`, buttonText: { displayText: "🆘 උදව්" }, type: 1 }
          ]
        }, { quoted: mek });
      }

      // 2. Show searching status
      const searchMsg = await robin.sendMessage(from, {
        text: `🔍 *Rasiya Bot* "${q}" සඳහා සොයමින්...`,
        footer: "කරුණාකර රැඳී සිටින්න..."
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
        caption: `✨ *Rasiya Music Player* ✨\n\n` +
                 `🎵 *${title}*\n` +
                 `👤 ${artist}\n\n` +
                 `⏱️ *Duration:* ${duration}\n` +
                 `👀 *Views:* ${views}\n` +
                 `📅 *Uploaded:* ${upload}\n\n` +
                 `🔗 *YouTube Link:*\n${video_url}\n\n` +
                 `_ප්‍රමාණවත් තරම් තොරතුරු ලබා ගැනීමට ගීතය බාගන්න..._`,
        footer: "Rasiya Bot - Premium Music Experience",
        buttons: [
          { buttonId: `${prefix}download ${info.videoDetails.videoId}`, buttonText: { displayText: "⬇️ Download" }, type: 1 },
          { buttonId: `${prefix}lyrics ${title}`, buttonText: { displayText: "📜 Lyrics" }, type: 1 }
        ]
      }, { quoted: mek });

      // 6. Download and process audio
      const tempFile = `./temp_${Date.now()}.mp3`;
      await new Promise((resolve, reject) => {
        ytdl(video_url, { quality: 'highestaudio' })
          .pipe(fs.createWriteStream(tempFile))
          .on('finish', resolve)
          .on('error', reject);
      });

      // 7. Send audio with metadata
      await robin.sendMessage(from, {
        audio: fs.readFileSync(tempFile),
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: title,
            body: `By ${artist} | ${views} views`,
            thumbnail: await downloadImage(thumbnail),
            mediaType: 2,
            sourceUrl: video_url
          }
        }
      }, { quoted: mek });

      // 8. Cleanup
      fs.unlinkSync(tempFile);
      await robin.sendMessage(from, { delete: searchMsg.key });
      await reply(`✅ *${title}* successfully downloaded!\nEnjoy your music with Rasiya Bot 🎧`);

    } catch (error) {
      console.error('Error:', error);
      await reply(`❌ Error: ${error.message}\nPlease try again or use *${prefix}help song*`);
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
    month: 'long', 
    day: 'numeric' 
  });
}

async function downloadImage(url) {
  const path = `./thumb_${Date.now()}.jpg`;
  const writer = fs.createWriteStream(path);
  const response = await axios.get(url, { responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(fs.readFileSync(path)));
    writer.on('error', reject);
  });
}

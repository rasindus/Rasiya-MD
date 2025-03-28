const { cmd } = require("../command");
const yts = require("yt-search");
const ytdl = require("ytdl-core");
const fs = require("fs");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);

cmd(
  {
    pattern: "song",
    react: "🎵",
    desc: "YouTube සිට ගීත බාගන්න",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, reply, q }) => {
    try {
      if (!q) return reply("🎵 ගීතයේ නම හෝ YouTube ලින්ක් එකක් ඇතුළත් කරන්න");

      // ගීතය සොයමින්
      const search = await yts(q);
      if (!search.videos.length) return reply("❌ ගීතය හමු නොවීය");

      const video = search.videos[0];
      const url = video.url;

      // වීඩියෝ තොරතුරු එවන්න
      const infoMsg = `
🎧 ${video.title}  
⏳ කාලය: ${video.timestamp}  
👀 බැලූම්: ${video.views}  
🔗 ලින්ක්: ${url}

බාගැනීම ආරම්භ වී ඇත...
      `;
      await robin.sendMessage(from, { 
        image: { url: video.thumbnail }, 
        caption: infoMsg 
      }, { quoted: mek });

      // ගීතය බාගන්න
      const audioStream = ytdl(url, { 
        filter: "audioonly",
        quality: "highestaudio"
      });

      // ගොනුවට සුරකින්න (optional)
      const tempFile = ./temp/${Date.now()}.mp3;
      await pipeline(
        audioStream,
        fs.createWriteStream(tempFile)
      );

      // ගීතය එවන්න
      await robin.sendMessage(
        from,
        {
          audio: fs.readFileSync(tempFile),
          mimetype: "audio/mpeg",
          fileName: ${video.title}.mp3,
        },
        { quoted: mek }
      );

      // තාවකාලික ගොනුව මකන්න
      fs.unlinkSync(tempFile);

    } catch (err) {
      console.error("ගීත දෝෂය:", err);
      reply(❌ error: ${err.message});
    }
  }
);

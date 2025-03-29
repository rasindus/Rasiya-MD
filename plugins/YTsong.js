const { cmd, commands } = require("../command");
const axios = require("axios");
const ytdl = require("ytdl-core");

// Replace with your actual YouTube API key
const YOUTUBE_API_KEY = "AIzaSyCL6pud2G9hnXPRCVfuDzktHCEywi5JqcU";

cmd(
  {
    pattern: "song",
    react: "🎵",
    desc: "Download Song",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("*නමක් හරි ලින්ක් එකක් හරි දෙන්න* 🌚❤️");

      let videoInfo;
      let isUrl = false;

      // Check if input is a YouTube URL
      if (ytdl.validateURL(q)) {
        isUrl = true;
        videoInfo = await ytdl.getInfo(q);
      } else {
        // Search using YouTube API
        const searchResponse = await axios.get(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`
        );

        if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
          return reply("❌ No results found for your search.");
        }

        const videoId = searchResponse.data.items[0].id.videoId;
        videoInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
      }

      const data = {
        title: videoInfo.videoDetails.title,
        description: videoInfo.videoDetails.description,
        timestamp: videoInfo.videoDetails.lengthSeconds,
        ago: videoInfo.videoDetails.uploadDate,
        views: videoInfo.videoDetails.viewCount,
        url: videoInfo.videoDetails.video_url,
        thumbnail: videoInfo.videoDetails.thumbnails[0].url
      };

      let desc = `
*❤️R_A_S_I_Y_A❤️ SONG DOWNLOADER❤️*

👻 *title* : ${data.title}
👻 *description* : ${data.description.substring(0, 100)}...
👻 *duration* : ${formatDuration(data.timestamp)}
👻 *uploaded* : ${data.ago}
👻 *views* : ${data.views}
👻 *url* : ${data.url}

𝐌𝐚𝐝𝐞 𝐛𝐲 ❤️R_A_S_I_Y_A❤️
`;

      await robin.sendMessage(
        from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      // Check duration limit (30 minutes = 1800 seconds)
      if (parseInt(data.timestamp) > 1800) {
        return reply("⏱️ audio limit is 30 minutes");
      }

      // Get audio stream
      const audioStream = ytdl(data.url, {
        filter: "audioonly",
        quality: "highestaudio"
      });

      await robin.sendMessage(
        from,
        {
          audio: { stream: audioStream },
          mimetype: "audio/mpeg",
        },
        { quoted: mek }
      );

      return reply("*Thanks for using my bot* 🌚❤️");

    } catch (e) {
      console.error("Error in song command:", e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);

// Helper function to format seconds into HH:MM:SS
function formatDuration(seconds) {
  seconds = parseInt(seconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [hours, minutes, secs]
    .map(v => v < 10 ? "0" + v : v)
    .filter((v, i) => v !== "00" || i > 0)
    .join(":");
}

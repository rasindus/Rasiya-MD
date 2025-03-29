const { cmd, commands } = require("../command");
const axios = require("axios");
const ytdl = require("ytdl-core");

// ඔබගේ YouTube API Key එක මෙතන යොදන්න
const YOUTUBE_API_KEY = "AIzaSyCL6pud2G9hnXPRCVfuDzktHCEywi5JqcU";

cmd(
  {
    pattern: "song",
    react: "🎵",
    desc: "ගීතය බාගන්න (YouTube API මගින්)",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("කරුණාකර ගීතයේ නම හෝ YouTube ලින්ක් එකක් ඇතුළත් කරන්න");

      let videoId;
      let videoInfo;

      // ඇතුළත් කළේ URL දැයි පරීක්ෂා කරන්න
      if (ytdl.validateURL(q)) {
        videoId = ytdl.getURLVideoID(q);
      } else {
        // YouTube API භාවිතයෙන් සෙවුම් කරන්න
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}&type=video`;
        
        const searchResponse = await axios.get(searchUrl);
        
        if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
          return reply("සෙවුම් ප්‍රතිඵල හමු නොවීය");
        }

        videoId = searchResponse.data.items[0].id.videoId;
      }

      // වීඩියෝ තොරතුරු ලබා ගන්න
      videoInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
      const details = videoInfo.videoDetails;

      // ධාවන කාලය ආකෘතිගත කරන්න
      const duration = formatTime(details.lengthSeconds);

      // පණිවුඩය සකස් කරන්න
      const message = `
🎵 *ගීත තොරතුරු* 🎵

📌 *තේමාව*: ${details.title}
👩‍🎤 *කලාකරු*: ${details.author.name}
⏱️ *කාලය*: ${duration}
👀 *බැලුම්*: ${details.viewCount}
📅 *උඩුගත කළ දිනය*: ${new Date(details.uploadDate).toLocaleDateString()}
🔗 *සබැඳිය*: ${details.video_url}

Powered by ❤️R_A_S_I_Y_A❤️
`;

      // තම්බ්නේල් රූපය සහ තොරතුරු යවන්න
      await robin.sendMessage(
        from,
        { 
          image: { url: details.thumbnails[3].url }, // උසස් තම්බ්නේල් රූපය
          caption: message 
        },
        { quoted: mek }
      );

      // ගීතයේ දිග පරීක්ෂා කරන්න (30 මිනිත්තු තුළදී)
      if (parseInt(details.lengthSeconds) > 1800) {
        return reply("⚠️ ගීතය 30 මිනිත්තු වලට වැඩි විය නොහැක");
      }

      // ගීතය බාගන්න
      const audioStream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25
      });

      // ගීතය යවන්න
      await robin.sendMessage(
        from,
        {
          audio: { stream: audioStream },
          mimetype: "audio/mpeg",
          fileName: `${details.title.replace(/[^\w\s]/gi, '')}.mp3` // විශේෂ අක්ෂ ඉවත් කරන්න
        },
        { quoted: mek }
      );

      return reply("ගීතය සාර්ථකව බාගත කරන ලදී! 🎧");

    } catch (error) {
      console.error("දෝෂය:", error);
      
      if (error.response && error.response.status === 403) {
        return reply("❌ API Key එක වලංගු නැත හෝ quota ඉවරයි. කරුණාකර API Key එක පරීක්ෂා කරන්න");
      } else if (error.message.includes("Video unavailable")) {
        return reply("❌ වීඩියෝව ලබා ගත නොහැකිය");
      } else {
        return reply(`දෝෂයක් ඇතිවිය: ${error.message}`);
      }
    }
  }
);

// තත්පර HH:MM:SS බවට පරිවර්තනය කිරීම
function formatTime(seconds) {
  seconds = parseInt(seconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [hours, minutes, secs]
    .map(v => v < 10 ? "0" + v : v)
    .filter((v, i) => v !== "00" || i > 0)
    .join(":");
}

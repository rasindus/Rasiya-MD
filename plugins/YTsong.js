const { cmd, commands } = require("../command");
const axios = require("axios");
const ytdl = require("ytdl-core");
const { yts } = require("yt-search");

cmd(
  {
    pattern: "song",
    react: "🎵",
    desc: "ගීතය බාගන්න (යාවත්කාලීන කළ විසඳුම)",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("කරුණාකර ගීතයේ නම හෝ YouTube ලින්ක් එකක් ඇතුළත් කරන්න");

      let videoId;
      let videoInfo;

      // URL වලංගුදැයි පරීක්ෂා කරන්න
      if (ytdl.validateURL(q)) {
        try {
          videoId = ytdl.getURLVideoID(q);
        } catch (e) {
          return reply("❌ අවලංගු YouTube ලින්ක් එකකි");
        }
      } else {
        // yt-search භාවිතා කරමින් සරල සෙවුම
        const searchResults = await yts(q);
        if (!searchResults.videos || searchResults.videos.length === 0) {
          return reply("සෙවුම් ප්‍රතිඵල හමු නොවීය");
        }
        videoId = searchResults.videos[0].videoId;
      }

      // ytdl-core විකල්ප සහිතව තොරතුරු ලබා ගන්න
      videoInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, {
        requestOptions: {
          headers: {
            'Accept': 'text/html,application/xhtml+xml',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      }).catch(async err => {
        console.error("ytdl-core දෝෂය:", err);
        // උපරිම විකල්ප උත්සාහ කරන්න
        return await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, {
          lang: 'en',
          requestOptions: {
            headers: {
              'Accept-Language': 'en-US,en;q=0.9'
            }
          }
        });
      });

      const details = videoInfo.videoDetails;
      const duration = formatDuration(details.lengthSeconds);

      // පණිවුඩය සකස් කරන්න
      const message = `
🎵 *ගීත තොරතුරු* 🎵

📌 *තේමාව*: ${details.title}
👩‍🎤 *කලාකරු*: ${details.author.name}
⏱️ *කාලය*: ${duration}
👀 *බැලුම්*: ${parseInt(details.viewCount).toLocaleString()}
🔗 *සබැඳිය*: ${details.video_url}

Powered by ❤️R_A_S_I_Y_A❤️
`;

      // තොරතුරු යවන්න
      await robin.sendMessage(
        from,
        { 
          image: { url: details.thumbnails[3].url }, 
          caption: message 
        },
        { quoted: mek }
      );

      // කාලය පරීක්ෂා කරන්න (30 මිනිත්තු)
      if (parseInt(details.lengthSeconds) > 1800) {
        return reply("⚠️ ගීතය 30 මිනිත්තු වලට වැඩි විය නොහැක");
      }

      // ගීතය බාගන්න (හැකිලීම් වලට එරෙහිව විවිධ විකල්ප)
      const audioStream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        }
      });

      // ගීතය යවන්න
      await robin.sendMessage(
        from,
        {
          audio: { stream: audioStream },
          mimetype: "audio/mpeg",
          fileName: `${details.title.replace(/[^\w\s]/gi, '')}.mp3`
        },
        { quoted: mek }
      );

      return reply("ගීතය සාර්ථකව බාගත කරන ලදී! 🎧");

    } catch (error) {
      console.error("දෝෂය:", error);
      
      if (error.message.includes("410")) {
        return reply("❌ YouTube විසින් ඉල්ලුම අවහිර කර ඇත. කරුණාකර පසුව උත්සාහ කරන්න හෝ වීඩියෝ ලින්ක් එක පරීක්ෂා කරන්න");
      } else if (error.message.includes("Video unavailable")) {
        return reply("❌ වීඩියෝව ලබා ගත නොහැකිය හෝ රටවල් සීමාවන් නිසා බාධා වී ඇත");
      } else {
        return reply(`දෝෂයක් ඇතිවිය: ${error.message}`);
      }
    }
  }
);

// කාලය ආකෘතිගත කිරීම
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

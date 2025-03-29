const { cmd, commands } = require("../command");
const yts = require("yt-search");
const { ytmp3 } = require("@vreden/youtube_scraper");

cmd(
  {
    pattern: "song",
    react: "🎵",
    desc: "Download Song",
    category: "download",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    {
      from,
      quoted,
      body,
      isCmd,
      command,
      args,
      q,
      isGroup,
      sender,
      senderNumber,
      botNumber2,
      botNumber,
      pushname,
      isMe,
      isOwner,
      groupMetadata,
      groupName,
      participants,
      groupAdmins,
      isBotAdmins,
      isAdmins,
      reply,
    }
  ) => {
    try {
      if (!q) return reply("*නමක් හරි ලින්ක් එකක් හරි දෙන්න* 🌚❤️");

      // Search for the video
      const search = await yts(q);
      if (!search || !search.videos || search.videos.length === 0) {
        return reply("*සෙවුමට ගැලපෙන වීඩියෝවක් හමු නොවීය* ❌");
      }

      const data = search.videos[0];
      if (!data || !data.url) {
        return reply("*වීඩියෝ දත්ත ලබා ගැනීමට අපොහොසත් විය* ❌");
      }

      const url = data.url;
      const quality = "128"; // Default quality

      // Song metadata description
      let desc = `
*❤️R_A_S_I_Y_A❤️ SONG DOWNLOADER❤️*

👻 *title* : ${data.title || "N/A"}
👻 *description* : ${data.description || "N/A"}
👻 *time* : ${data.timestamp || "N/A"}
👻 *ago* : ${data.ago || "N/A"}
👻 *views* : ${data.views || "N/A"}
👻 *url* : ${data.url}

Made by rasindu❤️
`;

      // Send metadata thumbnail message
      await robin.sendMessage(
        from,
        { 
          image: { url: data.thumbnail || "https://i.ytimg.com/vi/default.jpg" }, 
          caption: desc 
        },
        { quoted: mek }
      );

      // Download the audio
      const songData = await ytmp3(url, quality);
      if (!songData || !songData.download || !songData.download.url) {
        return reply("*ඔඩියෝ බාගත කිරීමට අපොහොසත් විය* ❌");
      }

      // Validate song duration (limit: 30 minutes)
      if (data.timestamp) {
        let durationParts = data.timestamp.split(":").map(Number);
        let totalSeconds =
          durationParts.length === 3
            ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
            : durationParts[0] * 60 + durationParts[1];

        if (totalSeconds > 1800) {
          return reply("⏱️ audio limit is 30 minutes");
        }
      }

      // Send audio file
      await robin.sendMessage(
        from,
        {
          audio: { url: songData.download.url },
          mimetype: "audio/mpeg",
        },
        { quoted: mek }
      );

      // Send as a document (optional)
      await robin.sendMessage(
        from,
        {
          document: { url: songData.download.url },
          mimetype: "audio/mpeg",
          fileName: `${(data.title || "audio").replace(/[^\w\s]/gi, '')}.mp3`,
          caption: "𝐌𝐚𝐝𝐞 𝐛𝐲 ❤️R_A_S_I_Y_A❤️",
        },
        { quoted: mek }
      );

      return reply("*Thanks for using my bot* 🌚❤️");
    } catch (e) {
      console.error("Song download error:", e);
      reply(`❌ දෝෂය: ${e.message || "Unknown error occurred"}`);
    }
  }
);

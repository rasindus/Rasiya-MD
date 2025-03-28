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
      if (!q) return reply("Please provide a song name or YouTube link ❤️");

      // Search for the video
      const search = await yts(q);
      if (!search || !search.videos || search.videos.length === 0) {
        return reply("No videos found for your query ❌");
      }

      const data = search.videos[0];
      if (!data || !data.url) {
        return reply("Invalid video data received ❌");
      }

      const url = data.url;
      console.log("Video URL:", url); // Debug log

      // Song metadata description
      let desc = `
❤️ SONG DOWNLOADER ❤️

🎵 Title: ${data.title || 'N/A'}
📝 Description: ${data.description?.substring(0, 100) || 'N/A'}...
⏱️ Duration: ${data.timestamp || 'N/A'}
📅 Uploaded: ${data.ago || 'N/A'}
👀 Views: ${data.views || 'N/A'}
🔗 URL: ${data.url || 'N/A'}

Made with ❤️
`;

      // Send metadata thumbnail message
      if (data.thumbnail) {
        await robin.sendMessage(
          from,
          { image: { url: data.thumbnail }, caption: desc },
          { quoted: mek }
        );
      } else {
        await reply(desc);
      }

      // Download the audio
      const quality = "128"; // Default quality
      const songData = await ytmp3(url, quality);
      
      if (!songData || !songData.download || !songData.download.url) {
        return reply("Failed to download audio ❌");
      }

      console.log("Download URL:", songData.download.url); // Debug log

      // Validate song duration
      if (data.timestamp) {
        let durationParts = data.timestamp.split(":").map(Number);
        let totalSeconds =
          durationParts.length === 3
            ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
            : durationParts[0] * 60 + durationParts[1];

        if (totalSeconds > 1800) {
          return reply("⏱️ Audio limit is 30 minutes");
        }
      }

      // Send audio file
      await robin.sendMessage(
        from,
        {
          audio: { url: songData.download.url },
          mimetype: "audio/mpeg",
          fileName: ${songData.title || 'audio'}.mp3,
        },
        { quoted: mek }
      );

      return reply("Enjoy your music! 🎧❤️");
    } catch (e) {
      console.error("Error in song command:", e);
      reply('❌ Error: ${e.message}Please try again later.');
    }
  }
);

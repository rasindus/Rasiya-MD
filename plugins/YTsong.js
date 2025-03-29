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
    { from, q, reply }
  ) => {
    try {
      if (!q) return reply("*නමක් හරි ලින්ක් එකක් හරි දෙන්න* 🌚❤️");

      const search = await yts(q);
      if (!search.videos || search.videos.length === 0) {
        return reply("❌ No results found for your search.");
      }
      const data = search.videos[0];
      const url = data.url;

      let desc = `
*❤️R_A_S_I_Y_A❤️ SONG DOWNLOADER❤️*

👻 *title* : ${data.title}
👻 *description* : ${data.description}
👻 *time* : ${data.timestamp}
👻 *ago* : ${data.ago}
👻 *views* : ${data.views}
👻 *url* : ${data.url}

𝐌𝐚𝐝𝐞 𝐛𝐲 ❤️R_A_S_I_Y_A❤️
`;

      await robin.sendMessage(
        from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      const quality = "128";
      const songData = await ytmp3(url, quality);

      if (!songData || !songData.download || !songData.download.url) {
        return reply("❌ Failed to download the song. Please try again later.");
      }

      let durationParts = data.timestamp.split(":").map(Number);

      if (durationParts && durationParts.length > 0) {
        let totalSeconds =
          durationParts.length === 3
            ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
            : durationParts[0] * 60 + durationParts[1];

        if (totalSeconds > 1800) {
          return reply("⏱️ audio limit is 30 minutes");
        }
      } else {
        return reply("❌ Error getting song duration");
      }

      await robin.sendMessage(
        from,
        {
          audio: { url: songData.download.url },
          mimetype: "audio/mpeg",
        },
        { quoted: mek }
      );

      await robin.sendMessage(
        from,
        {
          document: { url: songData.download.url },
          mimetype: "audio/mpeg",
          fileName: `${data.title}.mp3`,
          caption: "𝐌𝐚𝐝𝐞 𝐛𝐲 ❤️R_A_S_I_Y_A❤️",
        },
        { quoted: mek }
      );

      return reply("*Thanks for using my bot* 🌚❤️");
    } catch (e) {
      console.error("Error in song command:", e); // Log the error for debugging
      reply(`❌ Error: ${e.message}`);
    }
  }
);

const { cmd, commands } = require("../command");
//Potential fix, if default export.
const getFbVideoInfo = require("fb-downloader-scrapper").default;

cmd(
  {
    pattern: "fb",
    alias: ["facebook"],
    react: "👻",
    desc: "Download Facebook Video",
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
      if (!q) return reply("*Please provide a valid Facebook video URL!* 🌚❤️");

      const fbRegex = /(https?:\/\/)?(www\.)?(facebook|fb)\.com\/.+/;
      if (!fbRegex.test(q))
        return reply("*Invalid Facebook URL! Please check and try again.* 🌚");

      reply("*Downloading your video...* 🌚❤️");

      const result = await getFbVideoInfo(q);

      if (!result || (!result.sd && !result.hd)) {
        return reply("*Failed to download video. Please try again later.* 🌚");
      }

      const { title, sd, hd } = result;

      let desc = `
*❤️R_A_S_I_Y_A❤️ FB VIDEO DOWNLOADER ❤️*

👻 *Title*: ${title || "Unknown"}
👻 *Quality*: ${hd ? "HD Available" : "SD Only"}

𝙼𝙰𝙳𝙴 𝙱𝚈 𝚁𝙰𝚂𝙸𝙽𝙳𝚄_®
        `;
      await robin.sendMessage(
        from,
        {
          image: {
            url: "https://raw.githubusercontent.com/Dark-Robin/Bot-Helper/refs/heads/main/autoimage/Bot%20fb-1.jpg",
          },
          caption: desc,
        },
        { quoted: mek }
      );

      if (hd) {
        await robin.sendMessage(
          from,
          { video: { url: hd }, caption: "----------HD VIDEO----------" },
          { quoted: mek }
        );
        await robin.sendMessage(
          from,
          { video: { url: sd }, caption: "----------SD VIDEO----------" },
          { quoted: mek }
        );
      } else if (sd) {
        await robin.sendMessage(
          from,
          { video: { url: sd }, caption: "----------SD VIDEO----------" },
          { quoted: mek }
        );
      } else {
        return reply("*No downloadable video found!* 🌚");
      }

      return reply("*Thanks for using ❤️R_A_S_I_Y_A❤️ bot* 🇱🇰");
    } catch (e) {
      console.error(e);
      reply(`*Error:* ${e.message || e}`);
    }
  }
);

const { cmd, commands } = require("../command");
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();

// Store pending downloads
const pendingDownloads = new Map();

// Helper function to extract YouTube ID from URL
const replaceYouTubeID = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

cmd(
  {
    pattern: "song",
    alias: ["ytmp3", "ytmp3dl"],
    react: "🎵",
    desc: "Download Ytmp3",
    category: "download",
    use: ".song <Text or YT URL>",
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
      if (!q) {
        return await reply("❌ Please provide a Query or Youtube URL! Ex: `.song lelena`");
      }

      let id = null;
      if (q.startsWith("https://")) {
        id = replaceYouTubeID(q);
        if (!id) return await reply("❌ Invalid YouTube URL!");
      }

      if (!id) {
        const searchResults = await dy_scrap.ytsearch(q);
        if (!searchResults?.results?.length) return await reply("❌ No results found!");
        id = searchResults.results[0].videoId;
      }

      const response = await dy_scrap.ytmp3(`https://youtube.com/watch?v=${id}`);
      if (!response?.status) return await reply("❌ Failed to fetch video!");

      const { url, title, description, image, timestamp, ago, views, author } = response.result.data;

      // Validate song duration (limit: 30 minutes)
      let durationParts = timestamp.split(":").map(Number);
      let totalSeconds =
        durationParts.length === 3
          ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
          : durationParts[0] * 60 + durationParts[1];
      if (totalSeconds > 1800) {
        return await reply("⏱️ Audio limit is 30 minutes");
      }

      // Song metadata with choice prompt
      let info = `
🍄 *𝚂𝙾𝙽𝙶 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁* 🍄

🎵 *Title:* ${title || "Unknown"}
📝 *Description:* ${description || "N/A"}
⏳ *Duration:* ${timestamp || "Unknown"}
📅 *Released:* ${ago || "Unknown"}
👀 *Views:* ${views || "Unknown"}
🔗 *URL:* ${url || "Unknown"}

🔽 *Reply with your choice:*
1️⃣ Audio Type 🎵
2️⃣ Document Type 📁
3️⃣ Both

𝐌𝐚𝐝𝐞 𝐛𝐲 Rasiya boy👻
`;

      // Send metadata with choice prompt
      const sentMsg = await robin.sendMessage(
        from,
        { image: { url: image }, caption: info },
        { quoted: mek }
      );
      const messageID = sentMsg.key.id;

      // React to indicate waiting for input
      await robin.sendMessage(from, { react: { text: "🎶", key: sentMsg.key } });

      // Store song data for later use
      pendingDownloads.set(messageID, { songData: response.result, data: { title, url }, from, mek });

      // Event listener for user reply
      robin.ev.on("messages.upsert", async (messageUpdate) => {
        const mekInfo = messageUpdate.messages[0];
        if (!mekInfo.message) return;

        const isReplyToSentMsg =
          mekInfo.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
        if (isReplyToSentMsg && pendingDownloads.has(messageID)) {
          const { songData, data, from, mek } = pendingDownloads.get(messageID);
          const userReply =
            mekInfo.message.conversation || mekInfo.message.extendedTextMessage.text;
          let choice = userReply.trim();

          // Process user's choice
          if (choice === "1" || choice === "2" || choice === "3") {
            const processingMsg = await robin.sendMessage(
              from,
              { text: "⏳ Processing..." },
              { quoted: mek }
            );

            let videoUrl = songData.download.url;
            if (!videoUrl) return await reply("❌ Download link not found!");

            if (choice === "1") {
              // Send audio
              await robin.sendMessage(
                from,
                { audio: { url: videoUrl }, mimetype: "audio/mpeg" },
                { quoted: mek }
              );
              await robin.sendMessage(
                from,
                { text: "✅ Audio Upload Successful ✅", edit: processingMsg.key }
              );
            } else if (choice === "2") {
              // Send document
              await robin.sendMessage(
                from,
                {
                  document: { url: videoUrl },
                  mimetype: "audio/mpeg",
                  fileName: `${data.title}.mp3`,
                  caption: "𝐌𝐚𝐝𝐞 𝐛𝐲 Rasiya bot",
                },
                { quoted: mek }
              );
              await robin.sendMessage(
                from,
                { text: "✅ Document Upload Successful ✅", edit: processingMsg.key }
              );
            } else if (choice === "3") {
              // Send both
              await robin.sendMessage(
                from,
                { audio: { url: videoUrl }, mimetype: "audio/mpeg" },
                { quoted: mek }
              );
              await robin.sendMessage(
                from,
                {
                  document: { url: videoUrl },
                  mimetype: "audio/mpeg",
                  fileName: `${data.title}.mp3`,
                  caption: "𝐌𝐚𝐝𝐞 𝐛𝐲 Rasiya bot",
                },
                { quoted: mek }
              );
              await robin.sendMessage(
                from,
                { text: "✅ Both Uploads Successful ✅", edit: processingMsg.key }
              );
            }

            // Cleanup
            pendingDownloads.delete(messageID);
            await robin.sendMessage(
              from,
              { text: "*Thanks for using RASIYA BOT❤️*" },
              { quoted: mek }
            );
          } else {
            await robin.sendMessage(
              from,
              { text: "❌ Invalid choice! Reply with 1, 2, or 3." },
              { quoted: mek }
            );
          }
        }
      });
    } catch (e) {
      console.log(e);
      await robin.sendMessage(from, { react: { text: "❌", key: mek.key } });
      await reply(`❌ *An error occurred:* ${e.message || "Error!"}`);
    }
  }
);

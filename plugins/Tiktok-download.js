const { cmd, commands } = require("../command");

// Main TikTok download command (no watermark)
cmd(
  {
    pattern: "tiktok",
    react: "📱",
    desc: "Download TikTok Video (No Watermark)",
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
      // Check if a URL is provided
      if (!q) return reply("Ex: `.tiktok https://vm.tiktok.com/XYZ123`");

      const tiktokUrl = q.trim();

      // Basic TikTok URL validation
      if (!tiktokUrl.includes("tiktok.com")) {
        return reply("❌ Please provide a valid TikTok URL.");
      }

      // API configuration using tikwm.com
      const API_URL = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;

      // Notify user of progress
      const processingMsg = await reply("❄️ *Processing TikTok Video Download...*");

      // Handle reactions safely
      try {
        if (processingMsg && processingMsg.key) {
          await robin.sendMessage(from, { react: { text: "⏳", key: processingMsg.key } });
        }
      } catch (reactionError) {
        console.log("Reaction error:", reactionError);
      }

      // Fetch video info from API
      const response = await fetch(API_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      // Check if the response is OK
      if (!response.ok) {
        // Try to react with error emoji
        try {
          if (processingMsg && processingMsg.key) {
            await robin.sendMessage(from, { react: { text: "❌", key: processingMsg.key } });
          }
        } catch (reactionError) {
          console.log("Reaction error:", reactionError);
        }
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const result = await response.json();

      // Detailed response validation
      if (result.code !== 0 || !result.data || !result.data.play) {
        // Try to react with error emoji
        try {
          if (processingMsg && processingMsg.key) {
            await robin.sendMessage(from, { react: { text: "❌", key: processingMsg.key } });
          }
        } catch (reactionError) {
          console.log("Reaction error:", reactionError);
        }
        console.log("API Response:", result); // Log for debugging
        return reply("❌ Error: Couldn't fetch video. The URL might be invalid or the API is unavailable.");
      }

      // Extract video details
      const videoUrl = result.data.play; // Clean version (no watermark)
      const title = result.data.title || "TikTok Video";
      const author = result.data.author?.nickname || "Unknown";
      const duration = result.data.duration || "Unknown";
      const diggCount = result.data.digg_count || 0;
      const commentCount = result.data.comment_count || 0;
      const shareCount = result.data.share_count || 0;

      // Create a formatted caption
      const caption = `*❄️ CH TIKTOK DOWNLOADER ❄️*\n\n` +
        `🎥 *Title*: ${title}\n` +
        `👤 *Author*: ${author}\n` +
        `⏱️ *Duration*: ${duration}s\n` +
        `❤️ *Likes*: ${diggCount.toLocaleString()}\n` +
        `💬 *Comments*: ${commentCount.toLocaleString()}\n` +
        `🔁 *Shares*: ${shareCount.toLocaleString()}\n` +
        `🔗 *URL*: ${tiktokUrl}\n\n` +
        `*Made with 💙 by CH*`;

      // Try to change reaction to success on the processing message
      try {
        if (processingMsg && processingMsg.key) {
          await robin.sendMessage(from, { react: { text: "✅", key: processingMsg.key } });
        }
      } catch (reactionError) {
        console.log("Reaction error:", reactionError);
      }

      // Send the video with the caption
      const videoMsg = await robin.sendMessage(
        from,
        {
          video: { url: videoUrl },
          caption: caption,
          mimetype: 'video/mp4'
        },
        { quoted: mek }
      );

      // Try to add reaction to the video message
      try {
        if (videoMsg && videoMsg.key) {
          await robin.sendMessage(from, { react: { text: "📱", key: videoMsg.key } });
        }
      } catch (reactionError) {
        console.log("Reaction error:", reactionError);
      }

    } catch (e) {
      console.error("Error in TikTok download:", e); // Log full error for debugging
      return reply(`❌ Error: ${e.message || "Something went wrong. Please try again later."}`);
    }
  }
);

// Command to download TikTok video with watermark
cmd(
  {
    pattern: "tiktokwm",
    react: "💦",
    desc: "Download TikTok Video (With Watermark)",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      // Check if a URL is provided
      if (!q) return reply("Ex: `.tiktokwm https://vm.tiktok.com/XYZ123`");

      const tiktokUrl = q.trim();

      // Basic TikTok URL validation
      if (!tiktokUrl.includes("tiktok.com")) {
        return reply("❌ Please provide a valid TikTok URL.");
      }

      // API configuration using tikwm.com
      const API_URL = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;

      // Notify user of progress
      const processingMsg = await reply("❄️ *Processing Watermarked Video Download...*");

      // Fetch video info from API
      const response = await fetch(API_URL);
      const result = await response.json();

      // Check if the response is valid
      if (result.code !== 0 || !result.data || !result.data.wmplay) {
        return reply("❌ Error: Couldn't fetch watermarked video.");
      }

      // Send the watermarked video
      const wmVideoMsg = await robin.sendMessage(
        from,
        {
          video: { url: result.data.wmplay },
          caption: `*❄️ TikTok Watermarked Video ❄️*\n\n🎥 *Author*: ${result.data.author?.nickname || "Unknown"}\n\n*Made with 💙 by CH*`,
          mimetype: 'video/mp4'
        },
        { quoted: mek }
      );

      // Try to add reaction to the video message
      try {
        if (wmVideoMsg && wmVideoMsg.key) {
          await robin.sendMessage(from, { react: { text: "💦", key: wmVideoMsg.key } });
        }
      } catch (reactionError) {
        console.log("Reaction error:", reactionError);
      }

    } catch (e) {
      console.error("Error in TikTok watermarked download:", e);
      return reply(`❌ Error: ${e.message || "Something went wrong."}`);
    }
  }
);

// Command to download TikTok audio
cmd(
  {
    pattern: "tiktokaudio",
    react: "🎵",
    desc: "Download TikTok Audio",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      // Check if a URL is provided
      if (!q) return reply("Ex: `.tiktokaudio https://vm.tiktok.com/XYZ123`");

      const tiktokUrl = q.trim();

      // Basic TikTok URL validation
      if (!tiktokUrl.includes("tiktok.com")) {
        return reply("❌ Please provide a valid TikTok URL.");
      }

      // API configuration using tikwm.com
      const API_URL = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;

      // Notify user of progress
      const processingMsg = await reply("🎵 *Processing Audio Download...*");

      // Fetch video info from API
      const response = await fetch(API_URL);
      const result = await response.json();

      // Check if the response is valid
      if (result.code !== 0 || !result.data || !result.data.music) {
        return reply("❌ Error: Couldn't fetch audio from this TikTok.");
      }

      const audioUrl = result.data.music;
      const title = result.data.music_info?.title || "TikTok Audio";
      const author = result.data.music_info?.author || result.data.author?.nickname || "Unknown";

      // Send the audio
      const audioMsg = await robin.sendMessage(
        from,
        {
          audio: { url: audioUrl },
          mimetype: 'audio/mp4',
          fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
          caption: `*🎵 TikTok Audio 🎵*\n\n🎵 *Title*: ${title}\n👤 *Artist*: ${author}\n\n*Made with 💙 by CH*`
        },
        { quoted: mek }
      );

      // Try to add reaction to the audio message
      try {
        if (audioMsg && audioMsg.key) {
          await robin.sendMessage(from, { react: { text: "🎵", key: audioMsg.key } });
        }
      } catch (reactionError) {
        console.log("Reaction error:", reactionError);
      }

    } catch (e) {
      console.error("Error in TikTok audio download:", e);
      return reply(`❌ Error: ${e.message || "Something went wrong."}`);
    }
  }
);

cmd(
  {
    pattern: "tikhelp",
    react: "ℹ️",
    desc: "Help for TikTok Downloader",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, reply }) => {
    try {
      const helpText = `*❄️ Frozen Queen TikTok Downloader Help ❄️*

*Available Commands:*
• .tiktok [url] - Download TikTok video without watermark
• .tiktokwm [url] - Download TikTok video with watermark
• .tiktokaudio [url] - Download TikTok audio only
• .tikhelp - Show this help message

*Example:*
.tiktok https://vm.tiktok.com/XYZABC123

*Notes:*
- Make sure to use valid TikTok URLs
- Videos may take time to download depending on size
- Some TikTok videos may be protected and can't be downloaded

> *Made BY Frozen Queen team ❄️ *`;

      // Send help message with image
      const helpMsg = await robin.sendMessage(from, {
        image: { url: "https://github.com/chathurahansaka1/help/blob/main/src/f52f8647-b0fd-4f66-9cfa-00087fc06f9b.jpg?raw=true" },
        caption: helpText,
      });

      // Try to add reaction to the help message
      try {
        if (helpMsg && helpMsg.key) {
          await robin.sendMessage(from, { react: { text: "ℹ️", key: helpMsg.key } });
        }
      } catch (reactionError) {
        console.log("Reaction error:", reactionError);
      }
    } catch (e) {
      console.error("Error in TikTok help command:", e);
      return reply(`❌ Error: ${e.message || "Something went wrong."}`);
    }
  }
);

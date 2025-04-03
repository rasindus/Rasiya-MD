const { cmd } = require("../command");

cmd(
  {
    pattern: ["tiktok", "tt"], // Works with both .tiktok and .tt
    react: "🎬",
    desc: "Download TikTok videos without watermark",
    category: "download",
    filename: __filename,
  },
  async (m, { reply, text }) => {
    try {
      if (!text) return reply("🔖 *Example:* `.tiktok https://vm.tiktok.com/xxxxxxx`");

      // Extract TikTok URL from message
      const url = text.match(/(https?:\/\/[^\s]+)/)?.[0];
      if (!url || !url.includes("tiktok.com")) {
        return reply("❌ Please send a valid TikTok URL");
      }

      // Show processing message
      const waitMsg = await reply("⏳ Downloading TikTok video...");

      // API endpoint
      const apiUrl = `https://tikdownloader.io/?url=${encodeURIComponent(url)}`;
      
      // Fetch video
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.videoUrl) {
        return reply("❌ Failed to download video. Try again later.");
      }

      // Send the video
      await m.sendMessage(
        m.chat,
        {
          video: { url: data.videoUrl },
          caption: "🎬 *TikTok Video*\nDownloaded for you!",
        },
        { quoted: m }
      );

      // Delete processing message
      if (waitMsg) await m.deleteMessage(waitMsg.key);

    } catch (error) {
      console.error(error);
      reply("❌ Error downloading video. Please try again.");
    }
  }
);

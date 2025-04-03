const { cmd } = require("../command");



cmd(
  {
    pattern: ["tiktok", "tt"],
    react: "⬇️",
    desc: "Download TikTok videos (no watermark)",
    category: "download",
    filename: __filename,
  },
  async (m, { reply, text }) => {
    try {
      // Validate input
      if (!text) return reply("❗ *Example:* `.tiktok https://vm.tiktok.com/xxxxxxx`");

      // Extract URL
      const url = text.match(/(https?:\/\/[^\s]+)/)?.[0];
      if (!url || !url.includes("tiktok.com")) {
        return reply("❗ Invalid TikTok URL. Please provide a valid link.");
      }

      // Show processing message
      const processingMsg = await reply("⏳ Downloading TikTok video...");

      // Use Chathura's API
      const apiUrl = `https://tiktok-downloader.apis-bj-devs.workers.dev/?url=${encodeURIComponent(url)}`;
      
      // API request
      const response = await fetch(apiUrl);
      const data = await response.json();

      // Validate response
      if (!data?.status || !data?.data?.play) {
        return reply("❌ Failed to download video. The URL may be invalid or the API is unavailable.");
      }

      // Send video
      await m.sendMessage(
        m.chat,
        {
          video: { url: data.data.play },
          caption: "🎬 *TikTok Video*\nDownloaded successfully!",
        },
        { quoted: m }
      );

      // Clean up processing message
      if (processingMsg) await m.deleteMessage(processingMsg.key);

    } catch (error) {
      console.error("[TIKTOK PLUGIN ERROR]", error);
      reply("❌ An error occurred while processing your request. Please try again later.");
    }
  }
);

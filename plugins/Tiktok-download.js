const { cmd } = require("../command");
const axios = require("axios");

const API_URL = "https://tiktok-downloader.apis-bj-devs.workers.dev/";

cmd(
  {
    pattern: "tiktok",
    alias: ["tt"],
    react: "🎥",
    category: "download",
    desc: "Download TikTok videos without watermark",
    filename: __filename,
  },
  async (robin, m, mek, { from, q, reply }) => {
    try {
      console.log("Received TikTok URL:", q);

      if (!q || q.trim() === "") {
        console.log("No URL provided by user");
        return await reply("*🎥 Please provide a valid TikTok video URL!*");
      }

      const tiktokRegex = /(https?:\/\/)?(www\.)?(vm|vt|tiktok)\.(com)\/(\S+)/i;
      if (!tiktokRegex.test(q)) {
        console.log("Invalid TikTok URL provided:", q);
        return await reply("*❌ Invalid TikTok URL! Please check and try again.*");
      }

      await reply("*⏳ Fetching video details, please wait...*");

      const apiUrl = `${API_URL}?url=${encodeURIComponent(q)}`;
      console.log("API Request URL:", apiUrl);

      const response = await axios.get(apiUrl, { timeout: 15000 });

      console.log("API Response:", JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.video) {
        console.log("No API response received");
        return await reply("*❌ No response from API. The service might be down. Try again later.*");
      }

      const videoData = {
        url: response.data.video,
        thumbnail: response.data.cover,
        title: response.data.title || "TikTok Video",
        author: response.data.author || "Unknown",
      };

      console.log("Video Data:", JSON.stringify(videoData, null, 2));

      let caption = `*🎥 TikTok Video*\n`;
      caption += `📌 *Title:* ${videoData.title}\n`;
      caption += `👤 *Author:* ${videoData.author}\n`;
      caption += `✅ *Powered by Rasiya-MD*`;

      if (videoData.thumbnail) {
        await robin.sendMessage(
          from,
          {
            image: { url: videoData.thumbnail },
            caption: "*🎥 TikTok Video Thumbnail*\n⏳ Video will be sent next...",
          },
          { quoted: mek }
        );
      }

      await robin.sendMessage(
        from,
        {
          video: { url: videoData.url },
          caption: caption,
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error("Error downloading TikTok video:", e.message, e.stack);
      if (e.code === "ECONNABORTED") {
        return await reply("*❌ Timeout: The server took too long to respond. Please try again later.*");
      } else if (e.response && e.response.data) {
        return await reply(`*❌ Error:* ${e.response.data.message || "API error occurred. Try again later."}`);
      } else {
        return await reply(`*❌ Error:* ${e.message || "Something went wrong while downloading the video. Try again later."}`);
      }
    }
  }
);

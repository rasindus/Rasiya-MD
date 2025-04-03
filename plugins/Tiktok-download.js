const axios = require("axios");

module.exports = {
  name: "tiktok",
  description: "Download TikTok videos",
  command: ["tiktok", "ttdl"],
  async execute(client, message, args) {
    if (!args[0]) {
      return client.sendMessage(message.from, { text: "🔹 *Usage:* .tiktok <TikTok URL>" });
    }

    const url = args[0];
    const apiUrl = `https://tiktok-downloader.apis-bj-devs.workers.dev/?url=${url}`;

    try {
      const { data } = await axios.get(apiUrl);
      if (data.video) {
        await client.sendMessage(message.from, { 
          video: { url: data.video }, 
          caption: "✅ *Here is your TikTok video!*" 
        });
      } else {
        client.sendMessage(message.from, { text: "❌ Failed to download video!" });
      }
    } catch (error) {
      console.error(error);
      client.sendMessage(message.from, { text: "❌ Error fetching video!" });
    }
  },
};

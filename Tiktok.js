const { cmd } = require("../command");
const axios = require("axios");
const config = require("../config");

// Multiple API endpoints for redundancy
const TIKTOK_APIS = [
  "https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/vid/index",
  "https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/",
  "https://www.tikwm.com/api/"
];

cmd(
  {
    pattern: "tiktok",
    alias: ["tt", "tik"],
    react: "🎵",
    category: "download",
    desc: "Download TikTok videos (with watermark, without watermark, audio, or info)",
    usage: "tiktok <url> OR reply to a tiktok message with 'tiktok'",
    filename: __filename,
  },
  async (robin, m, mek, { from, q, reply }) => {
    try {
      // Check if user replied to a message containing TikTok URL
      let url = q;
      if (!url && mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
        url = mek.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
      }

      console.log("Received TikTok URL:", url);

      if (!url || url.trim() === "") {
        return await reply("*🎵 Please provide a valid TikTok URL or reply to a TikTok link!*\nExample: tiktok https://vm.tiktok.com/xyz123");
      }

      const ttRegex = /https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/(?:@[\w.]+\/video\/\d+|t\/\w+|\w+\/video\/\d+|\w+)/i;
      if (!ttRegex.test(url)) {
        return await reply("*❌ Invalid TikTok URL! Please provide a valid link (e.g., tiktok.com/@user/video/123, vm.tiktok.com/xyz123).*");
      }

      await reply("*⏳ Fetching TikTok content, please wait...*");

      // Try multiple APIs if one fails
      let response;
      let apiIndex = 0;
      let errors = [];

      while (apiIndex < TIKTOK_APIS.length) {
        try {
          const apiUrl = TIKTOK_APIS[apiIndex];
          console.log(`Trying API ${apiIndex + 1}: ${apiUrl}`);

          if (apiUrl.includes('rapidapi.com')) {
            response = await axios.get(apiUrl, {
              params: { url },
              headers: {
                'X-RapidAPI-Key': config.RAPIDAPI_KEY || 'your-rapidapi-key',
                'X-RapidAPI-Host': 'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com'
              },
              timeout: 20000
            });
          } else if (apiUrl.includes('tikwm.com')) {
            response = await axios.post(apiUrl, { url }, { timeout: 15000 });
          } else {
            response = await axios.get(apiUrl, { params: { url }, timeout: 15000 });
          }

          if (response.data) break;
        } catch (e) {
          errors.push(`API ${apiIndex + 1}: ${e.message}`);
          console.error(`API ${apiIndex + 1} failed:`, e.message);
          apiIndex++;
        }
      }

      if (!response?.data) {
        console.error("All APIs failed:", errors);
        return await reply("*❌ All download services failed. Please try again later.*");
      }

      console.log("API Response:", JSON.stringify(response.data, null, 2));

      // Standardize response from different APIs
      let videoData = {};
      if (response.data.aweme_list) { // TikTok official API response
        const aweme = response.data.aweme_list[0];
        videoData = {
          title: aweme.desc,
          duration: aweme.duration,
          author: aweme.author.nickname,
          authorUsername: aweme.author.unique_id,
          music: aweme.music.title,
          musicAuthor: aweme.music.author,
          playCount: aweme.statistics.play_count,
          likes: aweme.statistics.digg_count,
          comments: aweme.statistics.comment_count,
          shares: aweme.statistics.share_count,
          watermark: aweme.video.play_addr.url_list[0],
          nowatermark: aweme.video.download_addr.url_list[0],
          thumbnail: aweme.video.cover.url_list[0],
          audio: aweme.music.play_url.url_list[0]
        };
      } else if (response.data.data) { // tikwm.com response
        videoData = {
          title: response.data.data.title,
          duration: response.data.data.duration,
          author: response.data.data.author.nickname,
          authorUsername: response.data.data.author.unique_id,
          music: response.data.data.music_info.title,
          musicAuthor: response.data.data.music_info.author,
          playCount: response.data.data.play_count,
          likes: response.data.data.digg_count,
          comments: response.data.data.comment_count,
          shares: response.data.data.share_count,
          watermark: response.data.data.wmplay,
          nowatermark: response.data.data.play,
          thumbnail: response.data.data.cover,
          audio: response.data.data.music
        };
      } else { // Other API responses
        videoData = {
          ...response.data,
          poweredBy: "Rasiya MD"
        };
      }

      // Send media with options
      const caption = `*🎵 TikTok Video*\n\n` +
        `📌 *Title:* ${videoData.title || 'N/A'}\n` +
        `⏱ *Duration:* ${videoData.duration ? (videoData.duration / 1000) + 's' : 'N/A'}\n` +
        `👤 *Author:* @${videoData.authorUsername || 'N/A'} (${videoData.author || 'N/A'})\n` +
        `🎶 *Music:* ${videoData.music || 'N/A'} - ${videoData.musicAuthor || 'N/A'}\n` +
        `📊 *Stats:* 👍 ${videoData.likes || 0} | ▶️ ${videoData.playCount || 0} | 💬 ${videoData.comments || 0} | 🔗 ${videoData.shares || 0}\n\n` +
        `✅ *Powered by Rasiya MD*`;

      // Send thumbnail first
      if (videoData.thumbnail) {
        await robin.sendMessage(
          from,
          {
            image: { url: videoData.thumbnail },
            caption: "*🎵 TikTok Thumbnail*\nChoose download option below:",
          },
          { quoted: mek }
        );
      }

      // Send buttons for download options
      const buttons = [
        { buttonId: 'tiktok_nowm', buttonText: { displayText: 'No Watermark' }, type: 1 },
        { buttonId: 'tiktok_wm', buttonText: { displayText: 'With Watermark' }, type: 1 },
        { buttonId: 'tiktok_audio', buttonText: { displayText: 'Audio Only' }, type: 1 }
      ];

      await robin.sendMessage(
        from,
        {
          text: "*📥 Choose Download Option:*",
          footer: "Rasiya MD",
          buttons: buttons,
          headerType: 1
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error("Error in TikTok command:", e.message, e.stack);
      if (e.code === "ECONNABORTED") {
        return await reply("*❌ Timeout: The server took too long to respond. Please try again later.*");
      } else {
        return await reply(`*❌ Error:* ${e.message || "Something went wrong while processing the TikTok video."}`);
      }
    }
  }
);

// Handle button responses
cmd({ pattern: "tiktok_nowm", dontAddCommandList: true }, async (robin, m, mek) => {
  try {
    const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) return await robin.sendMessage(m.key.remoteJid, { text: "*❌ Please reply to the original TikTok message.*" });

    // In a real implementation, you would store the videoData from the original command
    // and retrieve it here. This is a simplified version.
    await robin.sendMessage(m.key.remoteJid, { 
      text: "*⏳ Downloading TikTok without watermark...*" 
    });
    
    // Actual implementation would send the videoData.nowatermark URL here
  } catch (e) {
    console.error("Error in tiktok_nowm:", e);
  }
});

cmd({ pattern: "tiktok_wm", dontAddCommandList: true }, async (robin, m, mek) => {
  // Similar implementation as above but for watermarked version
});

cmd({ pattern: "tiktok_audio", dontAddCommandList: true }, async (robin, m, mek) => {
  // Similar implementation as above but for audio only
});

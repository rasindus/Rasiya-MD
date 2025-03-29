const config = require('../config');
const { cmd } = require('../command');
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();
const yts = require('yt-search');

function replaceYouTubeID(url) {
    const regex = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

cmd({
    pattern: "song",
    alias: ["ytmp3", "ytmp3dl"],
    react: "🎵",
    desc: "Download Ytmp3 - Rasiya Bot",
    category: "download",
    use: ".song <Text or YT URL>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("Rasiya Bot: ❌ Please provide a Query or Youtube URL!");

        let id = q.startsWith("https://") ? replaceYouTubeID(q) : null;

        if (!id) {
            const searchResults = await dy_scrap.ytsearch(q);
            if (!searchResults?.results?.length) return await reply("Rasiya Bot: ❌ No results found!");
            id = searchResults.results[0].videoId;
        }

        const data = await dy_scrap.ytsearch(`https://youtube.com/watch?v=$${id}`);
        if (!data?.results?.length) return await reply("Rasiya Bot: ❌ Failed to fetch video!");

        const { url, title, image, timestamp, ago, views, author } = data.results[0];

        let info = `
  ╔═════════════════════════╗
  ║ 🎵 *Rasiya Bot - Song DL* 🎵 ║
  ╠═════════════════════════╣
  ║ 🎶 *Title:* ${title || "Unknown"}          ║
  ║ ⏳ *Duration:* ${timestamp || "Unknown"}      ║
  ║ 👀 *Views:* ${views || "Unknown"}           ║
  ║ 🌏 *Release:* ${ago || "Unknown"}           ║
  ║ 👤 *Author:* ${author?.name || "Unknown"}      ║
  ║ 🔗 *URL:* ${url || "Unknown"}            ║
  ╠═════════════════════════╣
  ║ 🔽 *Download Options:* ║
  ║ 1️⃣.1️⃣ *Audio (🎵)* ║
  ║ 1️⃣.2️⃣ *Document (📁)* ║
  ╚═════════════════════════╝
  💖 *Powered by Rasiya Bot* 💖
`;

        const sentMsg = await conn.sendMessage(from, { image: { url: image }, caption: info.trim() }, { quoted: mek });
        const messageID = sentMsg.key.id;
        await conn.sendMessage(from, { react: { text: '🎶', key: sentMsg.key } });

        // Simulate conn.ev.once
        let replied = false;
        const messageListener = async (messageUpdate) => {
            try {
                if (replied) return; // Prevent multiple replies
                const mekInfo = messageUpdate?.messages[0];
                if (!mekInfo?.message) return;

                const messageType = mekInfo?.message?.conversation || mekInfo?.message?.extendedTextMessage?.text;
                const isReplyToSentMsg = mekInfo?.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;

                if (!isReplyToSentMsg) return;

                replied = true; // Set flag to prevent further replies
                conn.ev.off('messages.upsert', messageListener); // Remove listener

                let userReply = messageType.trim();
                let msg;
                let type;
                let response;

                if (userReply === "1.1") {
                    msg = await conn.sendMessage(from, { text: "Rasiya Bot: ⏳ Processing Audio...", quoted: mek });
                    response = await dy_scrap.ytmp3(`https://youtube.com/watch?v=$${id}`);
                    let downloadUrl = response?.result?.download?.url;
                    if (!downloadUrl) return await reply("Rasiya Bot: ❌ Download link not found!");
                    type = { audio: { url: downloadUrl }, mimetype: "audio/mpeg" };

                } else if (userReply === "1.2") {
                    msg = await conn.sendMessage(from, { text: "Rasiya Bot: ⏳ Processing Document...", quoted: mek });
                    const response = await dy_scrap.ytmp3(`https://youtube.com/watch?v=$${id}`);
                    let downloadUrl = response?.result?.download?.url;
                    if (!downloadUrl) return await reply("Rasiya Bot: ❌ Download link not found!");
                    type = { document: { url: downloadUrl }, fileName: `${title}.mp3`, mimetype: "audio/mpeg", caption: title };

                } else {
                    return await reply("Rasiya Bot: ❌ Invalid choice! Reply with 1️⃣.1️⃣ or 1️⃣.2️⃣.");
                }

                await conn.sendMessage(from, type, { quoted: mek });
                await conn.sendMessage(from, { text: 'Rasiya Bot: ✅ Media Upload Successful ✅', edit: msg.key });

            } catch (error) {
                console.error(error);
                await reply(`Rasiya Bot: ❌ *An error occurred while processing:* ${error.message || "Error!"}`);
            }
        };

        conn.ev.on('messages.upsert', messageListener);

    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`Rasiya Bot: ❌ *An error occurred:* ${error.message || "Error!"}`);
    }
});

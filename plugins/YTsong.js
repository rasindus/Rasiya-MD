/*
ʀᴀꜱɪʏᴀ ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ᴘʟᴜɢɪɴ
ᴄʀᴇᴀᴛᴇᴅ ʙʏ : ʀᴀꜱɪɴᴅᴜ
ᴘʟᴇᴀꜱᴇ ᴅᴏɴᴛ ʀᴇᴍᴏᴠᴇ ᴏᴡɴᴇʀ ᴄʀᴇᴅɪᴛꜱ 
*/

const { cmd, commands } = require('../command');
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3');

cmd({
  pattern: "song",
  desc: "Download songs.",
  category: "download",
  react: '🎵',
  filename: __filename
}, async (messageHandler, context, quotedMessage, { from, reply, q }) => {
  try {
    if (!q) return reply("*Please Provide A Song Name or Url *");

    const searchResults = await yts(q);
    if (!searchResults || searchResults.videos.length === 0) {
      return reply("*No Song Found Matching Your Query *");
    }

    const songData = searchResults.videos[0];
    const songUrl = songData.url;

    let songDetailsMessage = `*ʀᴀꜱɪʏᴀ ʏᴏᴜᴛᴜʙᴇ ᴀᴜᴅɪᴏ ᴅʟ*\n\n`;
    songDetailsMessage += `*🎵Title:* ${songData.title}\n`;
    songDetailsMessage += `* 📷Views:* ${songData.views}\n`;
    songDetailsMessage += `*⏰ Duration:* ${songData.timestamp}\n`;
    songDetailsMessage += `* 📅Uploaded:* ${songData.ago}\n`;
    songDetailsMessage += `* 👻Channel:* ${songData.author.name}\n`;
    songDetailsMessage += `* 👽URL:* ${songData.url}\n\n`;
    songDetailsMessage += `*Choose Your Download Format:*\n\n`;
    songDetailsMessage += `1 || Audio File \n`;
    songDetailsMessage += `2 || Document File \n\n`;
    songDetailsMessage += `> ʀᴀꜱɪʏᴀ-ᴍᴅ ʙʏ ʀᴀꜱɪɴᴅᴜ`;

    const sentMessage = await messageHandler.sendMessage(from, {
      image: { url: songData.thumbnail },
      caption: songDetailsMessage,
    }, { quoted: quotedMessage });

    messageHandler.ev.on("messages.upsert", async (update) => {
      const message = update.messages[0];
      if (!message.message || !message.message.extendedTextMessage) return;

      const userReply = message.message.extendedTextMessage.text.trim();

      if (message.message.extendedTextMessage.contextInfo.stanzaId === sentMessage.key.id) {
        switch (userReply) {
          case '1':
            await messageHandler.sendMessage(from, { text: "*Downloading Audio... ⏳*" }, { quoted: quotedMessage });
            const result = await ddownr.download(songUrl, 'mp3', async (progress) => {
              const percentage = Math.round(progress.percentage);
              const progressBar = '█'.repeat(percentage / 10) + '░'.repeat(10 - percentage / 10);
              await messageHandler.sendMessage(from, { text: `*Downloading... [${progressBar}] ${percentage}% *` }, { quoted: quotedMessage });
            });
            await messageHandler.sendMessage(from, {
              audio: { url: result.downloadUrl },
              mimetype: "audio/mpeg"
            }, { quoted: quotedMessage });
            break;
          case '2':
            await messageHandler.sendMessage(from, { text: "*Downloading Document... ⏳*" }, { quoted: quotedMessage });
            const docResult = await ddownr.download(songUrl, 'mp3', async (progress) => {
              const percentage = Math.round(progress.percentage);
              const progressBar = '█'.repeat(percentage / 10) + '░'.repeat(10 - percentage / 10);
              await messageHandler.sendMessage(from, { text: `*Downloading... [${progressBar}] ${percentage}% *` }, { quoted: quotedMessage });
            });
            await messageHandler.sendMessage(from, {
              document: { url: docResult.downloadUrl },
              mimetype: 'audio/mpeg',
              fileName: `${songData.title}.mp3`,
              caption: `${songData.title}\n\n> ʀᴀꜱɪʏᴀ-ᴍᴅ ʙʏ ʀᴀꜱɪɴᴅᴜ`
            }, { quoted: quotedMessage });
            break;
          default:
            reply("*Invalid Option. Please Select A Valid Option *");
            break;
        }
      }
    });
  } catch (error) {
    console.error(error);
    reply("*An Error Occurred While Processing Your Request *");
  }
});

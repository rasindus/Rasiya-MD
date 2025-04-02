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
    songDetailsMessage += `👻Title:* ${songData.title}\n`;
    songDetailsMessage += `📷Views:* ${songData.views}\n`;
    songDetailsMessage += `🕑Duration:* ${songData.timestamp}\n`;
    songDetailsMessage += `📅Uploaded:* ${songData.ago}\n`;
    songDetailsMessage += `🎤Channel:* ${songData.author.name}\n`;
    songDetailsMessage += `👽URL:* ${songData.url}\n\n`;
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
            let progressValue = 0;
            const progressInterval = setInterval(async () => {
              progressValue += 10;
              if (progressValue <= 100) {
                const progressBar = '█'.repeat(progressValue / 10) + '░'.repeat(10 - progressValue / 10);
                await messageHandler.sendMessage(from, { text: `*Downloading... [${progressBar}] ${progressValue}% *` }, { quoted: quotedMessage });
              } else {
                clearInterval(progressInterval);
              }
            }, 1000); // සෑම තත්පර 1 කට වරක් යවන්න

            const result = await ddownr.download(songUrl, 'mp3');
            clearInterval(progressInterval);

            await messageHandler.sendMessage(from, { text: "*Uploading Audio... *" }, { quoted: quotedMessage });
            let uploadProgressValue = 0;
            const uploadProgressInterval = setInterval(async () => {
              uploadProgressValue += 10;
              if (uploadProgressValue <= 100) {
                const uploadProgressBar = '█'.repeat(uploadProgressValue / 10) + '░'.repeat(10 - uploadProgressValue / 10);
                await messageHandler.sendMessage(from, { text: `*Uploading... [${uploadProgressBar}] ${uploadProgressValue}% *` }, { quoted: quotedMessage });
              } else {
                clearInterval(uploadProgressInterval);
              }
            }, 1000); // සෑම තත්පර 1 කට වරක් යවන්න

            await messageHandler.sendMessage(from, {
              audio: { url: result.uploadUrl || result.downloadUrl },//uploadUrl null නම් downloadUrl භාවිතා කරයි.
              mimetype: "audio/mpeg"
            }, { quoted: quotedMessage });

            clearInterval(uploadProgressInterval);
            break;
          case '2':
            await messageHandler.sendMessage(from, { text: "*Downloading Document... ⏳*" }, { quoted: quotedMessage });
            let docProgressValue = 0;
            const docProgressInterval = setInterval(async () => {
              docProgressValue += 10;
              if (docProgressValue <= 100) {
                const progressBar = '█'.repeat(docProgressValue / 10) + '░'.repeat(10 - docProgressValue / 10);
                await messageHandler.sendMessage(from, { text: `*Downloading... [${progressBar}] ${docProgressValue}% *` }, { quoted: quotedMessage });
              } else {
                clearInterval(docProgressInterval);
              }
            }, 1000); // සෑම තත්පර 1 කට වරක් යවන්න

            const docResult = await ddownr.download(songUrl, 'mp3');
            clearInterval(docProgressInterval);

             await messageHandler.sendMessage(from, { text: "*Uploading Document... *" }, { quoted: quotedMessage });
            let docUploadProgressValue = 0;
            const docUploadProgressInterval = setInterval(async () => {
              docUploadProgressValue += 10;
              if (docUploadProgressValue <= 100) {
                const uploadProgressBar = '█'.repeat(docUploadProgressValue / 10) + '░'.repeat(10 - docUploadProgressValue / 10);
                await messageHandler.sendMessage(from, { text: `*Uploading... [${uploadProgressBar}] ${docUploadProgressValue}% *` }, { quoted: quotedMessage });
              } else {
                clearInterval(docUploadProgressInterval);
              }
            }, 1000); // සෑම තත්පර 1 කට වරක් යවන්න

            await messageHandler.sendMessage(from, {
              document: { url: docResult.uploadUrl || docResult.downloadUrl },
              mimetype: 'audio/mpeg',
              fileName: `${songData.title}.mp3`,
              caption: `${songData.title}\n\n> ʀᴀꜱɪʏᴀ-ᴍᴅ ʙʏ ʀᴀꜱɪɴᴅᴜ`
            }, { quoted: quotedMessage });
            clearInterval(docUploadProgressInterval);
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

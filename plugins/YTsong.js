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
    if (!q) return reply("⚠️ *කරුණාකර ගීතයේ නම හෝ URL එකක් ලබාදෙන්න!*");

    const searchResults = await yts(q);
    if (!searchResults || searchResults.videos.length === 0) {
      return reply("❌ *ඔබේ සෙවුමට ගැලපෙන ගීතයක් හමු නොවීය!*");
    }

    const songData = searchResults.videos[0];
    const songUrl = songData.url;

    let songDetailsMessage = `*----------------------------------*\n`;
    songDetailsMessage += ` *ගීත විස්තරය* \n\n`;
    songDetailsMessage += `✨ *මාතෘකාව:* ${songData.title}\n`;
    songDetailsMessage += ` *දර්ශන:* ${songData.views}\n`;
    songDetailsMessage += `⏱️ *කාලය:* ${songData.timestamp}\n`;
    songDetailsMessage += ` *උඩුගත කළ දිනය:* ${songData.ago}\n`;
    songDetailsMessage += ` *චැනලය:* ${songData.author.name}\n`;
    songDetailsMessage += ` *URL:* ${songData.url}\n\n`;
    songDetailsMessage += `*බාගත කිරීමේ ආකෘතිය තෝරන්න:* \n\n`;
    songDetailsMessage += `1️⃣ ||  *ශ්‍රව්‍ය ගොනුව* \n`;
    songDetailsMessage += `2️⃣ ||  *ලේඛන ගොනුව* \n\n`;
    songDetailsMessage += `*ʀᴀꜱɪʏᴀ-ᴍᴅ ʙʏ ʀᴀꜱɪɴᴅᴜ*\n`;
    songDetailsMessage += `*----------------------------------*`;

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
            const downloadMessage = await messageHandler.sendMessage(from, { text: "⏳ *ශ්‍රව්‍ය ගොනුව බාගත වෙමින් පවතී...*\n\nby rasiya md" }, { quoted: quotedMessage });
            let progressValue = 0;
            const progressInterval = setInterval(async () => {
              progressValue += 10;
              if (progressValue <= 100) {
                const progressBar = '🟩'.repeat(progressValue / 10) + '░'.repeat(10 - progressValue / 10);
                await messageHandler.editMessage(from, { text: ` *බාගත වෙමින් පවතී...* [${progressBar}] ${progressValue}%\n\nby rasiya md` }, downloadMessage.key.id);
              } else {
                clearInterval(progressInterval);
              }
            }, 1000);

            const result = await ddownr.download(songUrl, 'mp3');
            clearInterval(progressInterval);

            setTimeout(async () => {
              const uploadMessage = await messageHandler.editMessage(from, { text: " *ශ්‍රව්‍ය ගොනුව උඩුගත වෙමින් පවතී...*\n\nby rasiya md" }, downloadMessage.key.id);
              let uploadProgressValue = 0;
              const uploadProgressInterval = setInterval(async () => {
                uploadProgressValue += 10;
                if (uploadProgressValue <= 100) {
                  const uploadProgressBar = '🟩'.repeat(uploadProgressValue / 10) + '░'.repeat(10 - uploadProgressValue / 10);
                  await messageHandler.editMessage(from, { text: ` *උඩුගත වෙමින් පවතී...* [${uploadProgressBar}] ${uploadProgressValue}%\n\nby rasiya md` }, downloadMessage.key.id);
                } else {
                  clearInterval(uploadProgressInterval);
                }
              }, 1000);

              await messageHandler.sendMessage(from, {
                audio: { url: result.uploadUrl || result.downloadUrl },
                mimetype: "audio/mpeg",
                caption: "by rasiya md"
              }, { quoted: quotedMessage });

              clearInterval(uploadProgressInterval);
            }, 1000);
            break;
          case '2':
            const documentDownloadMessage = await messageHandler.sendMessage(from, { text: "⏳ *ලේඛන ගොනුව බාගත වෙමින් පවතී...*\n\nby rasiya md" }, { quoted: quotedMessage });
            let docProgressValue = 0;
            const docProgressInterval = setInterval(async () => {
              docProgressValue += 10;
              if (docProgressValue <= 100) {
                const progressBar = '🟩'.repeat(docProgressValue / 10) + '░'.repeat(10 - docProgressValue / 10);
                await messageHandler.editMessage(from, { text: ` *බාගත වෙමින් පවතී...* [${progressBar}] ${docProgressValue}%\n\nby rasiya md` }, documentDownloadMessage.key.id);
              } else {
                clearInterval(docProgressInterval);
              }
            }, 1000);

            const docResult = await ddownr.download(songUrl, 'mp3');
            clearInterval(docProgressInterval);

            setTimeout(async () => {
              const documentUploadMessage = await messageHandler.editMessage(from, { text: " *ලේඛන ගොනුව උඩුගත වෙමින් පවතී...*\n\nby rasiya md" }, documentDownloadMessage.key.id);
              let docUploadProgressValue = 0;
              const docUploadProgressInterval = setInterval(async () => {
                docUploadProgressValue += 10;
                if (docUploadProgressValue <= 100) {
                  const uploadProgressBar = '🟩'.repeat(docUploadProgressValue / 10) + '░'.repeat(10 - docUploadProgressValue / 10);
                  await messageHandler.editMessage(from, { text: ` *උඩුගත වෙමින් පවතී...* [${uploadProgressBar}] ${docUploadProgressValue}%\n\nby rasiya md` }, documentDownloadMessage.key.id);
                } else {
                  clearInterval(docUploadProgressInterval);
                }
              }, 1000);

              await messageHandler.sendMessage(from, {
                document: { url: docResult.uploadUrl || docResult.downloadUrl },
                mimetype: 'audio/mpeg',
                fileName: `${songData.title}.mp3`,
                caption: `by rasiya md`
              }, { quoted: quotedMessage });
              clearInterval(docUploadProgressInterval);
            }, 1000);
            break;
          default:
            reply("⚠️ *වලංගු විකල්පයක් තෝරන්න!*");
            break;
        }
      }
    });
  } catch (error) {
    console.error(error);
    reply("❌ *ඔබගේ ඉල්ලීම සැකසීමේදී දෝෂයක් සිදුවිය!*");
  }
});

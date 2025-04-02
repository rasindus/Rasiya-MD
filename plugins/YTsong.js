const { cmd, commands } = require('../command');
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3');
const fs = require('fs');
const axios = require('axios');

cmd({
  pattern: "song",
  desc: "Download high quality songs.",
  category: "download",
  react: '',
  filename: __filename
}, async (messageHandler, context, quotedMessage, { from, reply, q }) => {
  try {
    if (!q) return reply("*පිලිතුරු ගීතයේ නම හෝ YouTube ලින්කුව ලබා දෙන්න* \n\n_උදා: .song shape of you_");

    let searchingMsg = await reply("* Rasiya Bot ඔබගේ ගීතය සොයමින් සිටී...*");

    const searchResults = await yts(q);
    if (!searchResults || searchResults.videos.length === 0) {
      await messageHandler.sendMessage(from, { delete: searchingMsg.key });
      return reply("*මට ඔබගේ ගීතය සොයාගත නොහැකි විය *");
    }

    const songData = searchResults.videos[0];
    const songUrl = songData.url;

    await messageHandler.sendMessage(from, { delete: searchingMsg.key });

    // ගීතයේ තොරතුරු මුලින් යවන්න
    await messageHandler.sendMessage(from, {
      image: { url: songData.thumbnail },
      caption: `* Rasiya Music Downloader*\n\n` +
               `* ගීතය:* ${songData.title}\n` +
               `*‍ බැලීම්:* ${songData.views}\n` +
               `*⏱ කාලය:* ${songData.timestamp}\n` +
               `* උඩුගත කලේ:* ${songData.ago}\n` +
               `* ගායකයා:* ${songData.author.name}\n\n` +
               `_Rasiya Bot © 2024 | Premium Quality_`
    }, { quoted: quotedMessage });

    let progressMessage = await messageHandler.sendMessage(from, {
      text: "*⬇️ බාගැනීම ආරම්භ වෙමින්...*\n" +
            "▱▱▱▱▱▱▱▱▱▱ 0%\n\n" +
            "_Rasiya Bot © 2024 | Premium Quality_"
    });

    const updateProgress = async (percentage) => {
      const progressBar = '▰'.repeat(Math.floor(percentage / 10)) + '▱'.repeat(10 - Math.floor(percentage / 10));
      await messageHandler.sendMessage(from, {
        edit: progressMessage.key,
        text: `*⬇️ බාගැනීම...*\n` +
              `${progressBar} ${percentage}%\n\n` +
              `_Rasiya Bot © 2024 | Premium Quality_`
      });
    };

    for (let i = 10; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await updateProgress(i);
    }

    let downloadLink;
    try {
        const result = await ddownr.download(songUrl, 'mp3');
        downloadLink = result.downloadUrl;
    } catch (error) {
        console.error("ddownr error:", error);
        return reply("*බාගැනීමේදී දෝෂයක් ඇති විය. කරුණාකර නැවත උත්සාහ කරන්න.*")
    }

    await updateProgress(100);
    let uploadingMsg = await messageHandler.sendMessage(from, {
      edit: progressMessage.key,
      text: `* ඔබගේ ගීතය උඩුගත වෙමින්...*\n` +
            `▰▰▰▰▰▰▰▰▰▰ 100%\n\n` +
            `_Rasiya Bot © 2024 | Premium Quality_`
    });

    for (let i = 10; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      await messageHandler.sendMessage(from, {
        edit: uploadingMsg.key,
        text: `* උඩුගත වෙමින්...*\n` +
              `${'▰'.repeat(i / 10)}${'▱'.repeat(10 - (i / 10))} ${i}%\n\n` +
              `_Rasiya Bot © 2024 | Premium Quality_`
      });
    }

    await messageHandler.sendMessage(from, {
      edit: uploadingMsg.key,
      text: `*✅ ගීතය සාර්ථකව බාගත්තා!*\n\n` +
            `*ඔබට අවශ්‍ය ආකෘතිය තෝරන්න:*\n` +
            `1.  ගීතය ලෙස (audio)\n` +
            `2.  ගොනුව ලෙස (document)\n\n` +
            `_Rasiya Bot © 2024 | Premium Quality_`
    });

    messageHandler.ev.once("messages.upsert", async (update) => {
      const message = update.messages[0];
      if (!message.message || !message.message.extendedTextMessage) return;

      const userReply = message.message.extendedTextMessage.text.trim();

      if (message.message.extendedTextMessage.contextInfo.stanzaId === uploadingMsg.key.id) {
        try {
          let sendingMsg = await messageHandler.sendMessage(from, {
            text: `* ඔබගේ ගීතය යවමින්...*\n` +
                  `▰▰▰▰▱▱▱▱▱▱ 30%\n\n` +
                  `_Rasiya Bot © 2024 | Premium Quality_`
          });

          await new Promise(resolve => setTimeout(resolve, 1500));
          await messageHandler.sendMessage(from, {
            edit: sendingMsg.key,
            text: `* යවමින්...*\n` +
                  `▰▰▰▰▰▰▰▰▱▱ 80%\n\n` +
                  `_Rasiya Bot © 2024 | Premium Quality_`
          });

          switch (userReply) {
            case '1':
              await messageHandler.sendMessage(from, {
                audio: { url: downloadLink },
                mimetype: "audio/mpeg",
                contextInfo: {
                  mentionedJid: [message.message.extendedTextMessage.contextInfo.participant]
                }
              }, { quoted: quotedMessage });
              break;
            case '2':
              await messageHandler.sendMessage(from, {
                document: { url: downloadLink },
                mimetype: 'audio/mpeg',
                fileName: `${songData.title}.mp3`,
                caption: `* ${songData.title}*\n\n` +
                         `_Rasiya Bot © 2024 | Premium Quality_`,
                contextInfo: {
                  mentionedJid: [message.message.extendedTextMessage.contextInfo.participant]
                }
              }, { quoted: quotedMessage });
              break;
            default:
              reply("*❌ වැරදි තේරීමක්! 1 හෝ 2 භාවිතා කරන්න*");
              return;
          }

          await messageHandler.sendMessage(from, {
            edit: sendingMsg.key,
            text: `*✅ ගීතය සාර්ථකව යවන ලදී!*\n\n` +
                  `_Rasiya Bot © 2024 | Premium Quality_`
          });

        } catch (error) {
          console.error(error);
          reply("*❌ දෝෂයක් ඇතිවිය! නැවත උත්සාහ කරන්න*");
        }
      }
    });

  } catch (error) {
    console.error(error);
    reply("*❌ දෝෂයක් ඇතිවිය! නැවත උත්සාහ කරන්න*");
  }
});

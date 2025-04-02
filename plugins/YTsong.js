const { cmd } = require('../command');
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3');
const axios = require('axios');

// ප්‍රගති තීරු උපයෝගී කරයි
const createProgressBar = (percent, barLength = 20) => {
  const progress = Math.round((percent / 100) * barLength);
  return `[${'█'.repeat(progress)}${'░'.repeat(barLength - progress)}] ${percent}%`;
};

// බාගත කිරීමේ ප්‍රගතිය පෙන්වයි
const showProgress = async (message, initialText) => {
  let progress = 0;
  const progressMsg = await message.reply(`${initialText}\n${createProgressBar(0)}`);

  const interval = setInterval(async () => {
    progress += (progress < 90 ? Math.floor(Math.random() * 10) + 5 : 1);
    if (progress > 100) progress = 100;

    try {
      await message.client.sendMessage(message.jid, {
        edit: progressMsg.key,
        text: `${initialText}\n${createProgressBar(progress)}`
      });

      if (progress === 100) {
        clearInterval(interval);
      }
    } catch (e) {
      clearInterval(interval);
    }
  }, 1500);

  return {
    update: async (text) => {
      await message.client.sendMessage(message.jid, {
        edit: progressMsg.key,
        text: `${text}\n${createProgressBar(progress)}`
      });
    },
    complete: async (finalText) => {
      clearInterval(interval);
      await message.client.sendMessage(message.jid, {
        edit: progressMsg.key,
        text: `${finalText}\n${createProgressBar(100)}`
      });
      return progressMsg;
    },
    delete: async () => {
      clearInterval(interval);
      await message.client.sendMessage(message.jid, {
        delete: progressMsg.key
      });
    }
  };
};

// ගීත විස්තර පණිවිඩය
const sendSongCard = async (message, song, downloadLinks) => {
  const details = `
╭───「 🎵 *${song.title.replace(/[|*_~`]/g, '')}* 」───╮
│
│ • 🕒 *Duration:* ${song.timestamp}
│ • 👀 *Views:* ${song.views}
│ • 📅 *Uploaded:* ${song.ago}
│ • 🎤 *Artist:* ${song.author.name}
│ • 🌐 *Quality:* 128kbps
│
╰───「 📥 *Download Options* 」───╯

Reply with number:
1. 🎧 Audio (MP3)
2. 📄 Document
3. 🎬 Video (MP4)`;

  await message.client.sendMessage(message.jid, {
    image: { url: song.thumbnail },
    caption: details,
    footer: "Rasiya MD Music Bot",
    buttons: [
      { buttonId: '1', buttonText: { displayText: 'MP3 Audio' }, type: 1 },
      { buttonId: '2', buttonText: { displayText: 'Document' }, type: 1 },
      { buttonId: '3', buttonText: { displayText: 'MP4 Video' }, type: 1 }
    ],
    headerType: 4
  });
};

cmd({
  pattern: "song",
  desc: "Download music with progress tracking",
  category: "download",
  react: '🎧',
  filename: __filename
}, async (message, match) => {
  try {
    if (!match) return await message.reply("🔍 *Please provide a song name or YouTube link*");

    // Step 1: Search progress
    const searchProgress = await showProgress(message, "🔎 *Searching YouTube...*");
    const searchResults = await yts(match);
    
    if (!searchResults.videos.length) {
      await searchProgress.complete("❌ *No results found!*");
      return;
    }

    const song = searchResults.videos[0];
    await searchProgress.update(`✅ *Found:* ${song.title.substring(0, 50)}`);

    // Step 2: Download progress
    const downloadProgress = await showProgress(message, "📥 *Downloading audio...*");
    
    try {
      // Get download links
      const audioResult = await ddownr.download(song.url, 'mp3');
      const videoResult = await ddownr.download(song.url, 'mp4');

      await downloadProgress.complete("⚡ *Processing your request...*");
      await downloadProgress.delete();

      // Step 3: Send interactive card
      await sendSongCard(message, song, {
        audio: audioResult.downloadUrl,
        video: videoResult.downloadUrl
      });

      // Handle user selection
      message.client.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message?.buttonsResponseMessage || 
            msg.message.buttonsResponseMessage.contextInfo.stanzaId !== message.key.id) return;

        const choice = msg.message.buttonsResponseMessage.selectedButtonId;
        let response;

        switch(choice) {
          case '1': // MP3 Audio
            response = await message.client.sendMessage(message.jid, {
              audio: { url: audioResult.downloadUrl },
              mimetype: 'audio/mpeg',
              ptt: false
            });
            break;
            
          case '2': // Document
            response = await message.client.sendMessage(message.jid, {
              document: { url: audioResult.downloadUrl },
              fileName: `${song.title}.mp3`,
              mimetype: 'audio/mpeg'
            });
            break;
            
          case '3': // MP4 Video
            response = await message.client.sendMessage(message.jid, {
              video: { url: videoResult.downloadUrl },
              caption: `🎬 *${song.title}*`
            });
            break;
        }

        if (response) {
          await message.client.sendMessage(message.jid, {
            react: {
              text: "✅",
              key: msg.key
            }
          });
        }
      });

    } catch (downloadError) {
      console.error(downloadError);
      await downloadProgress.complete("❌ *Download failed!* Try again later.");
    }

  } catch (error) {
    console.error(error);
    await message.reply("⚠️ *An error occurred!* Please try again.");
  }
});

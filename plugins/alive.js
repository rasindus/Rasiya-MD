const { cmd } = require('../command');
const config = require('../config');
const moment = require('moment-timezone');

// Uptime formatter
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

cmd({
    pattern: "alive",
    alias: ["status", "rasiya", "රසියා"],
    react: "👽",
    desc: "Check Rasiya MD bot status",
    category: "main",
    filename: __filename
},
async(robin, mek, m, { from, reply }) => {
    try {
        // 1. Set typing status
        await robin.sendPresenceUpdate('recording', from);

        // 2. Send audio
        await robin.sendMessage(from, { 
            audio: { 
                url: config.ALIVE_AUDIO || "https://github.com/rasindus/My-md/raw/main/audio.mp3"
            },
            mimetype: 'audio/mpeg',
            ptt: true
        }, { quoted: mek });

        // 3. Create beautiful status message
        const statusMsg = `
       👋 *HELLO, I'M RASIXA-MD!* ☕🍃 

╭─❖ *BOT INFORMATION* ❖─╮
│
│   👻 *CREATOR:* Rasindu
│   🌟 *VERSION:* ${config.VERSION || '7.0.0'}
│   ⏳ *UPTIME:* ${formatUptime(process.uptime())}
│   🚀 *RESPONSE:* ${Date.now() - m.messageTimestamp}ms
│
╰───────────────────╯

╭─❖ *SYSTEM STATUS* ❖─╮
│
│   📅 *DATE:* ${moment().tz('Asia/Colombo').format('YYYY-MM-DD')}
│   ⏰ *TIME:* ${moment().tz('Asia/Colombo').format('hh:mm A')}
│   💻 *PLATFORM:* ${process.platform}
│
╰───────────────────╯

> *RASIXA-MD WhatsApp Bot*
        `.trim();

        // 4. Send image with caption
        await robin.sendMessage(from, {
            image: { url: config.ALIVE_IMG || "https://i.imgur.com/default.jpg" },
            caption: statusMsg,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: mek });

    } catch(e) {
        console.error('Alive Command Error:', e);
        await reply("❌ Status update failed, but bot is running!");
    }
});

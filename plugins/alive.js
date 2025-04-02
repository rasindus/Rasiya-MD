const {cmd, commands} = require('../command')
const config = require('../config');

cmd({
    pattern: "alive",
    alias: ["bot", "robo", "status"],
    react: "🤖",
    desc: "Check if the bot is online",
    category: "main",
    filename: __filename
},
async(robin, mek, m, {from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    try {
        // Set bot presence
        await robin.sendPresenceUpdate('recording', from);
        
        // Send audio
        await robin.sendMessage(from, { 
            audio: { 
                url: "https://github.com/rasindus/My-md/raw/refs/heads/main/Untitled%20%E2%80%91%20Made%20with%20FlexClip.mp3" 
            }, 
            mimetype: 'audio/mpeg', 
            ptt: true 
        }, { quoted: mek });
        
        // Create elegant alive message
        const aliveMessage = `
╭─「 🤖 *BOT STATUS* 」
│
│   *${config.BOT_NAME || 'Your Bot'}* is alive and running!
│
│   ⏰ *Uptime:* ${formatUptime(process.uptime())}
│   📊 *Version:* ${config.VERSION || '1.0.0'}
│   💻 *Platform:* ${process.platform}
│
│   🌟 Thank you for using this service!
╰───────────────────
        `.trim();
        
        // Send image with caption
        await robin.sendMessage(from, {
            image: {url: config.ALIVE_IMG},
            caption: aliveMessage
        }, {quoted: mek});
        
    } catch(e) {
        console.error('Error in alive command:', e);
        reply(`❌ An error occurred: ${e.message}`);
    }
});

// Helper function to format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
} 

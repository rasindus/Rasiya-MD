const fs = require('fs');
const path = require('path');
const { GoogleTTS } = require('google-tts-api'); // වඩාත් ස්ථායී පුස්තකාලයක්

module.exports = {
    name: "tts",
    alias: ["texttospeech", "voice"],
    desc: "Convert text to voice message",
    category: "Utility",
    usage: `tts <text> or tts <language code> <text>`,
    react: "🎤",
    start: async (Rasiya, m, { text, prefix, args }) => {
        try {
            // Validate input
            if (!text && args.length === 0) {
                return await m.reply(`Please provide text to convert!\nExample: *${prefix}tts Hello World* or *${prefix}tts si ආයුබෝවන්*`);
            }

            // Create temp directory if not exists
            const tempDir = './tmp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Determine language and text
            let lang = 'en'; // Default language
            let actualText = text;
            
            // Check if first argument is a language code (2 letters)
            if (args.length > 1 && /^[a-z]{2}$/i.test(args[0])) {
                lang = args[0].toLowerCase();
                actualText = args.slice(1).join(' ');
            }

            // Validate text length
            if (actualText.length > 500) {
                return await m.reply('Text is too long! Maximum 500 characters allowed.');
            }

            if (actualText.length === 0) {
                return await m.reply('Please provide valid text to convert.');
            }

            // Generate unique filename
            const fileName = path.join(tempDir, `tts_${m.id}_${Date.now()}.mp3`);

            // Create TTS audio
            const tts = new GoogleTTS(actualText, lang);
            
            await new Promise((resolve, reject) => {
                tts.save(fileName, (err) => {
                    if (err) {
                        fs.unlinkSync(fileName).catch(() => {});
                        reject(new Error('TTS conversion failed'));
                    } else {
                        resolve();
                    }
                });
            });

            // Send audio message
            await Rasiya.sendMessage(
                m.from,
                {
                    audio: fs.readFileSync(fileName),
                    mimetype: 'audio/mpeg',
                    ptt: true
                },
                { quoted: m }
            );

            // Clean up
            fs.unlinkSync(fileName);

        } catch (error) {
            console.error('TTS Error:', error);
            await m.reply('Sorry, an error occurred while processing your TTS request. Please try again later.');
        }
    }
};

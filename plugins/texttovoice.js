const fs = require('fs')
const path = require('path')
const gtts = require('google-tts-api')
const fetch = require('node-fetch')

module.exports = {
    name: "tts",
    alias: ["voice", "say"],
    desc: "Text to Speech Converter",
    category: "Utility",
    usage: `.tts <text> OR .tts <lang> <text>`,
    react: "🔊",
    start: async (robin, mek, m, { text, args, reply }) => {
        try {
            // Check if text exists
            if (!text) return reply(`උදාහරණය: *.tts en Hello* හෝ *.tts si ආයුබෝවන්*`)

            // Language handling (default: English)
            let lang = 'en'
            let speechText = text
            
            // If first argument is 2-letter language code
            if (args[0] && args[0].match(/^[a-z]{2}$/i)) {
                lang = args.shift().toLowerCase()
                speechText = args.join(' ')
            }

            // Validate length
            if (speechText.length > 500) return reply('*Error:* Text must be under 500 characters!')

            // Get TTS audio URL
            const audioUrl = gtts.getAudioUrl(speechText, {
                lang: lang,
                slow: false,
                host: 'https://translate.google.com'
            })

            // Create temp folder
            const tempDir = './temp'
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

            // Download audio
            const response = await fetch(audioUrl)
            const audioBuffer = await response.buffer()
            const filePath = path.join(tempDir, `tts_${m.id}.mp3`)

            // Save file
            fs.writeFileSync(filePath, audioBuffer)

            // Send as audio message
            await robin.sendMessage(m.from, { 
                audio: fs.readFileSync(filePath), 
                mimetype: 'audio/mpeg',
                ptt: true 
            }, { quoted: mek })

            // Delete temp file
            fs.unlinkSync(filePath)

        } catch (err) {
            console.error('TTS Error:', err)
            reply('Error: TTS service failed. Try again later.')
        }
    }
}

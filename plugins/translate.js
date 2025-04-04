const translate = require('google-translate-api');
const fs = require('fs');

module.exports = {
    name: "tr",
    alias: ["translate", "trans"],
    desc: "Translate text between languages",
    category: "Utility",
    usage: `.tr <target_lang> <text> OR .tr <source_lang>_<target_lang> <text>`,
    react: "🌐",
    start: async (robin, m, { text, args, reply }) => {
        try {
            if (!text || args.length < 2) {
                return reply(`❌ උදාහරණ:\n*.tr en ආයුබෝවන්* (English)\n*.tr si_ja Hello* (Sinhala to Japanese)`);
            }

            // Parse language codes
            let [langCodes, ...content] = args;
            let sourceLang = 'auto';
            let targetLang = langCodes;

            // Check for source_target format (si_en)
            if (langCodes.includes('_')) {
                [sourceLang, targetLang] = langCodes.split('_');
            }

            const originalText = content.join(' ');

            // Validate language codes
            if (!targetLang || targetLang.length !== 2) {
                return reply('⚠️ Invalid language code! Use 2-letter codes like en, si, ja');
            }

            // Translation with progress message
            const processingMsg = await reply('🔄 Translating...');
            
            const result = await translate(originalText, {
                from: sourceLang,
                to: targetLang
            });

            // Format response
            const translation = `🌍 *Translation Result*\n\n` +
                               `📜 *Original* (${result.from.language.iso}):\n${originalText}\n\n` +
                               `🔄 *Translated* (${targetLang}):\n${result.text}\n\n` +
                               `🔍 *Pronunciation*: ${result.pronunciation || 'N/A'}\n\n` +
                               `_Powered by Rasiya-MD_`;

            // Delete processing message
            if (processingMsg && processingMsg.key) {
                await robin.sendMessage(m.from, { 
                    delete: processingMsg.key 
                });
            }

            await reply(translation);

        } catch (err) {
            console.error('Translation error:', err);
            reply('❌ Translation failed. Check language codes or try again later.');
        }
    }
}

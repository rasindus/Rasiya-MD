const translate = require('@vitalets/google-translate-api');
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
            // Help message if no text
            if (!text || args.length < 1) {
                const helpMsg = [
                    "🌍 *Rasiya Translator Help*",
                    "",
                    "Usage:",
                    "• `.tr en ආයුබෝවන්` - Sinhala → English",
                    "• `.tr si_ja Hello` - English → Sinhala → Japanese",
                    "",
                    "Supported language codes:",
                    "si - Sinhala | en - English | ta - Tamil",
                    "ja - Japanese | ko - Korean | fr - French",
                    "",
                    "Example: `.tr en ආයුබෝවන්`"
                ].join('\n');
                return reply(helpMsg);
            }

            // Parse language codes
            let langCodes = args[0];
            let sourceLang = 'auto';
            let targetLang = langCodes;
            let content = args.slice(1).join(' ');

            // Check for source_target format
            if (langCodes.includes('_')) {
                [sourceLang, targetLang] = langCodes.split('_');
            }

            // Validate input
            if (!content) return reply("Please provide text to translate!");
            if (!targetLang || targetLang.length !== 2) {
                return reply("Invalid language code! Use 2-letter codes like en, si, ja");
            }

            // Start translation
            const processingMsg = await reply("🔄 Translating...");
            
            try {
                const result = await translate(content, {
                    from: sourceLang,
                    to: targetLang
                });

                // Format response
                const translation = [
                    `📜 *Original* (${result.from.language.iso}):`,
                    `${content}\n`,
                    `🔄 *Translated* (${targetLang}):`,
                    `${result.text}\n`,
                    `🔊 *Pronunciation*: ${result.pronunciation || 'N/A'}`,
                    `_Powered by Rasiya-MD_`
                ].join('\n');

                // Delete processing message
                if (processingMsg && processingMsg.key) {
                    await robin.sendMessage(m.from, { 
                        delete: processingMsg.key 
                    });
                }

                await reply(translation);

            } catch (err) {
                console.error('Translation error:', err);
                if (processingMsg && processingMsg.key) {
                    await robin.sendMessage(m.from, { 
                        delete: processingMsg.key 
                    });
                }
                reply("❌ Translation failed. Please check the language codes and try again.");
            }

        } catch (err) {
            console.error('Module error:', err);
            reply("❌ An error occurred. Please check if all dependencies are installed.");
        }
    }
}

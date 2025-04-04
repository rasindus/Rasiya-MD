const { translate } = require('@vitalets/google-translate-api');

module.exports = {
    name: "tr",
    alias: ["translate"],
    desc: "පාඨයක් භාෂාවකින් තවත් භාෂාවකට පරිවර්තනය කරයි",
    category: "Utility",
    usage: `.tr en ආයුබෝවන්`,
    react: "🌐",
    start: async (m, { text, args, reply }) => {
        try {
            // උදව් පණිවුඩය
            if (!text) {
                return reply(`📝 *භාවිතය:*\n.tr <භාෂා කේතය> <පාඨය>\n\nඋදා:\n.tr en ආයුබෝවන්\n.tr ja Hello\n\nසහාය දක්වන භාෂා:\nen - ඉංග්‍රීසි\nsi - සිංහල\nta - දෙමළ\nja - ජපන්`);
            }

            const [lang, ...content] = args;
            const inputText = content.join(' ');

            if (!lang || !inputText) {
                return reply('❌ භාෂා කේතය හෝ පාඨය අඩුයි!');
            }

            if (lang.length !== 2) {
                return reply('⚠️ භාෂා කේතය 2 අකුරු විය යුතුය (en, si, ja)');
            }

            const result = await translate(inputText, { to: lang });

            await reply(`🌍 *පරිවර්තන ප්‍රතිඵලය*\n\n` +
                       `📜 මුල් පාඨය (${result.from.language.iso}):\n${inputText}\n\n` +
                       `🔄 පරිවර්තනය (${lang}):\n${result.text}\n\n` +
                       `🔊 උච්චාරණය: ${result.pronunciation || 'N/A'}`);

        } catch (error) {
            console.error('පරිවර්තන දෝෂය:', error);
            reply('❌ පරිවර්තනය අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.');
        }
    }
}

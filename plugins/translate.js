const axios = require('axios');

// පරිවර්තන සේවාව - Google Translate API
async function translate(text, targetLang = 'si', apiKey = process.env.GOOGLE_API_KEY) {
    try {
        const response = await axios.post(
            'https://translation.googleapis.com/language/translate/v2',
            { q: text, target: targetLang },
            { params: { key: apiKey } }
        );
        return response.data.data.translations[0].translatedText;
    } catch (error) {
        console.error('⚠️ පරිවර්තන දෝෂය:', error.message);
        return text; // දෝෂයක් වුවද මුල් පෙළ ආපසු යවයි
    }
}

// WhatsApp බොට් සඳහා ප්ලගින් ලෙස එක් කිරීම
function setupTranslatePlugin(client) {
    client.on('message', async (message) => {
        if (message.body.startsWith('!tr')) {
            const [, targetLang, ...textParts] = message.body.split(' ');
            const text = textParts.join(' ');

            if (!text || !targetLang) {
                return message.reply('⚙️ භාවිතය: !tr <භාෂාව> <පෙළ>\nඋදා: !tr si Hello');
            }

            const translatedText = await translate(text, targetLang);
            message.reply(`🌍 පරිවර්තනය (${targetLang}): ${translatedText}`);
        }
    });
}

module.exports = { translate, setupTranslatePlugin };

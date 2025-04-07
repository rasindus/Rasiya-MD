const axios = require('axios');

// ඔයාගේ API Key එක මෙතනට දාන්න (Config File එකකින් ගන්නත් පුළුවන්)
const API_KEY = 'Sky|68fbaba57359a83c485283fd8be1b80c81828799';

// Base URL එක
const TEMP_MAIL_API_BASE_URL = 'https://api.skymansion.site/temp-mail';

// ටෙම්ප් මේල් ඉල්ලපු Users ලව Memory එකේ Track කරන්න Object එකක්
const tempMailSessions = {};

async function getNewTempEmail() {
  try {
    const response = await axios.get(`${TEMP_MAIL_API_BASE_URL}/create?api_key=${API_KEY}`);
    return response.data.email;
  } catch (error) {
    console.error('තාවකාලික ඊමේල් ලිපිනය ලබාගැනීමේදී දෝෂයක්:', error);
    return null;
  }
}

async function checkNewEmails(email) {
  try {
    const response = await axios.get(`${TEMP_MAIL_API_BASE_URL}/messages?email=${email}&api_key=${API_KEY}`);
    return response.data.messages;
  } catch (error) {
    console.error('නව පණිවිඩ පරීක්ෂා කිරීමේදී දෝෂයක්:', error);
    return [];
  }
}

async function sendWhatsAppMessage(sock, userId, message) {
  const decoratedMessage = `✨✉️ ${message} ✉️✨`; // පණිවිඩය වටේට ඉමෝජි දාලා ලස්සන කරනවා
  try {
    await sock.sendMessage(userId, { text: decoratedMessage });
  } catch (error) {
    console.error('පණිවිඩය යැවීමේදී දෝෂයක්:', error);
  }
}

async function handleTempMailRequest(sock, userId) {
  if (tempMailSessions[userId]) {
    await sendWhatsAppMessage(sock, userId, '⏳ ඔයා දැනටමත් ටෙම්ප් මේල් සේවාවක් ඉල්ලා ඇත. කාලය අවසන් වනතුරු ඉන්න. ⏳');
    return;
  }

  const tempEmail = await getNewTempEmail();

  if (tempEmail) {
    await sendWhatsAppMessage(sock, userId, `📧 ඔයාගේ තාවකාලික ඊමේල් ලිපිනය: ${tempEmail}. මේ ලිපිනයට ලැබෙන පණිවිඩ තවත් විනාඩි 10ක් ඇතුළත ඔයාට ලැබෙයි. ⏰`);

    tempMailSessions[userId] = {
      email: tempEmail,
      intervalId: null,
      timeoutId: null,
    };

    const intervalId = setInterval(async () => {
      const newEmails = await checkNewEmails(tempEmail);
      if (newEmails && newEmails.length > 0) {
        for (const email of newEmails) {
          const messageContent = `📬 නව ඊමේල් පණිවිඩය:\n\n👤 From: ${email.from}\nSubject: ${email.subject}\n📄 Body: ${email.body}`;
          await sendWhatsAppMessage(sock, userId, messageContent);
        }
      }
    }, 5000);

    const timeoutId = setTimeout(async () => {
      clearInterval(intervalId);
      delete tempMailSessions[userId];
      await sendWhatsAppMessage(sock, userId, '⌛ තාවකාලික ඊමේල් ලිපිනයේ කාලය අවසන්. 🔚');
      // මෙතනදි ඔයාට ඒ ඊමේල් ලිපිනය Delete කරන්න වගේ දෙයක් අවශ්‍ය නම් ඒකට අදාල කෝඩ් එක දාන්න පුළුවන්
    }, 10 * 60 * 1000);

    // Interval ID සහ Timeout ID Session එකේ Store කරනවා Clear කරන්න
    tempMailSessions[userId].intervalId = intervalId;
    tempMailSessions[userId].timeoutId = timeoutId;

  } else {
    await sendWhatsAppMessage(sock, userId, '⚠️ තාවකාලික ඊමේල් ලිපිනය ලබාගැනීමේදී දෝෂයක් ඇති වුණා. 😥');
  }
}

module.exports = { handleTempMailRequest };

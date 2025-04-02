const fs = require("fs");
if (fs.existsSync("config.env"))
  require("dotenv").config({ path: "./config.env" });

function convertToBool(text, fault = "true") {
  return text === fault ? true : false;
}
module.exports = {
  SESSION_ID: process.env.SESSION_ID || "e4RGDQiI#7dKhCJ4UPX9zYjv5bQpdyUV23V4dd_bhMQRBAGsDxHw",
  OWNER_NUM: process.env.OWNER_NUM || "94783364887",
  PREFIX: process.env.PREFIX || ".",
  ALIVE_IMG: process.env.ALIVE_IMG || "https://raw.githubusercontent.com/rasindus/My-md/refs/heads/main/Gemini_Generated_Image_hxiqmihxiqmihxiq.jpg",
  ALIVE_MSG: process.env.ALIVE_MSG || "හායි I am alive❤️😇 කරුනාකර විදානයක් ලබාදෙන්න🤍😊 𝚃𝚑𝚒𝚜 𝚋𝚘𝚝 𝚌𝚛𝚎𝚊𝚝𝚎𝚍 𝚋𝚢 𝚛𝚊𝚜𝚒𝚗𝚍𝚞🫂",
  AUTO_VOICE: process.env.AUTO_VOICE || "false",
  AUTO_STICKER : process.env.AUTO_STICKER || "false",
  AUTO_STICKER : process.env.AUTO_STICKER || "false",
  MODE: process.env.MODE || "public",
  GEMINI_API_KEY : process.env.GEMINI_API_KEY || "AIzaSyC8pSIvRTtYS-ZghDZWWPUY360gEFB37hM",
  MOVIE_API_KEY : process.env.MOVIE_API_KEY || "sky|ef8ec9b6478140b29bdab63164f82bc02ef713a2",
  BOT_NAME: "RASIYA_®",  // නව එකතු කිරීම
  VERSION: "1.0.0",           // නව එකතු කිරීම
};

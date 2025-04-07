const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers,
} = require("@whiskeysockets/baileys");
const { setupTranslatePlugin } = require('./translate-plugin');
const fs = require("fs");
const P = require("pino");
const config = require("./config");
const {
  getBuffer,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson,
} = require("./lib/functions");
const qrcode = require("qrcode-terminal");
const util = require("util");
const { sms, downloadMediaMessage } = require("./lib/msg");
const axios = require("axios");
const { File } = require("megajs");
const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

const prefix = config.PREFIX;
const ownerNumber = config.OWNER_NUM;

// Session management
if (!fs.existsSync(__dirname + "/auth_info_baileys/creds.json")) {
  if (!config.SESSION_ID) {
    return console.log("Please add your session to SESSION_ID env !!");
  }
  const sessdata = config.SESSION_ID;
  const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
  filer.download((err, data) => {
    if (err) throw err;
    fs.writeFile(__dirname + "/auth_info_baileys/creds.json", data, () => {
      console.log("Session එක සාර්ථකව බාගත විය ✅");
    });
  });
}

async function connectToWA() {
  console.log("Connecting ❤️R_A_S_I_Y_A❤️");
  
  const { state, saveCreds } = await useMultiFileAuthState(
    __dirname + "/auth_info_baileys/"
  );
  
  const { version } = await fetchLatestBaileysVersion();

  const robin = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version,
  });

  // Event handlers
  robin.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === "close") {
      if (lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === "open") {
      console.log(" Installing plugins... ");
      
      // Load plugins
      const path = require("path");
      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          require("./plugins/" + plugin);
        }
      });
      
      console.log("❤️R_A_S_I_Y_A❤️ නිවැරදිව ස්ථාපනය විය. ✅");
      console.log("❤️R_A_S_I_Y_A❤️ whatsapp සමග සම්බන්ධ විය.✅");

      // Send connection notification
      const up = `❤️R_A_S_I_Y_A❤️ connected successful ✅`;
      const up1 = `Hello ❤️R_A_S_I_Y_A❤️, I made bot successful`;

      robin.sendMessage(ownerNumber + "@s.whatsapp.net", {
        image: { url: config.BOT_IMAGE_URL },
        caption: up,
      });
      
      robin.sendMessage("94726785433@s.whatsapp.net", {
        image: { url: config.BOT_IMAGE_URL },
        caption: up1,
      });
    }
  });

  robin.ev.on("creds.update", saveCreds);

  // Message handler
  robin.ev.on("messages.upsert", async (mek) => {
    try {
      mek = mek.messages[0];
      if (!mek.message) return;
      
      mek.message = getContentType(mek.message) === "ephemeralMessage"
        ? mek.message.ephemeralMessage.message
        : mek.message;

      // Auto read status
      if (mek.key && mek.key.remoteJid === "status@broadcast" && config.AUTO_READ_STATUS === "false") {
        await robin.readMessages([mek.key]);
      }

      const m = sms(robin, mek);
      const type = getContentType(mek.message);
      const content = JSON.stringify(mek.message);
      const from = mek.key.remoteJid;
      const quoted = type == "extendedTextMessage" && mek.message.extendedTextMessage.contextInfo != null
        ? mek.message.extendedTextMessage.contextInfo.quotedMessage || []
        : [];
      
      const body = type === "conversation"
        ? mek.message.conversation
        : type === "extendedTextMessage"
        ? mek.message.extendedTextMessage.text
        : type == "imageMessage" && mek.message.imageMessage.caption
        ? mek.message.imageMessage.caption
        : type == "videoMessage" && mek.message.videoMessage.caption
        ? mek.message.videoMessage.caption
        : "";
      
      const isCmd = body.startsWith(prefix);
      const command = isCmd
        ? body.slice(prefix.length).trim().split(" ").shift().toLowerCase()
        : "";
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(" ");
      const isGroup = from.endsWith("@g.us");
      const sender = mek.key.fromMe
        ? robin.user.id.split(":")[0] + "@s.whatsapp.net" || robin.user.id
        : mek.key.participant || mek.key.remoteJid;
      const senderNumber = sender.split("@")[0];
      const botNumber = robin.user.id.split(":")[0];
      const pushname = mek.pushName || "Sin Nombre";
      const isMe = botNumber.includes(senderNumber);
      const isOwner = ownerNumber.includes(senderNumber) || isMe;
      const botNumber2 = await jidNormalizedUser(robin.user.id);
      const groupMetadata = isGroup
        ? await robin.groupMetadata(from).catch((e) => {})
        : "";
      const groupName = isGroup ? groupMetadata.subject : "";
      const participants = isGroup ? await groupMetadata.participants : "";
      const groupAdmins = isGroup ? await getGroupAdmins(participants) : "";
      const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
      const isAdmins = isGroup ? groupAdmins.includes(sender) : false;
      const isReact = m.message.reactionMessage ? true : false;
      
      const reply = (teks) => {
        robin.sendMessage(from, { text: teks }, { quoted: mek });
      };

      // Owner react
      if (senderNumber.includes("94783364887")) {
        if (isReact) return;
        m.react("®️");
      }

      // Work mode check
      if (!isOwner && config.MODE === "private") return;
      if (!isOwner && isGroup && config.MODE === "inbox") return;
      if (!isOwner && !isGroup && config.MODE === "groups") return;

      // Command handling
      const events = require("./command");
      const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
      
      if (isCmd) {
        const cmd = events.commands.find((cmd) => cmd.pattern === cmdName) ||
          events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
        
        if (cmd) {
          if (cmd.react) {
            robin.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
          }

          try {
            await cmd.function(robin, mek, m, {
              from,
              quoted,
              body,
              isCmd,
              command,
              args,
              q,
              isGroup,
              sender,
              senderNumber,
              botNumber2,
              botNumber,
              pushname,
              isMe,
              isOwner,
              groupMetadata,
              groupName,
              participants,
              groupAdmins,
              isBotAdmins,
              isAdmins,
              reply,
            });
          } catch (e) {
            console.error("[PLUGIN ERROR] " + e);
            reply(`Error executing command: ${e.message}`);
          }
        }
      }

      // Event handling
      events.commands.map(async (command) => {
        try {
          if (body && command.on === "body") {
            await command.function(robin, mek, m, {
              from,
              l: console.log,
              quoted,
              body,
              isCmd,
              command,
              args,
              q,
              isGroup,
              sender,
              senderNumber,
              botNumber2,
              botNumber,
              pushname,
              isMe,
              isOwner,
              groupMetadata,
              groupName,
              participants,
              groupAdmins,
              isBotAdmins,
              isAdmins,
              reply,
            });
          } else if (mek.q && command.on === "text") {
            await command.function(robin, mek, m, {
              from,
              l: console.log,
              quoted,
              body,
              isCmd,
              command,
              args,
              q,
              isGroup,
              sender,
              senderNumber,
              botNumber2,
              botNumber,
              pushname,
              isMe,
              isOwner,
              groupMetadata,
              groupName,
              participants,
              groupAdmins,
              isBotAdmins,
              isAdmins,
              reply,
            });
          } else if (
            (command.on === "image" || command.on === "photo") &&
            mek.type === "imageMessage"
          ) {
            await command.function(robin, mek, m, {
              from,
              l: console.log,
              quoted,
              body,
              isCmd,
              command,
              args,
              q,
              isGroup,
              sender,
              senderNumber,
              botNumber2,
              botNumber,
              pushname,
              isMe,
              isOwner,
              groupMetadata,
              groupName,
              participants,
              groupAdmins,
              isBotAdmins,
              isAdmins,
              reply,
            });
          } else if (command.on === "sticker" && mek.type === "stickerMessage") {
            await command.function(robin, mek, m, {
              from,
              l: console.log,
              quoted,
              body,
              isCmd,
              command,
              args,
              q,
              isGroup,
              sender,
              senderNumber,
              botNumber2,
              botNumber,
              pushname,
              isMe,
              isOwner,
              groupMetadata,
              groupName,
              participants,
              groupAdmins,
              isBotAdmins,
              isAdmins,
              reply,
            });
          }
        } catch (e) {
          console.error("[EVENT HANDLER ERROR] " + e);
        }
      });
    } catch (error) {
      console.error("[MESSAGE HANDLER ERROR] " + error);
    }
  });
}

// Express server setup
app.get("/", (req, res) => {
  res.send("hey, ❤️R_A_S_I_Y_A❤️ started✅");
});

app.listen(port, () => {
  console.log(`Server listening on port http://localhost:${port}`);
});

// Start WhatsApp connection
setTimeout(() => {
  connectToWA().catch(err => {
    console.error("Failed to connect to WhatsApp:", err);
    process.exit(1);
  });
}, 4000);

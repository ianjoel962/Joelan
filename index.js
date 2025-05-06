const { default: makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const connectDB = require("./database");
const config = require("./config");
const fs = require("fs");
require("dotenv").config();

connectDB();

const { state, saveState } = useSingleFileAuthState(`./${config.sessionName}.json`);

async function startBot() {
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (!messages || type !== "notify") return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    if (text.startsWith(config.prefix + "ping")) {
      await sock.sendMessage(sender, { text: "Pong!" });
    }
  });
}

startBot();

import 'dotenv/config';
import path from 'node:path';
import * as baileys from '@whiskeysockets/baileys';

import { TokenBucketRateLimiter } from './rate-limit';
import { handleIncomingMessage } from './incoming';

const {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} = baileys as typeof import('@whiskeysockets/baileys');
const { makeWASocket: makeSocketFromDefault } = (baileys as any).default ?? {};
const socketFactory = makeWASocket ?? makeSocketFromDefault;
if (typeof socketFactory !== 'function') {
  throw new Error('Baileys makeWASocket export is unavailable');
}
type WASocket = import('@whiskeysockets/baileys').WASocket;

const RECONNECT_DELAY_MS = 2000;

export async function start() {
  const stateDir = path.resolve(process.cwd(), process.env.WA_STATE_DIR ?? 'apps/worker/state');
  const { state, saveCreds } = await useMultiFileAuthState(stateDir);
  const { version } = await fetchLatestBaileysVersion();
  const limiter = new TokenBucketRateLimiter();

  let socket: WASocket | null = null;
  let botJid = '';
  let botLid = '';
  let reconnecting = false;

  const bootSocket = () => {
    reconnecting = false;
    socket = socketFactory({
      version,
      auth: state,
      printQRInTerminal: true,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      browser: ['Unibot', 'Chrome', '1.0.0']
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.info('Scan QR code in the terminal to link WhatsApp.');
      }

      if (connection === 'open') {
        botJid = socket?.user?.id ?? '';
        botLid = socket?.user?.lid ?? '';
        botLid = botLid?.replace(/:\d+@/, "@");
        console.info(`WhatsApp connected as ${botJid} (LID: ${botLid})`);
      }

      if (connection === 'close') {
        const statusCode =
          (lastDisconnect?.error as any)?.output?.statusCode ?? (lastDisconnect?.error as any)?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect && !reconnecting) {
          reconnecting = true;
          console.warn('WhatsApp socket closed, attempting to reconnect...');
          setTimeout(bootSocket, RECONNECT_DELAY_MS);
        } else if (!shouldReconnect) {
          console.error('WhatsApp session logged out. Delete auth state to relink.');
        }
      }
    });

    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') {
        return;
      }

      const message = messages[0];

      if (!message) {
        return;
      }

      try {
        if (!socket) {
          return;
        }

        await handleIncomingMessage({
          socket,
          message,
          botJid,
          botLid,
          limiter
        });
      } catch (error) {
        console.error('Failed to handle incoming message', error);
      }
    });
  };

  bootSocket();

  if (!socket) {
    throw new Error('Failed to initialize WhatsApp socket');
  }

  return socket;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((error) => {
    console.error('Worker failed to start', error);
    process.exit(1);
  });
}

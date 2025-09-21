import 'dotenv/config';
import { createServer } from 'node:http';
import path from 'node:path';
import * as baileys from '@whiskeysockets/baileys';

import { TokenBucketRateLimiter } from './rate-limit';
import { handleIncomingMessage } from './incoming';
import { sendOtpDirectMessage } from './otp-sender';

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
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? '';

export async function start() {
  const stateDir = path.resolve(process.cwd(), process.env.WA_STATE_DIR ?? 'apps/worker/state');
  const { state, saveCreds } = await useMultiFileAuthState(stateDir);
  const { version } = await fetchLatestBaileysVersion();
  const limiter = new TokenBucketRateLimiter();

  let socket: WASocket | null = null;
  let botJid = '';
  let botLid = '';
  let reconnecting = false;
  let httpServerStarted = false;

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
        console.info('Scan QR code di terminal untuk menghubungkan WhatsApp.');
      }

      if (connection === 'open') {
        botJid = socket?.user?.id ?? '';
        botLid = socket?.user?.lid ?? '';
        botLid = botLid?.replace(/:\d+@/, '@');
        console.info(`WhatsApp terhubung sebagai ${botJid} (LID: ${botLid})`);
      }

      if (connection === 'close') {
        const statusCode =
          (lastDisconnect?.error as any)?.output?.statusCode ?? (lastDisconnect?.error as any)?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect && !reconnecting) {
          reconnecting = true;
          console.warn('Socket WhatsApp terputus, mencoba menghubungkan ulang...');
          setTimeout(bootSocket, RECONNECT_DELAY_MS);
        } else if (!shouldReconnect) {
          console.error('Sesi WhatsApp logout. Hapus state untuk relink.');
          socket = null;
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
        console.error('Gagal memproses pesan masuk', error);
      }
    });

    if (!httpServerStarted) {
      startHttpServer(() => socket);
      httpServerStarted = true;
    }
  };

  const startHttpServer = (getSocket: () => WASocket | null) => {
    const port = Number(process.env.WORKER_PORT ?? 4000);

    const server = createServer(async (req, res) => {
      if (req.method !== 'POST' || req.url !== '/api/otp/send') {
        res.statusCode = 404;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'Not Found' }));
        return;
      }

      if (!INTERNAL_SECRET || req.headers['x-internal-secret'] !== INTERNAL_SECRET) {
        res.statusCode = 401;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      let body = '';
      try {
        for await (const chunk of req) {
          body += chunk;
        }
      } catch (error) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'Gagal membaca body permintaan' }));
        return;
      }

      let payload: { phone?: string; code?: string };
      try {
        payload = JSON.parse(body || '{}');
      } catch (error) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'Body harus berupa JSON' }));
        return;
      }

      if (!payload.phone || !payload.code) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'phone dan code wajib diisi' }));
        return;
      }

      const activeSocket = getSocket();

      if (!activeSocket) {
        res.statusCode = 503;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'Socket WhatsApp belum siap' }));
        return;
      }

      try {
        await sendOtpDirectMessage(activeSocket, payload.phone, payload.code);
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        console.error('Gagal mengirim OTP ke WhatsApp', error);
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'Gagal mengirim OTP' }));
      }
    });

    server.listen(port, () => {
      console.info(`Worker API berjalan di http://localhost:${port}`);
      if (!INTERNAL_SECRET) {
        console.warn('Peringatan: INTERNAL_API_SECRET belum diatur. Permintaan akan ditolak.');
      }
    });
  };

  bootSocket();

  if (!socket) {
    throw new Error('Gagal menginisialisasi socket WhatsApp');
  }

  return socket;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((error) => {
    console.error('Worker gagal dijalankan', error);
    process.exit(1);
  });
}

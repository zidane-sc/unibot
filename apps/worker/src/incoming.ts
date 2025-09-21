import type { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { detectIntent } from './intents';
import { routeIntent } from './router';
import type { RouteContext } from './router';
import { extractText, jidToDisplay, stripMention } from './utils';
import { TokenBucketRateLimiter } from './rate-limit';
import { findGroup } from './registry';

export type IncomingContext = {
  socket: WASocket;
  message: WAMessage;
  botJid: string;
  limiter: TokenBucketRateLimiter;
};

function isGroupJid(jid?: string | null): jid is string {
  return typeof jid === 'string' && jid.endsWith('@g.us');
}

function isStatusBroadcast(jid?: string | null): boolean {
  return jid === 'status@broadcast';
}

function extractMentionedJids(message: WAMessage): string[] {
  const info = message.message?.extendedTextMessage?.contextInfo;
  return info?.mentionedJid ?? [];
}

export async function handleIncomingMessage({ socket, message, botJid, limiter }: IncomingContext) {
  if (!botJid) {
    return;
  }

  const remoteJid = message.key.remoteJid;

  if (!isGroupJid(remoteJid) || isStatusBroadcast(remoteJid)) {
    return;
  }

  if (!message.message || message.key.fromMe) {
    return;
  }

  const senderJid = message.key.participant ?? remoteJid;

  if (!senderJid || senderJid === botJid) {
    return;
  }

  const text = extractText(message);

  if (!text) {
    return;
  }

  const mentionedJids = extractMentionedJids(message);
  const mentionToken = botJid.split('@')[0] ?? botJid;
  const isMentioned =
    mentionedJids.includes(botJid) ||
    text.toLowerCase().includes(`@${mentionToken.toLowerCase()}`);

  if (!isMentioned) {
    return;
  }

  const rateKey = `${remoteJid}:${senderJid}`;
  if (!limiter.isAllowed(rateKey)) {
    await socket.sendMessage(remoteJid, {
      text: `@${jidToDisplay(senderJid)} santai dulu ya, coba lagi dalam beberapa detik.`,
      mentions: [senderJid]
    });
    return;
  }

  const sanitized = stripMention(text, botJid);
  const intent = detectIntent(sanitized);
  const groupEntry = findGroup(remoteJid);

  const context: RouteContext = {
    groupJid: remoteJid,
    senderJid,
    message: sanitized,
    classId: groupEntry?.classId
  };

  const reply = await routeIntent(intent, context);

  if (!reply) {
    return;
  }

  const mentions = reply.mentions?.length ? reply.mentions : [senderJid];

  await socket.sendMessage(remoteJid, {
    text: reply.text,
    mentions
  });
}

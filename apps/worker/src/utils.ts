import type { proto, WAMessage } from '@whiskeysockets/baileys';

function unwrapMessage(message?: proto.IMessage | null): proto.IMessage | undefined {
  if (!message) {
    return undefined;
  }

  if (message.ephemeralMessage?.message) {
    return unwrapMessage(message.ephemeralMessage.message);
  }

  if (message.viewOnceMessage?.message) {
    return unwrapMessage(message.viewOnceMessage.message);
  }

  return message;
}

export function extractText(message: WAMessage): string {
  const content = unwrapMessage(message.message);

  if (!content) {
    return '';
  }

  if (content.conversation) {
    return content.conversation;
  }

  if (content.extendedTextMessage?.text) {
    return content.extendedTextMessage.text;
  }

  if (content.imageMessage?.caption) {
    return content.imageMessage.caption;
  }

  if (content.videoMessage?.caption) {
    return content.videoMessage.caption;
  }

  if (content.buttonsResponseMessage?.selectedButtonId) {
    return content.buttonsResponseMessage.selectedButtonId;
  }

  if (content.listResponseMessage?.singleSelectReply?.selectedRowId) {
    return content.listResponseMessage.singleSelectReply.selectedRowId;
  }

  return '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stripMention(text: string, botJid: string): string {
  const identifier = botJid.split('@')[0] ?? botJid;
  const mentionPattern = new RegExp(`@${escapeRegExp(identifier)}`, 'gi');
  const jidPattern = new RegExp(escapeRegExp(botJid), 'gi');
  return text.replace(mentionPattern, ' ').replace(jidPattern, ' ').replace(/\s+/g, ' ').trim();
}

export function jidToDisplay(jid: string): string {
  return jid.split('@')[0] ?? jid;
}

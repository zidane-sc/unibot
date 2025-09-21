import type { WASocket } from '@whiskeysockets/baileys';

function ensureUserJid(identifier: string): string {
  if (identifier.includes('@')) {
    return identifier;
  }

  const sanitized = identifier.replace(/[^0-9]/g, '');
  return `${sanitized}@s.whatsapp.net`;
}

export async function sendOtpDirectMessage(sock: WASocket, jidOrPhone: string, code: string) {
  const targetJid = ensureUserJid(jidOrPhone);
  const lines = [
    'Kode OTP Unibot kamu:',
    `*${code}*`,
    '',
    'Kode ini berlaku selama 3 menit. Jangan bagikan kepada siapa pun.'
  ];

  await sock.sendMessage(targetJid, {
    text: lines.join('\n')
  });
}

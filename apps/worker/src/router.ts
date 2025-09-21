import type { DetectedIntent } from './intents';
import { callWebInternalApi } from './api';
import { formatBold, formatList } from '../../../packages/shared/formatting';
import { jidToDisplay } from './utils';

const bold: (text: string) => string = formatBold as (text: string) => string;
const list: (items: string[]) => string = formatList as (items: string[]) => string;

export type RouteContext = {
  groupJid: string;
  senderJid: string;
  message: string;
  classId?: string;
};

export type RoutedReply = {
  text: string;
  mentions?: string[];
  register?: { classId: string };
} | null;

function buildFallback(intent: DetectedIntent | null, context: RouteContext): RoutedReply {
  const mention = `@${jidToDisplay(context.senderJid)}`;

  if (!intent) {
    return {
      text: `${mention} maaf, aku belum paham. Ketik *help* untuk lihat perintah yang tersedia.`,
      mentions: [context.senderJid]
    };
  }

  switch (intent.name) {
    case 'greetings':
      return {
        text: `${mention} halo! Ada yang bisa kubantu? Ketik *help* untuk daftar perintah.`,
        mentions: [context.senderJid]
      };
    case 'help':
      return {
        text: [
          `${mention} ${bold('Unibot')} siap bantu dengan:`,
          list(['Lihat jadwal kelas', 'Cek tugas terbaru', 'Lihat kelompok'])
        ].join('\n'),
        mentions: [context.senderJid]
      };
    case 'register':
      return {
        text: `${mention} untuk menghubungkan kelas, pastikan kamu admin terdaftar lalu ketik *@unibot register*.`,
        mentions: [context.senderJid]
      };
    default:
      return {
        text: `${mention} catat ya, aku masih belajar untuk perintah "${intent.matchedPhrase}".`,
        mentions: [context.senderJid]
      };
  }
}

export async function routeIntent(intent: DetectedIntent | null, context: RouteContext): Promise<RoutedReply> {
  try {
    console.log('Routing intent via internal API:', intent, context);

    const response = await callWebInternalApi({
      path: '/api/internal/wa/reply',
      method: 'POST',
      body: {
        intent,
        context
      }
    });

    const data = (await response.json().catch(() => null)) as
      | { message?: string; mentions?: string[]; register?: { classId: string } }
      | null;

    if (data?.message || data?.register) {
      return {
        text: data.message ?? '',
        mentions: data.mentions,
        register: data.register
      };
    }
  } catch (error) {
    console.error('Failed to route intent via internal API', error);
  }

  return buildFallback(intent, context);
}

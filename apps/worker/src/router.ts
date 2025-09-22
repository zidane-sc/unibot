import type { DetectedIntent } from './intents';
import { callWebInternalApi } from './api';
import { formatBold, formatList } from '../../../packages/shared/formatting';
import { jidToDisplay } from './utils';

const WEB_URL = process.env.WEB_URL || 'https://unibot.com';

const bold: (text: string) => string = formatBold as (text: string) => string;
const list: (items: string[]) => string = formatList as (items: string[]) => string;

function sentenceCase(word: string): string {
  if (!word) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1);
}

function describeScheduleFilters(filters?: DetectedIntent['filters']): string | null {
  if (!filters) {
    return null;
  }

  const parts: string[] = [];

  if (filters.relativeDay) {
    const labelMap: Record<string, string> = {
      'today': 'hari ini',
      'tonight': 'malam ini',
      'tomorrow': 'besok',
      'day-after-tomorrow': 'lusa',
      'yesterday': 'kemarin',
      'this-week': 'minggu ini',
      'next-week': 'minggu depan'
    };

    parts.push(`buat ${labelMap[filters.relativeDay] ?? filters.relativeDay}`);
  }

  if (filters.day) {
    parts.push(`hari ${sentenceCase(filters.day)}`);
  }

  if (filters.query) {
    parts.push(`kata kunci "${filters.query}"`);
  }

  return parts.length ? parts.join(', ') : null;
}

function describeAssignmentFilters(filters?: DetectedIntent['filters']): string | null {
  if (!filters) {
    return null;
  }

  const parts: string[] = [];

  if (filters.subject) {
    parts.push(`mata kuliah "${filters.subject}"`);
  }

  if (filters.relativeDay) {
    const labelMap: Record<string, string> = {
      'today': 'hari ini',
      'tonight': 'malam ini',
      'tomorrow': 'besok',
      'day-after-tomorrow': 'lusa',
      'yesterday': 'kemarin',
      'this-week': 'minggu ini',
      'next-week': 'minggu depan'
    };
    parts.push(`deadline ${labelMap[filters.relativeDay] ?? filters.relativeDay.replace(/-/g, ' ')}`);
  }

  return parts.length ? parts.join(', ') : null;
}

function describeGroupFilters(filters?: DetectedIntent['filters']): string | null {
  if (!filters) {
    return null;
  }

  if (filters.group) {
    return `kelompok ${filters.group}`;
  }

  if (filters.groupQuery) {
    return `kata kunci "${filters.groupQuery}"`;
  }

  if (filters.relativeDay) {
    const labelMap: Record<string, string> = {
      'today': 'hari ini',
      'tonight': 'malam ini',
      'tomorrow': 'besok',
      'day-after-tomorrow': 'lusa',
      'yesterday': 'kemarin',
      'this-week': 'minggu ini',
      'next-week': 'minggu depan'
    };
    return `jadwal ${labelMap[filters.relativeDay] ?? filters.relativeDay.replace(/-/g, ' ')}`;
  }

  if (filters.day) {
    return `jadwal hari ${sentenceCase(filters.day)}`;
  }

  if (filters.subject) {
    return `jadwal ${filters.subject}`;
  }

  return null;
}

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
      text: `${mention} 😅 belum nangkep maksudnya. Coba tag aku bareng kata kunci, misal *@unibot help*.`,
      mentions: [context.senderJid]
    };
  }

  switch (intent.name) {
    case 'greetings':
      return {
        text: `${mention} 👋 hai! Ada yang bisa kubantu? Ketik *help* buat lihat menu lengkap ya.`,
        mentions: [context.senderJid]
      };
    case 'help':
      return {
        text: [
          `${mention} berikut beberapa perintah yang bisa kamu coba:`,
          list([
            '🆘 help – lihatin command & tips (contoh: @unibot help)',
            '👋 hi – sapa bot biar tau kamu hadir 😄',
            '🗓️ jadwal [hari/matkul] – cek jadwal kelas (contoh: jadwal hari ini)',
            '📚 tugas [matkul] – lihat tugas & deadline (contoh: tugas basis data)',
            '👥 kelompok [matkul/nama] – cek info grup (contoh: kelompok 3)',
            '🧑‍🤝‍🧑 anggota [kelompok] – lihat daftar anggota (contoh: anggota kelompok 3)'
          ]),
          `🌐 Web: ${WEB_URL}`
        ].join('\n'),
        mentions: [context.senderJid]
      };
    case 'register':
      return {
        text: `${mention} 🔐 mau hubungkan kelas? Pastikan kamu admin, terus ketik *@unibot register* biar grupnya nyambung.`,
        mentions: [context.senderJid]
      };
    case 'schedule': {
      const detail = describeScheduleFilters(intent.filters);
      const info = detail ? `lagi cari jadwal ${detail}` : 'butuh jadwal kelas?';
      return {
        text: [
          `${mention} 🗓️ ${info}`,
          'Tag aku + jadwal [hari/matkul] biar aku ambil data terbaru ya.',
          'Contoh: *@unibot jadwal kamis* atau *@unibot jadwal Pancasila*.'
        ].join('\n'),
        mentions: [context.senderJid]
      };
    }
    case 'assignment': {
      const detail = describeAssignmentFilters(intent.filters);
      const info = detail ? `lagi nyari tugas untuk ${detail}` : 'lagi cek tugas yang belum kelar?';
      return {
        text: [
          `${mention} 📚 ${info}`,
          'Ketik *tugas [matkul]* atau tambah rentang waktu biar lebih spesifik.',
          'Contoh: *@unibot tugas basis data* atau *@unibot tugas minggu ini*.'
        ].join('\n'),
        mentions: [context.senderJid]
      };
    }
    case 'group': {
      const detail = describeGroupFilters(intent.filters);
      const info = detail ? `lagi cek ${detail}` : 'mau tau pembagian kelompok?';
      return {
        text: [
          `${mention} 👥 ${info}`,
          'Pakai format *kelompok [matkul/nama tim]* supaya aku bisa filter cepat.',
          'Contoh: *@unibot kelompok proyek akhir* atau *@unibot kelompok 2*.'
        ].join('\n'),
        mentions: [context.senderJid]
      };
    }
    case 'groupMembers': {
      const detail = describeGroupFilters(intent.filters);
      const info = detail ? `lagi mau lihat anggota ${detail}` : 'lagi cek siapa aja di kelompok?';
      return {
        text: [
          `${mention} 🧑‍🤝‍🧑 ${info}`,
          'Pakai format *anggota [nama tim/nomor]* biar aku list membernya.',
          'Contoh: *@unibot anggota kelompok 3* atau *@unibot anggota proyek akhir*.'
        ].join('\n'),
        mentions: [context.senderJid]
      };
    }
    case 'reminder':
      return {
        text: [
          `${mention} ⏰ pengingat bisa diatur via dashboard ya.`,
          'Admin bisa masuk ke web Unibot terus aktifkan pengingat jadwal/tugas yang diinginkan.'
        ].join('\n'),
        mentions: [context.senderJid]
      };
    case 'about':
      return {
        text: [
          `${mention} ✨ Unibot itu asisten WhatsApp buat kelas kamu.`,
          'Catat jadwal, tugas, dan kelompok langsung dari chat, plus dashboard web buat admin.'
        ].join('\n'),
        mentions: [context.senderJid]
      };
    case 'thanks':
      return {
        text: `${mention} 🙌 sama-sama! Seneng bisa bantu.`,
        mentions: [context.senderJid]
      };
    default:
      return {
        text: `${mention} 🤔 catet dulu ya, aku masih belajar buat perintah "${intent.matchedPhrase}". Coba cek *help* buat yang udah ready.`,
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

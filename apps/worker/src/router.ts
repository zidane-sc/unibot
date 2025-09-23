import type { DetectedIntent } from './intents';
import { callWebInternalApi } from './api';
import { formatBold, formatList } from '../../../packages/shared/formatting';
import { jidToDisplay } from './utils';

const WEB_URL = process.env.WEB_URL || 'https://unibot.com';

const bold: (text: string) => string = formatBold as (text: string) => string;
const list: (items: string[]) => string = formatList as (items: string[]) => string;
const SECTION_DIVIDER = '━━━━━━━━━━━━━━━━━━━━';
const SUBSECTION_DIVIDER = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈';

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
      text: [
        `${mention} 🤷‍♂️ ${bold('Hmm, kurang jelas nih...')}`,
        SECTION_DIVIDER,
        'Sepertinya ada yang kurang dalam perintahmu.',
        '',
        `💡 ${bold('COBA LAGI:')}`,
        list(['@unibot help – untuk melihat semua command', '@unibot [command] [parameter]']),
        '',
        `📝 ${bold('CONTOH YANG BENAR:')}`,
        list(['@unibot anggota kelompok 1', '@unibot jadwal hari ini'])
      ].join('\n'),
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
          `${mention} 🤖 ${bold('UniBot - Asisten Kelas Pintar')}`,
          SECTION_DIVIDER,
          'Hai! Tag *@unibot* + command berikut untuk mulai:',
          '',
          `📋 ${bold('MENU UTAMA')}`,
          list([
            '`help` - Panduan lengkap',
            '`jadwal [hari/matkul]` - Cek jadwal kelas',
            '`tugas [matkul]` - Lihat tugas & deadline',
            '`kelompok [matkul/nama]` - Info grup project',
            '`anggota [kelompok]` - Daftar anggota'
          ]),
          '',
          `💡 ${bold('CONTOH PENGGUNAAN')}`,
          list([
            '@unibot jadwal hari ini',
            '@unibot tugas basis data',
            '@unibot kelompok 3'
          ]),
          '',
          `🌐 ${WEB_URL}`
        ].join('\n'),
        mentions: [context.senderJid]
      };
    case 'register':
      return {
        text: [
          `${mention} 🔐 *Mau hubungkan kelas?*`,
          SECTION_DIVIDER,
          'Pastikan kamu admin grup, lalu ketik *@unibot register* biar Unibot nyambung ke kelasmu ya.'
        ].join('\n'),
        mentions: [context.senderJid]
      };
    case 'schedule': {
      const detail = describeScheduleFilters(intent.filters);
      const info = detail ? `lagi cari jadwal ${detail}` : 'mau cek jadwal kelas?';
      return {
        text: [
          `${mention} 📅 ${bold(sentenceCase(info))}`,
          SECTION_DIVIDER,
          'Tag *@unibot* lalu tulis *jadwal [hari/matkul]* biar aku ambil jadwal paling baru.',
          '',
          `🧭 ${bold('CONTOH:')}`,
          list(['@unibot jadwal hari ini', '@unibot jadwal kamis', '@unibot jadwal pancasila'])
        ].join('\n'),
        mentions: [context.senderJid]
      };
    }
    case 'assignment': {
      const detail = describeAssignmentFilters(intent.filters);
      const info = detail ? `lagi nyari tugas untuk ${detail}` : 'lagi cari tugas & deadline?';
      return {
        text: [
          `${mention} 📝 ${bold(sentenceCase(info))}`,
          SECTION_DIVIDER,
          'Mau cek tugas yang mana nih? 🤔',
          '',
          `🎯 ${bold('CARA PAKAI:')}`,
          list(['@unibot tugas [nama matkul]', '@unibot tugas minggu ini', '@unibot tugas bulan ini']),
          '',
          `📌 ${bold('CONTOH:')}`,
          list(['@unibot tugas basis data', '@unibot tugas pemrograman mobile'])
        ].join('\n'),
        mentions: [context.senderJid]
      };
    }
    case 'group': {
      const detail = describeGroupFilters(intent.filters);
      const info = detail ? `lagi cek ${detail}` : 'mau tau pembagian kelompok?';
      return {
        text: [
          `${mention} 👥 ${bold(sentenceCase(info))}`,
          SECTION_DIVIDER,
          'Aku bisa bantu list data kelompok project kamu.',
          '',
          `🏷️ ${bold('FORMAT PERINTAH:')}`,
          list(['@unibot kelompok [nama/nomor]', '@unibot kelompok [mata kuliah]']),
          '',
          '🔍 Sebut nama tim biar hasilnya makin akurat ya!'
        ].join('\n'),
        mentions: [context.senderJid]
      };
    }
    case 'groupMembers': {
      const detail = describeGroupFilters(intent.filters);
      const info = detail ? `lagi mau lihat anggota ${detail}` : 'lagi cek siapa aja di kelompok?';
      return {
        text: [
          `${mention} 🧑‍🤝‍🧑 ${bold(sentenceCase(info))}`,
          SECTION_DIVIDER,
          'Filter kelompok yang mau kamu cek, nanti aku sebutin anggotanya.',
          '',
          `📂 ${bold('FORMAT:')}`,
          list(['@unibot anggota kelompok 1', '@unibot anggota proyek akhir']),
          '',
          '✨ Tag aku lagi kalau mau cek kelompok lainnya.'
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
        text: [
          `${mention} 🤷‍♂️ ${bold('Perintahnya belum aku kenal nih...')}`,
          SECTION_DIVIDER,
          'Kayaknya aku belum paham formatnya.',
          '',
          `💡 ${bold('COBA GINI:')}`,
          list(['@unibot help', '@unibot jadwal hari ini', '@unibot tugas basis data'])
        ].join('\n'),
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

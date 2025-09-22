import { intentPhrases } from '../../../packages/shared/intent-phrases';

const phrasesDictionary: Record<string, string[]> = intentPhrases as Record<string, string[]>;

export type IntentFilters = {
  relativeDay?: string;
  day?: string;
  query?: string;
  subject?: string;
  group?: string;
  groupQuery?: string;
};

export type DetectedIntent = {
  name: string;
  confidence: number;
  matchedPhrase: string;
  filters?: IntentFilters;
};

const RELATIVE_DAY_KEYWORDS: Array<[string, string]> = [
  ['minggu depan', 'next-week'],
  ['minggu ini', 'this-week'],
  ['hari ini', 'today'],
  ['malam ini', 'tonight'],
  ['besok', 'tomorrow'],
  ['lusa', 'day-after-tomorrow'],
  ['kemarin', 'yesterday']
];
const DAY_KEYWORD_ENTRIES: Array<[string, string]> = [
  ['senin', 'senin'],
  ['selasa', 'selasa'],
  ['rabu', 'rabu'],
  ['kamis', 'kamis'],
  ['jumat', 'jumat'],
  ['sabtu', 'sabtu'],
  ['minggu', 'minggu'],
  ['monday', 'monday'],
  ['tuesday', 'tuesday'],
  ['wednesday', 'wednesday'],
  ['thursday', 'thursday'],
  ['friday', 'friday'],
  ['saturday', 'saturday'],
  ['sunday', 'sunday']
];

const DAY_KEYWORDS: Array<[RegExp, string]> = DAY_KEYWORD_ENTRIES.map(([keyword, value]) => [
  new RegExp(`\\b${keyword}\\b`, 'u'),
  value
]);

function extractScheduleFilters(message: string): IntentFilters | undefined {
  const filters: IntentFilters = {};
  for (const [keyword, value] of RELATIVE_DAY_KEYWORDS) {
    if (message.includes(keyword)) {
      filters.relativeDay = value;
      break;
    }
  }

  if (!filters.relativeDay) {
    for (const [regex, value] of DAY_KEYWORDS) {
      if (regex.test(message)) {
        filters.day = value;
        break;
      }
    }
  }

  return Object.keys(filters).length ? filters : undefined;
}

function extractQueryFilter(message: string, matchedPhrase: string): string | undefined {
  const normalizedPhrase = matchedPhrase.toLowerCase();
  const index = message.indexOf(normalizedPhrase);

  if (index === -1) {
    return undefined;
  }

  const before = message.slice(0, index).trim();
  const after = message.slice(index + normalizedPhrase.length).trim();
  let candidate = [before, after].filter(Boolean).join(' ').trim();

  if (!candidate || candidate === normalizedPhrase) {
    return undefined;
  }

  for (const [keyword] of RELATIVE_DAY_KEYWORDS) {
    candidate = candidate.replace(new RegExp(`\\b${keyword}\\b`, 'gu'), '').trim();
  }

  for (const [keyword] of DAY_KEYWORD_ENTRIES) {
    candidate = candidate.replace(new RegExp(`\\b${keyword}\\b`, 'gu'), '').trim();
  }

  candidate = candidate.replace(/\s{2,}/g, ' ').trim();

  if (!candidate) {
    return undefined;
  }

  return candidate;
}

function enrichIntent(message: string, intent: DetectedIntent): DetectedIntent {
  const filters: IntentFilters = intent.filters ? { ...intent.filters } : {};

  if (intent.name === 'schedule' || intent.name === 'assignment' || intent.name === 'group' || intent.name === 'groupMembers') {
    const scheduleFilters = extractScheduleFilters(message);
    if (scheduleFilters) {
      Object.assign(filters, scheduleFilters);
    }
  }

  if (
    intent.name === 'assignment' ||
    intent.name === 'group' ||
    intent.name === 'schedule' ||
    intent.name === 'groupMembers'
  ) {
    const query = extractQueryFilter(message, intent.matchedPhrase.toLowerCase());
    if (query) {
      if ((intent.name === 'group' || intent.name === 'groupMembers') && /kelompok\s+\d+/u.test(message)) {
        const match = message.match(/kelompok\s+(?<group>[^\s]+)/u);
        if (match?.groups?.group) {
          filters.group = match.groups.group;
        }
      }

      if (!filters.group) {
        const key =
          intent.name === 'group' || intent.name === 'groupMembers'
            ? 'groupQuery'
            : intent.name === 'assignment'
              ? 'subject'
              : 'query';
        filters[key] = query;
      }
    }
  }

  return Object.keys(filters).length ? { ...intent, filters } : intent;
}

export function detectIntent(message: string): DetectedIntent | null {
  const normalized = message.toLowerCase().trim();

  if (!normalized) {
    return null;
  }

  let bestMatch: DetectedIntent | null = null;

  for (const [name, phrases] of Object.entries(phrasesDictionary)) {
    for (const phrase of phrases) {
      const candidate = phrase.toLowerCase();
      const position = normalized.indexOf(candidate);

      if (position === -1) {
        continue;
      }

      const coverage = candidate.length / normalized.length;
      const confidence = Math.min(1, 0.6 + coverage * 0.4);

      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = {
          name,
          confidence,
          matchedPhrase: phrase
        };
      }
    }
  }

  if (!bestMatch) {
    return null;
  }

  return enrichIntent(normalized, bestMatch);
}

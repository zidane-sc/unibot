import { intentPhrases } from '../../../packages/shared/intent-phrases';

const phrasesDictionary: Record<string, string[]> = intentPhrases as Record<string, string[]>;

export type DetectedIntent = {
  name: string;
  confidence: number;
  matchedPhrase: string;
};

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

  return bestMatch;
}

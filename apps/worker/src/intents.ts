export type DetectedIntent = {
  name: string;
  confidence: number;
};

export function detectIntent(_message: string): DetectedIntent | null {
  // TODO: implement rule-based intent detection using shared phrases
  return null;
}

export function normalizeHints(input: string[] | undefined | null): string[] {
  if (!input || input.length === 0) {
    return [];
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const hint of input) {
    const value = hint.trim().toLowerCase();

    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

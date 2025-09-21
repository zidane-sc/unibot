import type { UnibotSession } from './session';

export function normalizePhoneNumber(input: string): string {
  // TODO: add full E.164 normalization rules
  return input.trim();
}

export function hasActiveSession(session: UnibotSession | undefined): boolean {
  // TODO: enforce role-based guard rules
  return Boolean(session?.userId);
}

import type { SessionData } from './session';

export function normalizePhoneNumber(input: string): string {
  const digits = input.replace(/[^0-9]/g, '');

  if (!digits) {
    return '';
  }

  if (digits.startsWith('62')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith('8')) {
    return `62${digits}`;
  }

  return digits;
}

export function phoneFromJid(jid: string): string {
  if (!jid) {
    return '';
  }

  const [rawIdentifier] = jid.split('@');
  if (!rawIdentifier) {
    return '';
  }

  const identifier = rawIdentifier.split(':')[0] ?? rawIdentifier;
  return normalizePhoneNumber(identifier);
}

export function hasActiveSession(session: SessionData | undefined): boolean {
  // TODO: enforce role-based guard rules
  return Boolean(session?.userId);
}

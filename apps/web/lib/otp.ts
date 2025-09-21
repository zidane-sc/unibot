import { createHash, timingSafeEqual } from 'crypto';

export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function verifyOtp(code: string, hashed: string): boolean {
  if (!code || !hashed) {
    return false;
  }

  const codeHash = hashOtp(code);
  const left = Buffer.from(codeHash, 'utf8');
  const right = Buffer.from(hashed, 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  try {
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

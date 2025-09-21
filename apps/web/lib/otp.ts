export function hashOtp(code: string): string {
  // TODO: replace with secure hashing + expiration
  return code;
}

export function verifyOtp(code: string, hashed: string): boolean {
  // TODO: use timing-safe comparison
  return code === hashed;
}

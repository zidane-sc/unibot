type Bucket = {
  tokens: number;
  lastRefill: number;
};

export class TokenBucketRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly capacity = 5,
    private readonly refillIntervalMs = 3000
  ) {}

  isAllowed(key: string): boolean {
    const bucket = this.getBucket(key);
    this.refill(bucket);

    if (bucket.tokens <= 0) {
      return false;
    }

    bucket.tokens -= 1;
    return true;
  }

  private getBucket(key: string): Bucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.capacity,
        lastRefill: Date.now()
      });
    }

    return this.buckets.get(key)!;
  }

  private refill(bucket: Bucket) {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;

    if (elapsed < this.refillIntervalMs) {
      return;
    }

    const intervals = Math.floor(elapsed / this.refillIntervalMs);
    bucket.tokens = Math.min(this.capacity, bucket.tokens + intervals * this.capacity);
    bucket.lastRefill = now;
  }
}

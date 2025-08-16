// api/_lib/redis.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!);
  }
  return redis;
}
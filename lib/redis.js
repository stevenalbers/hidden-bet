// api/_lib/redis.ts
import Redis from 'ioredis';
let redis = null;
export function getRedisClient() {
    if (!redis) {
        try {
            redis = new Redis(process.env.REDIS_URL || '');
            redis.on('error', (error) => {
                console.error('Redis connection error:', error);
            });
            redis.on('connect', () => {
                console.log('Redis connected successfully');
            });
        }
        catch (error) {
            console.error('Failed to create Redis client:', error);
            throw error;
        }
    }
    return redis;
}

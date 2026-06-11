import { type RedisClientOptions, createClient } from 'redis';
import { ENV } from './env.js';
import logger from './logger.js';

// Initialize the Redis client
const clientOptions: RedisClientOptions = {};

if (ENV.REDIS_URL.startsWith('/')) {
    clientOptions.socket = { path: ENV.REDIS_URL, tls: false };
} else {
    clientOptions.url = ENV.REDIS_URL;
}

const redisClient = createClient(clientOptions);

redisClient.on('connect', () => {
    logger.info('🚀 Redis client connecting...');
});

redisClient.on('ready', () => {
    logger.info('✅ Redis Client Connected and Ready!');
});

redisClient.on('error', (err) => {
    logger.error(`❌ Redis Client Error: ${err.message || err}`);
});

redisClient.on('end', () => {
    logger.warn('📴 Redis connection disconnected.');
});


export const connectRedis = async (): Promise<void> => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

export { redisClient };
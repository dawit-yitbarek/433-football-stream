import type { Request, Response } from 'express';
import { redisClient } from '../config/redis.js';
import logger from '../config/logger.js';

class MatchController {
    // Fetches the filtered match list directly from the Redis memory store
    public async getMatches(_req: Request, res: Response): Promise<Response> {
        try {
            const cachedMatches = await redisClient.get('matches:today');

            if (!cachedMatches) {
                logger.warn('⚠️ Match cache requested but found empty.');
                return res.status(200).json([]);
            }

            const matches = JSON.parse(cachedMatches);
            return res.status(200).json(matches);
        } catch (error: any) {
            logger.error(`❌ Error inside getLiveDashboardMatches controller: ${error.message || error}`);
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to retrieve match data from cache stream.'
            });
        }
    }
}

export const matchController = new MatchController();
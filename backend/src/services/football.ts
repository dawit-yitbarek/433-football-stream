import { redisClient } from '../config/redis.js';
import crypto from 'crypto';
import logger from '../config/logger.js';
import { apiRotator } from './apiRotator.js';
import { verifyStreamChannel } from '../utils/verifyStreamChannel.js';

// Required leagues
const ALLOWED_LEAGUES = [
    'Premier League',
    'LaLiga',
    'Serie A',
    'Bundesliga',
    'UEFA Champions League',
    'International Friendly',
    'World Cup'
].map(league => league.toLowerCase());

export interface ApiMatch {
    match_time: number;
    match_status: 'live' | 'vs';
    home_team_name: string;
    home_team_logo: string;
    homeTeamScore: string;
    away_team_name: string;
    away_team_logo: string;
    awayTeamScore: string;
    league_name: string;
    league_logo: string;
    servers: Array<{
        name: string;
        url: string;
        type: 'direct' | 'drm' | 'referer';
        header?: Record<string, string>;
    }>;
}

interface ApiResponseData {
    matches: ApiMatch[];
    pagination: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

class FootballService {
    public generateMatchId(homeTeam: string, awayTeam: string, timestamp: number): string {
        const uniqueString = `${homeTeam.trim().toLowerCase()}_vs_${awayTeam.trim().toLowerCase()}_${timestamp}`;

        // Create an MD5 hash string
        return crypto.createHash('md5').update(uniqueString).digest('hex');
    }

    public setLiveStatus(matchTime: number): ("live" | "vs") {
        const matchTimeMs = matchTime * 1000;
        const currentTimeMs = Date.now();
        if (matchTimeMs > currentTimeMs) {
            return 'vs';
        } else {
            return 'live';
        }
    }

    public async syncMatchesCache(): Promise<ApiMatch[]> {
        try {
            let activeKey = await apiRotator.getNextKey();
            if (!activeKey) {
                logger.error("🛑 Sync aborted: No available keys remaining.");
                return [];
            }

            const today = new Date();
            const dateStr = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear()}`;

            let allMatches: ApiMatch[] = [];
            let page = 1;
            let hasMore = true;
            let consecutiveErrors = 0; // Prevent infinite loops if all keys crash out on one page

            while (hasMore) {
                if (consecutiveErrors >= apiRotator.getKeyCount()) {
                    logger.error("🚨 All available keys failed consecutively. Hard stopping page loop.");
                    break;
                }

                try {
                    const response = await fetch(`https://football-live-streaming-api.p.rapidapi.com/matches?date=${dateStr}&page=${page}`, {
                        headers: {
                            'X-RapidAPI-Key': activeKey,
                            'X-RapidAPI-Host': 'football-live-streaming-api.p.rapidapi.com'
                        }
                    });


                    if (response.status === 429) {
                        logger.error(`🚫 Key hit 429 Rate Limit on page ${page}. Blacklisting and swapping...`);

                        await apiRotator.blacklistKey(activeKey);
                        activeKey = await apiRotator.getNextKey();

                        consecutiveErrors++;
                        continue; // Re-run the while loop for the same page with the fresh key
                    }

                    if (!response.ok) {
                        throw new Error(`API responded with status code: ${response.status}`);
                    }

                    const data = await response.json() as ApiResponseData;

                    if (data && data.matches) {
                        allMatches = [...allMatches, ...data.matches];
                        hasMore = data.pagination.hasNext;
                        page++;
                        consecutiveErrors = 0;
                    } else {
                        hasMore = false;
                    }

                } catch (error: any) {
                    logger.error(`Error fetching data on page ${page}: ${error}`);

                    // Generic fallback error handling
                    activeKey = await apiRotator.getNextKey();
                    consecutiveErrors++;

                    // 1 second cooldown delay to prevent immediate error spamming
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            const totalPagesBurned = Math.max(1, page - 1);
            await redisClient.set('api:metrics:page-weight', totalPagesBurned.toString());

            // Filter matches by checking if their league is in allowed list
            const allowedMatches = allMatches.filter((match) =>
                ALLOWED_LEAGUES.includes(match.league_name.toLowerCase())
            );

            const filteredMatches: ApiMatch[] = allowedMatches.map((match) => ({
                ...match,
                id: this.generateMatchId(match.home_team_name, match.away_team_name, match.match_time),
                match_status: this.setLiveStatus(match.match_time)
            }));

            const matchesWithServers = filteredMatches.filter(match => match.servers.length > 0);
            const matchesWithValidServers: ApiMatch[] = [];

            for (const match of matchesWithServers) {
                const verifiedServers = await verifyStreamChannel(match.servers);

                if (verifiedServers.length > 0) {
                    matchesWithValidServers.push({
                        ...match,
                        servers: verifiedServers
                    });
                }
            }

            // Save the structured array back to Redis as a JSON string and Set to expire in 24 hours
            await redisClient.set(
                'matches:today',
                JSON.stringify(matchesWithValidServers),
                { EX: 86400 }
            );

            logger.info(`⚡ Cache Sync Complete: Parsed ${allMatches.length} games -> Retained ${matchesWithValidServers.length} target league games.`);
            return matchesWithValidServers;
        } catch (error: any) {
            logger.error(`❌ Error during syncMatchesCache routine: ${error.message || error}`);

            // Fallback: Return the data currently in the cache if available, otherwise return an empty array
            const existingCache = await redisClient.get('matches:today');
            return existingCache ? JSON.parse(existingCache) : [];
        }
    }
}

export const footballService = new FootballService();
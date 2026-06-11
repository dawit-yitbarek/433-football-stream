import cron, { type ScheduledTask } from 'node-cron';
import { footballService, type ApiMatch } from '../services/football.js';
import { apiRotator } from '../services/apiRotator.js';
import { redisClient } from '../config/redis.js';
import logger from '../config/logger.js';

interface StreamWindow {
    start: number;
    end: number;
}

let todayActiveWindows: StreamWindow[] = [];
let livePollerTask: ScheduledTask | null = null; // Keeps track of the running live cron instance

// Merges overlapping matches into distinct blocks
const calculateActiveWindows = (matches: ApiMatch[]): StreamWindow[] => {
    if (matches.length === 0) return [];
    const MATCH_DURATION_SECONDS = 2 * 60 * 60; // 2 hours

    const rawWindows = matches.map(match => {
        const cleanMatchTime = Number(match.match_time);

        return {
            start: cleanMatchTime,
            end: cleanMatchTime + MATCH_DURATION_SECONDS
        };
    });

    // Sort by start time and merge overlaps
    rawWindows.sort((a, b) => a.start - b.start);
    const mergedWindows: StreamWindow[] = [rawWindows[0] as StreamWindow];

    for (let i = 1; i < rawWindows.length; i++) {
        const current = rawWindows[i] as StreamWindow;
        const lastMerged = mergedWindows[mergedWindows.length - 1] as StreamWindow;
        if (current.start <= lastMerged.end) {
            lastMerged.end = Math.max(lastMerged.end, current.end);
        } else {
            mergedWindows.push(current);
        }
    }
    return mergedWindows;
};

const setupDynamicLivePoller = async () => {
    try {
        if (livePollerTask) {
            livePollerTask.stop();
            livePollerTask = null;
        }

        if (todayActiveWindows.length === 0) {
            logger.info('No games scheduled for today. Live poller will sleep.');
            return;
        }

        let totalLiveMinutes = 0;
        todayActiveWindows.forEach(window => {
            totalLiveMinutes += (window.end - window.start) / 60;
        });

        const activeKeysCount = await apiRotator.getAvailableKeyCount();

        if (activeKeysCount === 0) {
            logger.error('🚨 System Cooldown: Zero active API keys available to back this poller right now.');
            return;
        }

        // Fetch estimated page weights recorded during the last execution
        const storedWeight = await redisClient.get('api:metrics:page-weight');
        const pagesPerSync = storedWeight ? parseInt(storedWeight, 10) : 1; // Default to 1 if empty

        // Total daily capacity vs Cost Per Sync
        const totalDailyCredits = activeKeysCount * 50;
        const safetyBuffer = 5;
        const usableCredits = totalDailyCredits - safetyBuffer;

        // Total Syncs allowed = Total available credits / how many pages a single sync costs
        const maxAllowedSyncsToday = usableCredits / pagesPerSync;

        let intervalMinutes = Math.ceil(totalLiveMinutes / maxAllowedSyncsToday);

        intervalMinutes = Math.max(1, intervalMinutes);

        logger.info(`📊 Dynamic Schedule Optimization [PAGINATION AWARE]:`);
        logger.info(`   - Total Active Streaming Time: ${totalLiveMinutes} mins`);
        logger.info(`   - Detected Pages Per Sync Cost: ${pagesPerSync} credit(s)`);
        logger.info(`   - Active Un-banned Keys: ${activeKeysCount}/${apiRotator.getKeyCount()} (${totalDailyCredits} credits)`);
        logger.info(`   - Regulated Polling Interval: Every ${intervalMinutes} minute(s)`);

        const cronExpression = `*/${intervalMinutes} * * * *`;

        livePollerTask = cron.schedule(cronExpression, async () => {
            const nowSeconds = Math.floor(Date.now() / 1000);

            const insideActiveWindow = todayActiveWindows.some(
                window => nowSeconds >= window.start && nowSeconds <= window.end
            );

            if (!insideActiveWindow) {
                logger.info('⏸️ Currently outside of active match windows. Skipping this poll cycle.');
                return;
            }

            logger.info(`⚽ Match window active! Fetching via key rotator [Interval: ${intervalMinutes}m]...`);

            await footballService.syncMatchesCache();
        });
    } catch (error: any) {
        logger.error(`❌ Failed to set up dynamic live poller: ${error.message || error}`);
    }
};

// Morning and afternoon Alignment Task (Runs every day at 00:00 UTC and 10:00 UTC)
const startDailySchedulerJob = () => {
    cron.schedule('0 0,10 * * *', async () => {
        logger.info('⏰ Running scheduled daily alignment routine...');
        try {
            const matches = await footballService.syncMatchesCache();
            todayActiveWindows = calculateActiveWindows(matches);

            // Re-evaluate keys and time blocks to generate today's custom interval
            await setupDynamicLivePoller();
        } catch (error: any) {
            logger.error(`❌ Failed during daily schedule mapping routine: ${error.message || error}`);
        }
    }, {
        timezone: "UTC"
    });
};

// Initialize the background jobs immediately on startup
export const initializeBackgroundJobs = async () => {
    logger.info('⚙️ Initializing background crons and warming up cache...');
    try {
        const initialMatches = await footballService.syncMatchesCache();
        todayActiveWindows = calculateActiveWindows(initialMatches);

        // Set up the dynamic live poller based on today's layout right away on startup
        await setupDynamicLivePoller();
    } catch (error: any) {
        logger.error(`❌ Failed during immediate cache warmup block: ${error.message || error}`);
    }

    startDailySchedulerJob();
};
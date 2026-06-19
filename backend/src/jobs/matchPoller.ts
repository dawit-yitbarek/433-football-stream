import cron from 'node-cron';
import { footballService } from '../services/football.js';
import { apiRotator } from '../services/apiRotator.js';
import logger from '../config/logger.js';

// Calculates a polling interval based on current active API keys

const getTimeInterval = async (): Promise<number> => {
    const activeKeysCount = await apiRotator.getAvailableKeyCount();

    if (activeKeysCount <= 1) {
        return 60; // once per hour if keys are low
    }
    if (activeKeysCount <= 3) {
        return 45;
    }
    return 30;
};

export const initializeBackgroundJobs = async () => {
    logger.info('⚙️ Initializing Stateless Background Sync Engine...');

    // immediate cache warmup check on server launch
    try {
        await footballService.syncMatchesCache();
    } catch (startupError: any) {
        logger.error(`⚠️ Non-fatal startup warm-up bypass: ${startupError.message || startupError}`);
    }

    const intervalMinutes = await getTimeInterval();
    const cronExpression = `*/${intervalMinutes} * * * *`;

    logger.info(`📅 Flat Poller Registered: Will trigger sync every [${intervalMinutes} minutes] continuously.`);

    // Schedule the main background execution cycle
    cron.schedule(cronExpression, async () => {
        logger.info('⏰ Periodic synchronization cycle triggered...');
        try {
            await footballService.syncMatchesCache();
        } catch (periodicError: any) {
            logger.error(`❌ Failed execution during periodic loop step: ${periodicError.message || periodicError}`);
        }
    });
};
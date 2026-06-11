import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import { connectRedis } from './config/redis.js';
import { ENV } from './config/env.js';
import { initializeBackgroundJobs } from './jobs/matchPoller.js';
import matchRoutes from './routes/matchRoutes.js';
import logger from './config/logger.js';

const app: Application = express();

app.use(cors());
app.use(express.json());

// api routes
app.use('/api', matchRoutes);

// health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'Football proxy engine is healthy.' });
});


const startServer = async () => {
    try {
        await connectRedis();

        await initializeBackgroundJobs();

        app.listen(ENV.PORT, () => {
            logger.info(`🚀 Server is running on port ${ENV.PORT}`);
        });
    } catch (error: any) {
        logger.error(`❌ Critical failure during server startup initialization: ${error.message || error}`);
        process.exit(1);
    }
};

// start the server
startServer();

process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err.message || err}`);
    logger.error(err.stack);
});

process.on("unhandledRejection", (reason: any) => {
    logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
});
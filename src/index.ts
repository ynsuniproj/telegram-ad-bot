import { env } from './config/env';
import { logger } from './utils/logger';
import { initTelegramBot } from './bot/telegramBot';
import { startServer } from './server';

const bootstrap = async () => {
    try {
        logger.info('Starting Application...');

        // 1. Initialize Telegram Bot Instance 
        const bot = initTelegramBot();

        // 2. Start Express Webhook Server passing bot instance
        startServer(bot);

        // Graceful shutdown - handle both SIGINT (Ctrl+C) and SIGTERM (Render shutdown)
        const shutdown = () => {
            logger.info('Shutting down server gracefully...');
            process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
};

bootstrap();

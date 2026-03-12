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

        // Graceful shutdown
        process.on('SIGINT', () => {
            logger.info('Shutting down server gracefully...');
            process.exit(0);
        });

    } catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
};

bootstrap();

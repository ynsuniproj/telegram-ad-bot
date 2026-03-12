import express from 'express';
import { env } from './config/env';
import { logger } from './utils/logger';
import { handleTelegramWebhook } from './api/routes/telegramWebhook';

export const startServer = (botInstance: any) => {
    const app = express();

    // 1. Configure JSON parsing safely with a higher limit if images send metadata payload
    // However, telegram file payload isn't inside JSON, so 5mb is plenty safe.
    app.use(express.json({ limit: '5mb' }));

    // 2. Simple Health Check Endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    // 3. Webhook Endpoint Registration
    app.post('/webhook/telegram', (req, res) => handleTelegramWebhook(req, res, botInstance));

    // Use process.env.PORT directly to ensure Render's injected port is used
    const port = parseInt(process.env.PORT || '3000', 10);
    app.listen(port, () => {
        logger.info(`Server listening on port ${port}`);
        logger.info(`Webhook target: ${env.PUBLIC_BASE_URL}/webhook/telegram`);
    });
};

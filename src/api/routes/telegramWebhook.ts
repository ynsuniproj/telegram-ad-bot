import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { handleIncomingMessage } from '../../bot/telegramHandlers';
import TelegramBot from 'node-telegram-bot-api';

// 1. Webhook Rate Limiter (Protects against bursts of traffic to the endpoint)
export const webhookLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 requests per windowMs
    message: 'Too many requests from this IP, please try again after a minute',
    standardHeaders: true,
    legacyHeaders: false,
});

// 2. Webhook Handler
export const handleTelegramWebhook = async (req: Request, res: Response, bot: TelegramBot) => {
    // A. Security Check: Validate Secret Token Header
    const secretToken = req.headers['x-telegram-bot-api-secret-token'];
    if (secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
        logger.warn('Unauthorized webhook request: Missing or invalid secret token');
        return res.status(403).send('Unauthorized');
    }

    // Telegram updates wrapping "message", "edited_message", etc.
    const update = req.body;
    if (!update || (!update.message && !update.edited_message)) {
        // Respond 200 immediately to gracefully ignore updates we don't care about (e.g., chat_member)
        return res.status(200).send('OK');
    }

    const msg = update.message || update.edited_message;

    // Log message metadata
    logger.info(`Incoming Webhook Message. UserID: ${msg.from?.id}, Type: ${msg.photo ? 'photo' : msg.text ? 'text' : 'other'} `);

    // Return HTTP 200 OK immediately so Telegram doesn't retry
    res.status(200).send('OK');

    // Asynchronously route the message to our existing telegram domain logic handler
    try {
        await handleIncomingMessage(bot, msg);
    } catch (error) {
        logger.error('Error handling webhooks message inside bot logic', error);
    }
};

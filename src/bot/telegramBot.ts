import TelegramBot from 'node-telegram-bot-api';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { handleIncomingMessage } from './telegramHandlers';

export const initTelegramBot = (): TelegramBot => {
    // Webhook mode: polling disabled
    const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: false });

    logger.info('Telegram Bot wrapper initialized (Polling disabled, relying on Webhooks).');

    return bot;
};

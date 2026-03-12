import TelegramBot from 'node-telegram-bot-api';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { downloadTelegramFile } from './telegramDownloader';

/**
 * Handles incoming Telegram messages with strict validation.
 */
export const handleIncomingMessage = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    // 1. Validate Sender
    if (!userId || userId !== env.TELEGRAM_ALLOWED_USER_ID) {
        logger.warn(`Unauthorized access attempt from user ID: ${userId}`);
        return; // Ignore silently
    }

    logger.info(`Received authorized message from user ID: ${userId}`);

    try {
        // 2. Handle Image + Caption OR Image without Caption
        if (msg.photo && msg.photo.length > 0) {
            // Get highest resolution photo (last element in the array)
            const bestPhoto = msg.photo[msg.photo.length - 1];
            const fileId = bestPhoto.file_id;
            const caption = msg.caption || '';

            const processingMsg = await bot.sendMessage(chatId, "Downloading image...");

            logger.info(`Extracting file_id: ${fileId}, caption: "${caption}"`);

            // Download and save
            const savedFilePath = await downloadTelegramFile(fileId);
            logger.info(`Image processing step complete. Saved path: ${savedFilePath}`);

            // Reply with confirmation
            let confirmationText = `✅ Image received successfully.\nSaved to: ${savedFilePath}`;
            if (caption) {
                confirmationText += `\nCaption: "${caption}"`;
            } else {
                confirmationText += `\n(No caption provided)`;
            }

            await bot.editMessageText(confirmationText, {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });

            return;
        }

        // 3. Handle Text Only
        if (msg.text) {
            logger.info(`Received text message: "${msg.text}"`);
            await bot.sendMessage(chatId, `Text received.\nPlease send an image with a caption to generate an advertisement.`);
            return;
        }

        // 4. Handle Invalid Messages
        logger.info(`Received unsupported message type from ${userId}`);
        await bot.sendMessage(chatId, "Invalid message format. Please send an image (optionally with a text caption) or a text message.");

    } catch (error) {
        logger.error('Error handling telegram message', error);
        await bot.sendMessage(chatId, 'An error occurred while processing your message. Please try again later.');
    }
};

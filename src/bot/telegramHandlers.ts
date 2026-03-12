import TelegramBot from 'node-telegram-bot-api';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { downloadTelegramFile } from './telegramDownloader';
import { executeAdPipeline } from '../services/adPipeline';

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

            // 1. Download and save Locally
            const savedImagePath = await downloadTelegramFile(fileId);
            logger.info(`Image processing step complete. Saved path: ${savedImagePath}`);

            await bot.editMessageText("Analyzing visual style and drafting AI prompt...", {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });

            // 2. Trigger the AI Generation Pipeline
            try {
                const generatedImagePath = await executeAdPipeline(savedImagePath, caption, fileId);

                // 3. Return the generated Image
                await bot.sendPhoto(chatId, generatedImagePath, {
                    caption: `✅ Ad Background Generated successfully!`
                });

                // Cleanup the status message
                await bot.deleteMessage(chatId, processingMsg.message_id);

            } catch (pipelineError: any) {
                logger.error('Pipeline Error:', pipelineError);
                await bot.editMessageText(`❌ Failed to process the image: ${pipelineError.message || 'Unknown error'}`, {
                    chat_id: chatId,
                    message_id: processingMsg.message_id
                });
            }

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

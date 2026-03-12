import TelegramBot from 'node-telegram-bot-api';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { downloadTelegramFile } from './telegramDownloader';
import { executeAdPipeline } from '../services/adPipeline';
import { setSession, getSession, clearSession } from './sessionStore';
import { analyzeDesignStyle } from '../vision/designStyleAnalyzer';

/**
 * Two-step conversation handler.
 * Step 1: User sends competitor image → system analyzes and waits for caption.
 * Step 2: User sends caption + product description → system generates final ad.
 */
export const handleIncomingMessage = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    // Validate sender
    if (!userId || userId !== env.TELEGRAM_ALLOWED_USER_ID) {
        logger.warn(`Unauthorized access attempt from user ID: ${userId}`);
        return;
    }

    logger.info(`Authorized message from user ID: ${userId}, type: ${msg.photo ? 'photo' : 'text'}`);

    try {

        // ─── STEP 1: User sends image ───────────────────────────────────
        if (msg.photo && msg.photo.length > 0) {
            const bestPhoto = msg.photo[msg.photo.length - 1];
            const fileId = bestPhoto.file_id;

            const statusMsg = await bot.sendMessage(chatId,
                '🔍 جاري تحليل صورة الإعلان...\n_Analyzing competitor ad design..._',
                { parse_mode: 'Markdown' }
            );

            // Download image
            const imagePath = await downloadTelegramFile(fileId);
            logger.info(`Competitor image saved: ${imagePath}`);

            // Run design style analysis immediately
            await bot.editMessageText('🎨 جاري استخراج أسلوب التصميم...', {
                chat_id: chatId,
                message_id: statusMsg.message_id,
                parse_mode: 'Markdown'
            });

            const designStyle = await analyzeDesignStyle(imagePath);

            // Save session
            setSession(userId, {
                competitorImagePath: imagePath,
                competitorFileId: fileId,
                designStyle,
                createdAt: Date.now()
            });

            // Ask user for caption and product description
            await bot.editMessageText(
                '✅ *تم تحليل التصميم بنجاح!*\n\n' +
                '📝 الآن أرسل لي:\n' +
                '• *وصف منتجك* (مثال: كريم ترطيب فاخر للبشرة)\n' +
                '• *عنوان أو نص الإعلان* (مثال: جمالك يبدأ هنا)\n\n' +
                '_أرسلهما في رسالة واحدة مفصولة بسطر جديد_',
                {
                    chat_id: chatId,
                    message_id: statusMsg.message_id,
                    parse_mode: 'Markdown'
                }
            );

            return;
        }

        // ─── STEP 2: User sends caption + product description ──────────
        if (msg.text) {
            const session = getSession(userId);

            if (!session) {
                // No active session — guide the user
                await bot.sendMessage(chatId,
                    '📸 ابدأ بإرسال صورة إعلان المنافس أولاً.\n_Please send the competitor ad image first._',
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            // Handle /reset command
            if (msg.text.trim().toLowerCase() === '/reset') {
                clearSession(userId);
                await bot.sendMessage(chatId, '🔄 تم إعادة التشغيل. أرسل صورة إعلان المنافس للبدء.');
                return;
            }

            const lines = msg.text.trim().split('\n');
            const productDescription = lines[0]?.trim() || '';
            const captionText = lines.slice(1).join(' ').trim() || productDescription;

            if (!productDescription) {
                await bot.sendMessage(chatId, '⚠️ يرجى إرسال وصف المنتج والعنوان في رسالة واحدة.');
                return;
            }

            const fullCaption = `${productDescription}\n${captionText}`.trim();

            const genMsg = await bot.sendMessage(chatId,
                '⚙️ *جاري توليد إعلانك الاحترافي...*\n\n' +
                '1️⃣ تحليل أسلوب المنافس ✅\n' +
                '2️⃣ تحليل وصفك الإبداعي ⏳\n' +
                '3️⃣ توليد الصورة بـ FLUX ⏳\n' +
                '4️⃣ رسم النصوص العربية ⏳',
                { parse_mode: 'Markdown' }
            );

            try {
                const finalAdPath = await executeAdPipeline(
                    session.competitorImagePath,
                    fullCaption,
                    session.competitorFileId,
                    session.designStyle
                );

                await bot.sendPhoto(chatId, finalAdPath, {
                    caption: '✅ *إعلانك الاحترافي جاهز!*',
                    parse_mode: 'Markdown'
                });

                await bot.deleteMessage(chatId, genMsg.message_id);
                clearSession(userId);

            } catch (pipelineError: any) {
                logger.error('Pipeline Error:', pipelineError);
                await bot.editMessageText(
                    `❌ فشل توليد الإعلان:\n${pipelineError.message || 'خطأ غير معروف'}`,
                    { chat_id: chatId, message_id: genMsg.message_id }
                );
            }

            return;
        }

        // Unsupported message type
        await bot.sendMessage(chatId, '📸 أرسل صورة إعلان المنافس للبدء.');

    } catch (error) {
        logger.error('Handler Error:', error);
        await bot.sendMessage(chatId, '❌ حدث خطأ. حاول مجدداً.');
    }
};

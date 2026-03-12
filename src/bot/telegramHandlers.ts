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

    if (!userId || userId !== env.TELEGRAM_ALLOWED_USER_ID) return;

    try {
        const session = getSession(userId);

        // ─── STEP 1: Competitor Image Upload ───────────────────────────
        if (msg.photo && (!session || session.step === 'AWAITING_IMAGE')) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const statusMsg = await bot.sendMessage(chatId, '🔍 *تحليل تصميم المنافس...*\n_Analyzing competitor design..._', { parse_mode: 'Markdown' });

            const imagePath = await downloadTelegramFile(fileId);
            const designStyle = await analyzeDesignStyle(imagePath);

            setSession(userId, {
                competitorImagePath: imagePath,
                competitorFileId: fileId,
                designStyle,
                createdAt: Date.now(),
                step: 'AWAITING_CONTENT'
            });

            await bot.editMessageText(
                '✅ *تم تحليل التصميم!*\n\n' +
                '📸 الآن، من فضلك أرسل:\n' +
                '1️⃣ *صورة منتجك* (يفضل PNG بخلفية شفافة)\n' +
                '2️⃣ *وصف المنتج وعنوان الإعلان* (في تعليق الصورة)',
                { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'Markdown' }
            );
            return;
        }

        // ─── STEP 2: Product Image + Caption Upload ───────────────────
        if (session && session.step === 'AWAITING_CONTENT') {

            // User sent a photo (product image)
            if (msg.photo) {
                const productFileId = msg.photo[msg.photo.length - 1].file_id;
                const caption = msg.caption || '';

                if (!caption) {
                    await bot.sendMessage(chatId, '⚠️ يرجى إرسال وصف المنتج وعنوان الإعلان في تعليق (Caption) مع الصورة.');
                    return;
                }

                const genMsg = await bot.sendMessage(chatId, '⚙️ *جاري ابتكار إعلانك الاحترافي...*\n\n1️⃣ توليد المشهد (Scene) ⏳\n2️⃣ دمج المنتج الحقيقي ⏳\n3️⃣ تنسيق الكتابة ⏳', { parse_mode: 'Markdown' });

                try {
                    const productPath = await downloadTelegramFile(productFileId);

                    const finalAdPath = await executeAdPipeline(
                        session.competitorImagePath,
                        caption,
                        session.competitorFileId,
                        session.designStyle,
                        productPath // New: Real product image injection
                    );

                    await bot.sendPhoto(chatId, finalAdPath, { caption: '✅ *إعلانك لـ "محترف" جاهز!*', parse_mode: 'Markdown' });
                    await bot.deleteMessage(chatId, genMsg.message_id);
                    clearSession(userId);

                } catch (err: any) {
                    logger.error('Pipeline Error:', err);
                    await bot.editMessageText(`❌ فشل التوليد: ${err.message}`, { chat_id: chatId, message_id: genMsg.message_id });
                }
                return;
            }

            // If user sent text instead of photo in step 2
            if (msg.text && msg.text.trim().toLowerCase() === '/reset') {
                clearSession(userId);
                await bot.sendMessage(chatId, '🔄 تم البدء من جديد. أرسل صورة المنافس.');
                return;
            }

            await bot.sendMessage(chatId, '📸 يرجى إرسال *صورة منتجك* مع الوصف في التعليق.');
            return;
        }

        // Default: Guide user to start
        await bot.sendMessage(chatId, '👋 أهلاً بك! ابدأ بإرسال *صورة إعلان المنافس* التي تريد محاكاتها.');

    } catch (error) {
        logger.error('Handler Error:', error);
    }
};

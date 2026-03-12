import path from 'path';
import { getFileFromTelegram, downloadFileFromTelegram } from '../services/telegramService';
import { saveFileLocally } from '../utils/fileStorage';
import { logger } from '../utils/logger';

/**
 * Orchestrates the downloading of a Telegram file by fileId
 */
export const downloadTelegramFile = async (fileId: string): Promise<string> => {
    try {
        // 1. Request getFile
        const fileInfo = await getFileFromTelegram(fileId);

        // 2. Build the file download URL (happens inside service)
        // 3. Download the file stream
        const fileStream = await downloadFileFromTelegram(fileInfo.file_path);

        // 4. Extract original extension, or default to .jpg
        const ext = path.extname(fileInfo.file_path) || '.jpg';

        // 5. Generate a unique filename
        const fileName = `${fileId}_${Date.now()}${ext}`;

        // 6. Save locally
        const savedPath = await saveFileLocally(fileName, fileStream);
        return savedPath;
    } catch (error) {
        logger.error(`Failed to download and save Telegram file ${fileId}`, error);
        throw error;
    }
};

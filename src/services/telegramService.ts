import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;
const TELEGRAM_FILE_BASE = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}`;

/**
 * Gets file information from Telegram API
 */
export const getFileFromTelegram = async (fileId: string): Promise<{ file_path: string }> => {
    try {
        const response = await axios.get(`${TELEGRAM_API_BASE}/getFile`, {
            params: { file_id: fileId }
        });

        if (response.data.ok) {
            return response.data.result;
        }
        throw new Error('Telegram API responded with not ok');
    } catch (error: any) {
        logger.error(`Error requesting getFile from Telegram for file_id ${fileId}`, error.message);
        throw error;
    }
};

/**
 * Downloads the actual file from Telegram
 */
export const downloadFileFromTelegram = async (filePath: string): Promise<NodeJS.ReadableStream> => {
    try {
        const fileUrl = `${TELEGRAM_FILE_BASE}/${filePath}`;
        const response = await axios.get(fileUrl, { responseType: 'stream' });
        return response.data;
    } catch (error: any) {
        logger.error(`Error downloading file from Telegram at ${filePath}`, error.message);
        throw error;
    }
};

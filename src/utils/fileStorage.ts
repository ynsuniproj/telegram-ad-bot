import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const UPLOAD_DIR = path.resolve(process.cwd(), 'tmp/uploads');

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Saves a buffer or readable stream to the local filesystem.
 */
export const saveFileLocally = async (fileName: string, data: NodeJS.ReadableStream | Buffer): Promise<string> => {
    const filePath = path.join(UPLOAD_DIR, fileName);

    return new Promise((resolve, reject) => {
        if (Buffer.isBuffer(data)) {
            fs.writeFile(filePath, data, (err) => {
                if (err) {
                    logger.error(`Failed to save file: ${filePath}`, err);
                    return reject(err);
                }
                logger.info(`File saved successfully: ${filePath}`);
                resolve(filePath);
            });
        } else {
            const writeStream = fs.createWriteStream(filePath);
            data.pipe(writeStream);

            writeStream.on('finish', () => {
                logger.info(`File saved successfully: ${filePath}`);
                resolve(filePath);
            });

            writeStream.on('error', (err) => {
                logger.error(`Failed to save file stream: ${filePath}`, err);
                reject(err);
            });
        }
    });
};

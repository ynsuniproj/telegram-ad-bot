import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const generateFluxImage = async (prompt: string, jobId: string): Promise<string> => {
    logger.info(`Sending generation request to FLUX API for job ${jobId}...`);

    try {
        const response = await axios.post(`${env.FLUX_MICROSERVICE_URL}/generate`, {
            prompt: prompt,
            width: 1024,
            height: 1024
        });

        const data = response.data;
        if (!data.success || !data.image) {
            throw new Error(`FLUX API returned an invalid response: ${JSON.stringify(data)}`);
        }

        // 1. Ensure temp storage directory exists
        const outputDir = path.resolve(process.cwd(), 'tmp', 'generated');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 2. Decode base64 to binary and write to file
        const base64Data = data.image.replace(/^data:image\/\w+;base64,/, "");
        const binaryBuffer = Buffer.from(base64Data, 'base64');

        const filename = `generated_${jobId}_${Date.now()}.png`;
        const filePath = path.join(outputDir, filename);

        fs.writeFileSync(filePath, binaryBuffer);

        logger.info(`Generative FLUX Image successfully saved at: ${filePath}`);

        return filePath;

    } catch (error: any) {
        logger.error('Failed to generate image via FLUX Microservice', error.response?.data || error.message);
        throw error;
    }
};

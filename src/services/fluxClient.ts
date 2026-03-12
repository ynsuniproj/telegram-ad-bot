import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ImageGenerationResult } from '../core/types';

export const requestImageGeneration = async (prompt: string): Promise<ImageGenerationResult> => {
    logger.info(`Sending generation request to FLUX at ${env.FLUX_MICROSERVICE_URL}`);

    try {
        // Scaffold implementation
        // const response = await axios.post(`${env.FLUX_MICROSERVICE_URL}/generate`, { prompt });
        // const baseImageBuffer = Buffer.from(response.data.image, 'base64');

        // RETURN DUMMY RESULT FOR SCAFFOLD
        return {
            baseImageBuffer: Buffer.from([]),
            success: true
        };
    } catch (error: any) {
        logger.error('Failed to generate image via FLUX', error);
        return {
            baseImageBuffer: Buffer.from([]),
            success: false,
            error: error.message
        };
    }
};

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

// Hugging Face Inference API for FLUX.1-schnell
const HF_API_URL = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell';
const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;

export const generateFluxImage = async (prompt: string, jobId: string): Promise<string> => {
    logger.info(`Sending generation request to Hugging Face FLUX for job ${jobId}...`);

    if (!HF_TOKEN) {
        throw new Error('HUGGING_FACE_TOKEN is not set in environment variables');
    }

    try {
        const response = await axios.post(
            HF_API_URL,
            { inputs: prompt },
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'image/png'
                },
                responseType: 'arraybuffer',
                timeout: 120000 // 2 minutes — model may need to warm up
            }
        );

        // Ensure temp directory exists
        const outputDir = path.resolve(process.cwd(), 'tmp', 'generated');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write binary image data to file
        const filename = `generated_${jobId}_${Date.now()}.png`;
        const filePath = path.join(outputDir, filename);

        fs.writeFileSync(filePath, response.data);

        logger.info(`FLUX Image saved successfully at: ${filePath}`);

        return filePath;

    } catch (error: any) {
        if (error.response?.status === 503) {
            throw new Error('FLUX model is loading, please retry in 20-30 seconds.');
        }
        const errMsg = error.response?.data
            ? Buffer.from(error.response.data).toString('utf8')
            : error.message;
        logger.error('Failed to generate image via Hugging Face API:', errMsg);
        throw new Error(`Image generation failed: ${errMsg}`);
    }
};

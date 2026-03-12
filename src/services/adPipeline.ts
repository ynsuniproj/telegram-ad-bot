import { analyzeCompetitorImage } from '../vision/imageAnalyzer';
import { composeFluxPrompt } from '../ai/promptComposer';
import { generateFluxImage } from './imageGenerationService';
import { logger } from '../utils/logger';

export const executeAdPipeline = async (competitorImagePath: string, userCaption: string, jobId: string): Promise<string> => {
    logger.info(`[AdPipeline] Starting background job ${jobId}`);

    try {
        // Step 1: Vision Extraction
        logger.info(`[AdPipeline][1/3] Extracting styles from ${competitorImagePath}...`);
        const visualStyle = await analyzeCompetitorImage(competitorImagePath);

        // Step 2: Assemble English Text Prompt
        logger.info(`[AdPipeline][2/3] Composing High-Quality FLUX Prompt...`);
        const prompt = await composeFluxPrompt(userCaption, visualStyle);

        // Step 3: Trigger Python Microservice (FLUX.1-schnell)
        logger.info(`[AdPipeline][3/3] Sending Prompt to Generator...`);
        const generatedFilePath = await generateFluxImage(prompt, jobId);

        logger.info(`[AdPipeline] Job ${jobId} Completed Successfully.`);
        return generatedFilePath;

    } catch (error) {
        logger.error(`[AdPipeline] Job ${jobId} Failed!`, error);
        throw error; // Let the caller (telegram handler) deal with notifying the user
    }
};

import { analyzeCompetitorImage } from '../vision/imageAnalyzer';
import { composeFluxPrompt } from '../ai/promptComposer';
import { analyzeCaptionSemantics } from '../ai/captionAnalyzer';
import { enhancePromptWithScene } from '../ai/sceneEnhancer';
import { generateFluxImage } from './imageGenerationService';
import { generateAdLayout } from '../rendering/layoutEngine';
import { renderTypography } from '../rendering/textRenderer';
import { logger } from '../utils/logger';
import * as path from 'path';

export const executeAdPipeline = async (
    competitorImagePath: string,
    userCaption: string,
    jobId: string
): Promise<string> => {
    logger.info(`[AdPipeline] Starting job ${jobId}`);

    // Step 1: Analyze the competitor image visual style
    logger.info(`[AdPipeline][1/6] Extracting visual style from image...`);
    const visualStyle = await analyzeCompetitorImage(competitorImagePath);

    // Step 2: Analyze the user caption for semantic context
    logger.info(`[AdPipeline][2/6] Analyzing caption semantics...`);
    const semantics = await analyzeCaptionSemantics(userCaption);

    // Step 3: Compose the base FLUX prompt using visual style + caption
    logger.info(`[AdPipeline][3/6] Composing FLUX prompt...`);
    const basePrompt = await composeFluxPrompt(userCaption, visualStyle);

    // Step 4: Enhance prompt with scene details based on mood
    logger.info(`[AdPipeline][4/6] Enhancing prompt with scene realism details...`);
    const enhancedPrompt = enhancePromptWithScene(basePrompt, semantics);

    // Step 5: Generate background image via Hugging Face FLUX API
    logger.info(`[AdPipeline][5/6] Generating background image...`);
    const generatedImagePath = await generateFluxImage(enhancedPrompt, jobId);

    // Step 6: Generate Arabic text layout + Render typography on image
    logger.info(`[AdPipeline][6/6] Rendering Arabic typography...`);
    const adLayout = await generateAdLayout(userCaption, semantics);

    const finalOutputPath = path.resolve(
        process.cwd(), 'tmp', 'final', `ad_final_${jobId}_${Date.now()}.png`
    );
    const finalImagePath = await renderTypography(generatedImagePath, adLayout, finalOutputPath);

    logger.info(`[AdPipeline] Job ${jobId} completed. Final ad: ${finalImagePath}`);
    return finalImagePath;
};

import { analyzeCompetitorImage } from '../vision/imageAnalyzer';
import { analyzeDesignStyle, DesignStyle } from '../vision/designStyleAnalyzer';
import { composeFluxPrompt } from '../ai/promptComposer';
import { analyzeCaptionSemantics } from '../ai/captionAnalyzer';
import { enhancePromptWithScene } from '../ai/sceneEnhancer';
import { generateFluxImage } from './imageGenerationService';
import { generateAdLayout } from '../rendering/layoutEngine';
import { renderTypography } from '../rendering/textRenderer';
import { injectProductIntoScene } from '../rendering/productRenderer';
import { validateAdOutput } from '../ai/adValidator';
import { logger } from '../utils/logger';
import * as path from 'path';

export const executeAdPipeline = async (
    competitorImagePath: string,
    userCaption: string,
    jobId: string,
    designStyleParam: DesignStyle | null,
    productImagePath: string // Mandatory real product image
): Promise<string> => {
    logger.info(`[AdPipeline] Starting Professional Hybrid Pipeline for job ${jobId}`);

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        attempts++;
        logger.info(`[AdPipeline] Attempt ${attempts}/${maxAttempts}`);

        // Step 1: Visual and Design Analysis
        logger.info(`[AdPipeline] Stage 0: Initial Analysis...`);
        const visualStyle = await analyzeCompetitorImage(competitorImagePath);
        const designStyle = designStyleParam ?? await analyzeDesignStyle(competitorImagePath);
        const semantics = await analyzeCaptionSemantics(userCaption);

        // Step 2: Scene Generation (Strictly No Text)
        logger.info(`[AdPipeline] Stage 1: Scene Generation...`);
        const basePrompt = await composeFluxPrompt(userCaption, visualStyle);
        const enhancedPrompt = enhancePromptWithScene(basePrompt, semantics);
        const scenePath = await generateFluxImage(enhancedPrompt, jobId);

        // Step 3: Product Injection
        logger.info(`[AdPipeline] Stage 2: Product Injection...`);
        const injectedPath = path.resolve(process.cwd(), 'tmp', 'injected', `injected_${jobId}_${Date.now()}.png`);
        await injectProductIntoScene({
            backgroundPath: scenePath,
            productPath: productImagePath,
            outputPath: injectedPath,
            designStyle
        });

        // Step 4: Typography Rendering
        logger.info(`[AdPipeline] Stage 3: Typography Layout...`);
        const adLayout = await generateAdLayout(userCaption, semantics);
        const finalPath = path.resolve(process.cwd(), 'tmp', 'final', `ad_final_${jobId}_${Date.now()}.png`);
        await renderTypography(injectedPath, adLayout, finalPath, designStyle);

        // Step 5: Quality Validation
        logger.info(`[AdPipeline] Stage 4: Quality Validation...`);
        const validation = await validateAdOutput(finalPath);

        if (validation.isValid) {
            logger.info(`[AdPipeline] Job ${jobId} completed successfully.`);
            return finalPath;
        }

        logger.warn(`[AdPipeline] Validation failed on attempt ${attempts}: ${validation.reason}`);
        if (attempts === maxAttempts) {
            logger.info(`[AdPipeline] Max attempts reached, returning best effort.`);
            return finalPath;
        }
    }

    throw new Error('Pipeline failed after maximum retry attempts.');
};

// Compose prompt that includes product placement based on subject orientation
async function composeFluxPromptWithPlacement(
    caption: string,
    visualStyle: import('../vision/imageAnalyzer').VisualStyle,
    designStyle: DesignStyle
): Promise<string> {
    const { composeFluxPrompt } = await import('../ai/promptComposer');
    const basePrompt = await composeFluxPrompt(caption, visualStyle);

    // Determine product placement based on subject orientation
    let productPlacement = '';
    if (designStyle.subject_orientation === 'facing left') {
        productPlacement = 'the product is placed prominently on the right side of the frame';
    } else if (designStyle.subject_orientation === 'facing right') {
        productPlacement = 'the product is placed prominently on the left side of the frame';
    } else {
        productPlacement = 'the product is centered and featured prominently';
    }

    const lightingNote = `lighting coming ${designStyle.lighting_direction} consistent with the scene`;

    return `${basePrompt}. ${productPlacement}. ${lightingNote}. Match the camera perspective: ${visualStyle.camera}.`;
}

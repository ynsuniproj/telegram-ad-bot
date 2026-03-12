import { analyzeCompetitorImage } from '../vision/imageAnalyzer';
import { analyzeDesignStyle, DesignStyle } from '../vision/designStyleAnalyzer';
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
    jobId: string,
    // Accept pre-analyzed design style from session (Step 1 already ran it)
    preAnalyzedDesignStyle?: DesignStyle | null
): Promise<string> => {
    logger.info(`[AdPipeline] Starting job ${jobId}`);

    // Step 1: Visual style (for prompt generation)
    logger.info(`[AdPipeline][1/6] Extracting visual style...`);
    const visualStyle = await analyzeCompetitorImage(competitorImagePath);

    // Step 1b: Design style (either from session or re-run)
    logger.info(`[AdPipeline][1b/6] Obtaining design style...`);
    const designStyle = preAnalyzedDesignStyle ?? await analyzeDesignStyle(competitorImagePath);

    // Step 2: Analyze caption semantics
    logger.info(`[AdPipeline][2/6] Analyzing caption semantics...`);
    const semantics = await analyzeCaptionSemantics(userCaption);

    // Step 3: Compose base FLUX prompt with product placement intelligence
    logger.info(`[AdPipeline][3/6] Composing FLUX prompt with product placement...`);
    const basePrompt = await composeFluxPromptWithPlacement(userCaption, visualStyle, designStyle);

    // Step 4: Enhance with scene realism
    logger.info(`[AdPipeline][4/6] Scene enhancement...`);
    const enhancedPrompt = enhancePromptWithScene(basePrompt, semantics);

    // Step 5: Generate background image
    logger.info(`[AdPipeline][5/6] Generating image via FLUX...`);
    const generatedImagePath = await generateFluxImage(enhancedPrompt, jobId);

    // Step 6: Generate Arabic ad layout + render typography using competitor's design style
    logger.info(`[AdPipeline][6/6] Rendering Arabic typography with competitor layout style...`);
    const adLayout = await generateAdLayout(userCaption, semantics);

    const finalOutputPath = path.resolve(
        process.cwd(), 'tmp', 'final', `ad_final_${jobId}_${Date.now()}.png`
    );

    const finalImagePath = await renderTypography(
        generatedImagePath,
        adLayout,
        finalOutputPath,
        designStyle // Pass design style to replicate competitor typography positions/effects
    );

    logger.info(`[AdPipeline] Job ${jobId} completed. Final: ${finalImagePath}`);
    return finalImagePath;
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

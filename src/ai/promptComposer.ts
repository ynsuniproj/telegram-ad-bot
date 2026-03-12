import { groqClient } from '../services/groqClient';
import { logger } from '../utils/logger';
import { VisualStyle } from '../vision/imageAnalyzer';
import { CaptionSemantics } from './captionAnalyzer';

export const composeFluxPrompt = async (
    caption: string,
    visualStyle: VisualStyle,
    semantics: CaptionSemantics
): Promise<string> => {
    logger.info(`Composing FLUX prompt for category: ${semantics.productCategory}`);

    let categoryContext = '';

    if (!semantics.requiresLifestyle) {
        // Product-centered studio shot logic
        const categorySpecifics: Record<string, string> = {
            beverage: 'dynamic liquid splashes, water droplets on surface, high-speed photography, fresh and cold atmosphere',
            gadget: 'tech environment with circuit board patterns, neon glow lighting, sleek metallic reflections, futuristic composition',
            luxury: 'minimalist background, expensive textures like marble or silk, soft elegant studio lighting, subtle bokeh',
            cosmetic: 'clean reflections, soft pastel aesthetic, high-end beauty photography lighting, macro details',
            accessory: 'high-contrast lighting, sharp focus on textures, elegant presentation'
        };

        const specifics = categorySpecifics[semantics.productCategory] || 'professional studio product photography, clean background';
        categoryContext = `STUDIO PRODUCT SHOT: No humans. The focus is exclusively on the product environment. ${specifics}. The product (which will be injected later) should occupy the central third of the frame.`;
    } else {
        // Lifestyle logic (if strictly required)
        categoryContext = `LIFESTYLE AD: Professional human subject in a ${semantics.environment} setting. The subject should have a ${semantics.emotion} expression. cinematic lighting.`;
    }

    const promptInstruction = `
    You are an expert Prompt Engineer for the FLUX model.
    Generate a detailed English prompt for a cinematic background scene for a commercial advertisement.

    CONTEXT:
    - User Message: "${caption}"
    - Visual Style: ${visualStyle.composition}, ${visualStyle.lighting}, ${visualStyle.colors}
    - Scene Goal: ${categoryContext}

    CRITICAL RULES:
    1. ABSOLUTE RULE: NO TEXT, NO LETTERS, NO LOGOS, NO CAPTIONS, NO TYPOGRAPHY inside the image.
    2. RESERVED SPACE: Ensure the central or side-third area (based on rule-of-thirds) is clean and ready for the product to be injected.
    3. RESOLUTION: 8k resolution, ultra-sharp textures, commercial photography quality.
    4. NO RANDOM PEOPLE: Unless the Scene Goal explicitly mentions a human subject, do NOT include any people in the shot.

    Return ONLY the prompt string.
    `;

    try {
        const response = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: promptInstruction }],
            temperature: 0.7,
            max_tokens: 800
        });

        const generatedPrompt = response.choices[0]?.message?.content?.trim() || "";
        logger.info(`Generated FLUX Prompt: ${generatedPrompt}`);
        return generatedPrompt;

    } catch (error) {
        logger.error('Failed to compose prompt with Groq Text LLM', error);
        throw error;
    }
};

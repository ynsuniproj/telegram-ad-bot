import { groqClient } from '../services/groqClient';
import { logger } from '../utils/logger';
import { VisualStyle } from '../vision/imageAnalyzer';

export const composeFluxPrompt = async (caption: string, visualStyle: VisualStyle): Promise<string> => {
    logger.info('Composing English prompt for FLUX using LLM...');

    const promptInstruction = `
    You are an expert Prompt Engineer for the FLUX image generation model.
    A user wants to create a new promotional advertisement based on a specific visual style and marketing message.

    User's Marketing Caption: "${caption}"

    Competitor's Visual Style:
    - Composition: ${visualStyle.composition}
    - Lighting: ${visualStyle.lighting}
    - Colors: ${visualStyle.colors}
    - Background: ${visualStyle.background}
    - Camera: ${visualStyle.camera}
    - Layout: ${visualStyle.layout}

    Write a single, highly detailed English prompt to generate the cinematic background image for this advertisement.
    
    CRITICAL RULES:
    1. Focus EXCLUSIVELY on the environment, scene, and lighting.
    2. ABSOLUTE RULE: NO TEXT, NO LETTERS, NO LOGOS, NO TYPOGRAPHY, NO CAPTIONS inside the image.
    3. The image must be a CLEAN BACKGROUND with empty space reserved for graphic overlays.
    4. Composition: ${visualStyle.composition}. Match the mood of "${caption}".
    5. Photorealistic 8k resolution, cinematic lighting, professional studio aesthetics.
    
    Return ONLY the raw prompt string. No conversational filler.
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

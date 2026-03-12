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

    Write a single, highly detailed English prompt to generate the background image for this advertisement.
    
    CRITICAL RULES:
    1. Combine the essence of the marketing caption with the specific visual style provided.
    2. Explicitly instruct the generator to leave a clean, empty space area (Negative Space) for overlaying text later.
    3. Do NOT generate any text, words, or typography inside the image itself. The result must be a text-free background graphic.
    4. Focus on professional product photography, 8k resolution, cinematic lighting, and advertising aesthetics.
    
    Return ONLY the raw prompt string. No conversational filler, no explanations.
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

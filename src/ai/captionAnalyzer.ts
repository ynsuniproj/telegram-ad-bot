import { groqClient } from '../services/groqClient';
import { logger } from '../utils/logger';

export interface CaptionSemantics {
    mood: string;         // intense, luxury, sport, energy, calm, elegant, etc.
    environment: string;  // training, outdoor, studio, urban, nature, etc.
    emotion: string;      // focus, excitement, peace, confidence, power, etc.
    style: string;        // cinematic, editorial, lifestyle, minimalistic, etc.
    productCategory: string; // apparel, supplements, beauty, tech, food, etc.
}

export const analyzeCaptionSemantics = async (caption: string): Promise<CaptionSemantics> => {
    logger.info(`Analyzing caption semantics: "${caption}"`);

    const prompt = `
    You are a creative director and advertising strategist. 
    Analyze the following marketing caption and extract its semantic advertising context.
    
    Caption: "${caption}"
    
    Return ONLY a strict JSON object with these exact keys:
    "mood", "environment", "emotion", "style", "productCategory"
    
    - mood: the dominant mood (e.g. intense, luxury, energetic, calm, playful, bold)
    - environment: the implied scene context (e.g. training, outdoor, office, home, studio)
    - emotion: the emotional tone you want to evoke (e.g. focus, confidence, joy, power)
    - style: the visual advertising style (e.g. cinematic, editorial, lifestyle, minimalistic)
    - productCategory: inferred product type (e.g. sportswear, cosmetics, food, electronics)
    
    Do not wrap in markdown. Return raw JSON only.
    `;

    try {
        const response = await groqClient.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 200
        });

        const content = response.choices[0]?.message?.content?.trim() || '{}';
        const semantics = JSON.parse(content) as CaptionSemantics;
        logger.info(`Caption Semantics: ${JSON.stringify(semantics)}`);
        return semantics;

    } catch (error) {
        logger.warn('Caption semantic analysis failed, using defaults', error);
        // Return safe defaults so the pipeline continues even if this step fails
        return {
            mood: 'professional',
            environment: 'studio',
            emotion: 'confidence',
            style: 'cinematic advertising',
            productCategory: 'lifestyle'
        };
    }
};

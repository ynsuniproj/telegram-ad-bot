import { groqClient } from '../services/groqClient';
import { logger } from '../utils/logger';

export interface CaptionSemantics {
    mood: string;         // intense, luxury, sport, energy, calm, elegant, etc.
    environment: string;  // training, outdoor, studio, urban, nature, etc.
    emotion: string;      // focus, excitement, peace, confidence, power, etc.
    style: string;        // cinematic, editorial, lifestyle, minimalistic, etc.
    productCategory: 'beverage' | 'gadget' | 'luxury' | 'cosmetic' | 'accessory' | 'lifestyle' | 'other';
    requiresLifestyle: boolean; // True if a human subject is necessary for context
}

export const analyzeCaptionSemantics = async (caption: string): Promise<CaptionSemantics> => {
    logger.info(`Analyzing caption semantics: "${caption}"`);

    const prompt = `
    You are a creative director and advertising strategist. 
    Analyze the following marketing caption and extract its semantic advertising context.
    
    Caption: "${caption}"
    
    Extract the following semantic context and return ONLY a strict JSON object:
    {
      "mood": "string",
      "environment": "string",
      "emotion": "string",
      "style": "string",
      "productCategory": "beverage | gadget | luxury | cosmetic | accessory | lifestyle | other",
      "requiresLifestyle": boolean
    }
    
    - productCategory: classify the product being described.
    - requiresLifestyle: true ONLY if the product is apparel, wearable, or explicitly needs a person in context (e.g. skin care application). If it's a bottle, gadget, or accessory, set to false for a studio product shot.
    `;

    try {
        const response = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 300
        });

        const content = response.choices[0]?.message?.content?.trim() || "{}";
        const semantics = JSON.parse(content) as CaptionSemantics;
        logger.info(`Analyzed Semantics: ${JSON.stringify(semantics)}`);
        return semantics;

    } catch (error) {
        logger.warn('Caption analysis failed, using lifestyle defaults', error);
        return {
            mood: "bold",
            environment: "studio",
            emotion: "confidence",
            style: "cinematic",
            productCategory: "lifestyle",
            requiresLifestyle: true
        };
    }
};

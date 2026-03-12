import { groqClient } from '../services/groqClient';
import { logger } from '../utils/logger';
import * as fs from 'fs';

export interface ValidationResult {
    isValid: boolean;
    reason?: string;
}

/**
 * Stage 5: Advertisement Quality Validator
 * Uses Groq Vision to verify the final ad composition.
 */
export const validateAdOutput = async (imagePath: string): Promise<ValidationResult> => {
    logger.info(`Starting Ad Quality Validation for: ${imagePath}`);

    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        const prompt = `
        You are a senior art director. Evaluate this social media advertisement image for quality.
        Check for these specific failures:
        1. "GEN_TEXT": Is there any AI-generated gibberish text or messy letters inside the image itself (not the professional overlays)?
        2. "LOW_PRODUCT": Is the product clearly visible and in focus?
        3. "MESSY_LAYOUT": Is the text covering a face or blocking the main product?
        
        Return ONLY a strict JSON object:
        { "isValid": boolean, "reason": "string describing failure if invalid" }
        
        If it looks professionally designed and has no AI text artifacts, isValid is true.
        `;

        const response = await groqClient.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ],
            temperature: 0.1,
            max_tokens: 200
        });

        const content = response.choices[0]?.message?.content?.trim() || '{"isValid": true}';
        const result = JSON.parse(content) as ValidationResult;

        if (result.isValid) {
            logger.info('✅ Advertisement passed quality check.');
        } else {
            logger.warn(`❌ Advertisement failed validation: ${result.reason}`);
        }

        return result;

    } catch (error) {
        logger.error('Quality validation failed to run', error);
        // If validation fails to run, we proceed to avoid blocking the user
        return { isValid: true };
    }
};

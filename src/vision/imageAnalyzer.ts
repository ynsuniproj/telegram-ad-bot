import { groqClient } from '../services/groqClient';
import { logger } from '../utils/logger';
import * as fs from 'fs';

export interface VisualStyle {
    composition: string;
    lighting: string;
    colors: string;
    background: string;
    camera: string;
    layout: string;
}

export const analyzeCompetitorImage = async (imagePath: string): Promise<VisualStyle> => {
    logger.info(`Extracting visual style from image: ${imagePath}`);

    try {
        // Read file and convert to base64 Data URL
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

        const prompt = `
        Analyze the advertising visual style of this image. 
        Extract design characteristics explicitly for an AI image generator to replicate the look and feel.
        Return ONLY a strict JSON object with these exact keys:
        "composition", "lighting", "colors", "background", "camera", "layout".
        Do not wrap the JSON in markdown blocks. Just return the raw JSON object.
        `;

        const response = await groqClient.chat.completions.create({
            model: "llama-3.2-11b-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ],
            temperature: 0.2, // Low temperature for consistent JSON extraction
            max_tokens: 500
        });

        const content = response.choices[0]?.message?.content?.trim() || "{}";
        const parsedStyle = JSON.parse(content) as VisualStyle;
        logger.info(`Vision Analyzer Extracted Style successfully.`);
        return parsedStyle;

    } catch (error) {
        logger.error('Failed to analyze image with Groq Vision', error);
        throw error;
    }
};

import { groqClient } from '../services/groqClient';
import { logger } from '../utils/logger';
import * as fs from 'fs';

export interface DesignStyle {
    headline_position: string;     // "top", "center", "bottom"
    subtitle_position: string;     // "below headline", "top", etc.
    cta_position: string;          // "bottom center", "bottom right", etc.
    text_effects: string[];        // ["stroke", "soft glow", "drop shadow"]
    text_color: string;            // "#ffffff" or "white"
    layout_balance: string;        // "subject on right", "centered", "subject on left"
    subject_orientation: string;   // "facing left", "facing right", "centered"
    color_palette: string;         // dominant colors description
    lighting_direction: string;    // "left", "right", "top", "dramatic"
    scene_color_temp: string;      // "warm", "cool", "neutral", "golden hour", "neon"
}

export const analyzeDesignStyle = async (imagePath: string): Promise<DesignStyle> => {
    logger.info(`Analyzing full design style from competitor image: ${imagePath}`);

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    const prompt = `
    You are an expert advertising art director and design analyst.
    Analyze this competitor advertisement image in detail and extract its complete design intelligence.
    
    Return ONLY a raw JSON object with these exact keys:
    "layout_balance", "subject_orientation", "color_palette", "lighting_direction", "scene_color_temp"
    
    - headline_position: where the main title text is ("top", "center", "bottom", "top-left", etc.)
    - subtitle_position: where supporting text is ("below headline", "top", "bottom", etc.)
    - cta_position: where the call-to-action is ("bottom center", "bottom right", etc.)
    - text_effects: array of visual effects seen on text (e.g. ["stroke", "glow", "drop shadow", "gradient"])
    - text_color: primary text color as hex or named color (e.g. "#ffffff", "white", "gold")
    - layout_balance: description of visual composition (e.g. "subject on right side, text on left", "centered subject")
    - subject_orientation: "facing left", "facing right", or "centered"
    - color_palette: description of dominant colors (e.g. "dark blue and orange")
    - lighting_direction: "from left", "from right", "top-down", "side lighting"
    - scene_color_temp: "warm", "cool", "neutral", "neon purple", "sunset orange"
    
    Do NOT wrap in markdown. Return raw JSON only.
    `;

    try {
        const response = await groqClient.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: base64Image } }
                    ]
                }
            ],
            temperature: 0.2,
            max_tokens: 600
        });

        const content = response.choices[0]?.message?.content?.trim() || '{}';
        const style = JSON.parse(content) as DesignStyle;
        logger.info(`Design Style Analysis complete: ${JSON.stringify(style)}`);
        return style;

    } catch (error) {
        logger.error('Design style analysis failed', error);
        // Return safe defaults
        return {
            headline_position: 'center',
            subtitle_position: 'below headline',
            cta_position: 'bottom center',
            text_effects: ['drop shadow', 'stroke'],
            text_color: '#ffffff',
            layout_balance: 'centered subject',
            subject_orientation: 'centered',
            color_palette: 'dark background with white text',
            lighting_direction: 'soft diffused',
            scene_color_temp: 'neutral'
        };
    }
};

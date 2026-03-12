import { groqClient } from '../services/groqClient';
import { logger } from '../utils/logger';
import { CaptionSemantics } from '../ai/captionAnalyzer';

export interface AdLayout {
    brandName: string;
    headline: string;
    subheadline: string;
    cta: string;
}

export const generateAdLayout = async (
    caption: string,
    semantics: CaptionSemantics
): Promise<AdLayout> => {
    logger.info('Generating Arabic ad text layout from caption...');

    const prompt = `
    You are an expert Arabic advertising copywriter.
    
    User Caption: "${caption}"
    Mood: ${semantics.mood}
    Emotion: ${semantics.emotion}
    Style: ${semantics.style}
    
    Generate advertising text layers for a social media ad image in Arabic.
    Return ONLY a strict JSON object with these exact keys:
    "brandName", "headline", "subheadline", "cta"
    
    - brandName: short brand or slogan (max 3 words in Arabic)
    - headline: main bold Arabic headline (max 5 words, powerful and direct)
    - subheadline: supportive sentence in Arabic (max 8 words)
    - cta: call to action button text (max 3 words in Arabic, e.g. اطلب الآن, اشترِ الآن, اكتشف المزيد)
    
    All text must be in Arabic. Do not use English. Return raw JSON only, no markdown.
    `;

    try {
        const response = await groqClient.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: 300
        });

        const content = response.choices[0]?.message?.content?.trim() || '{}';
        const layout = JSON.parse(content) as AdLayout;
        logger.info(`Generated Ad Layout: ${JSON.stringify(layout)}`);
        return layout;

    } catch (error) {
        logger.warn('Layout generation failed, using caption as headline', error);
        return {
            brandName: 'عرض خاص',
            headline: caption.substring(0, 30),
            subheadline: 'جودة عالية بأسعار مميزة',
            cta: 'اطلب الآن'
        };
    }
};

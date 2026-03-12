import { CaptionSemantics } from './captionAnalyzer';
import { logger } from '../utils/logger';

// Mood-based physical realism detail presets
const moodDetails: Record<string, string> = {
    intense: 'sweat beads on skin, wet hair clinging to face, dirt and dust on clothing, visible muscle tension, veins on forearms, heavy breath condensation, dramatic side lighting',
    luxury: 'flawless glossy skin, soft diffused lighting with subtle catchlights, expensive fabric textures with surface sheen, elegant environment with bokeh background, immaculate grooming',
    energetic: 'motion blur on extremities, explosive energy pose, vibrant color saturation, high contrast lighting, dynamic diagonal composition',
    calm: 'even well-diffused lighting, peaceful expression, clean environment, soft pastel tones, minimal harsh shadows',
    sport: 'athletic build with visible muscle definition, athletic motion captured mid-action, dusty or outdoor ground texture, compression wear details',
    bold: 'strong direct eye contact, high contrast lighting, urban backdrop, graphic composition, saturated accent colors',
    adventure: 'mud splatter on clothing, scratches and texture on gear, wind movement in shot, raw outdoor environment',
    elegant: 'silk or satin fabric with folds, warm studio lighting, minimalist background, refined posture'
};

const qualityBooster = `
Photorealistic advertisement quality: extremely sharp skin texture at pixel level, 
visible individual pores and micro-textures, high dynamic range with deep shadows and bright highlights, 
realistic subsurface scattering on skin, shallow depth of field with creamy bokeh background, 
8K commercial photography resolution, cinematic color grading, professional studio grade, 
award-winning advertising photography, absolutely zero text or typography in the image.
`;

export const enhancePromptWithScene = (
    basePrompt: string,
    semantics: CaptionSemantics
): string => {
    logger.info(`Enhancing FLUX prompt for mood: "${semantics.mood}"`);

    // Find mood details (try exact, then fallback partial match, then generic)
    const moodKey = Object.keys(moodDetails).find(k =>
        semantics.mood.toLowerCase().includes(k)
    ) || 'bold';

    const physicalDetails = moodDetails[moodKey];
    const styleContext = `${semantics.style} aesthetic, ${semantics.environment} setting, emotions of ${semantics.emotion}`;

    const enhancedPrompt = `${basePrompt}. ${physicalDetails}. ${styleContext}. ${qualityBooster.trim()}`;

    logger.info(`Scene-enhanced prompt ready (${enhancedPrompt.length} chars).`);
    return enhancedPrompt;
};

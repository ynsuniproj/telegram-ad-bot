import { generateProfessionalPrompt } from '../services/groqClient';
import { PromptResult } from '../core/types';

/**
 * Encapsulates the business logic of constructing the final prompt.
 * Keeps prompting logic separate from the Telegram handler.
 */
export const composeImagePrompt = async (
    userCaption: string,
    visualStyle: string
): Promise<PromptResult> => {
    // 1. Analyze userCaption for tone and marketing keywords
    // 2. Call the AI service to optimize the prompt
    const improvedPrompt = await generateProfessionalPrompt(userCaption, visualStyle);

    return {
        improvedPrompt,
        marketingMessage: userCaption // Simplified
    };
};

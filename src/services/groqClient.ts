import { env } from '../config/env';
import { logger } from '../utils/logger';

export const generateProfessionalPrompt = async (
    marketingMessage: string,
    visualStyleDescription: string
): Promise<string> => {
    logger.debug('Calling Groq API to generate image prompt', { marketingMessage });

    // Example dummy implementation since this is a scaffold
    // In a real codebase, you would use fetch() or the Groq SDK.
    const prompt = `A highly professional advertisement photography shot in the style of ${visualStyleDescription}. It conveys the following message subtly: ${marketingMessage}. 8k, highly detailed.`;

    return prompt;
};

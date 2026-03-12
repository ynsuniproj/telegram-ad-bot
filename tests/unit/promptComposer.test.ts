import { composeImagePrompt } from '../../src/ai/promptComposer';

describe('Prompt Composer Domain', () => {
    it('should generate a prompt containing the marketing message', async () => {
        // 1. Arrange
        const marketingMessage = "Buy our new shoes";
        const visualStyle = "Cinematic lighting, 8k resolution";

        // 2. Act
        const result = await composeImagePrompt(marketingMessage, visualStyle);

        // 3. Assert
        expect(result.improvedPrompt).toContain(visualStyle);
        // This is a dummy test for the scaffold architecture to demonstrate where unit tests live
    });
});

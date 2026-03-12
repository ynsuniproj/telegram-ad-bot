export interface UserRequest {
    chatId: number;
    messageId: number;
    caption: string;
    competitorImageUrl: string | null;
}

export interface PromptResult {
    improvedPrompt: string;
    marketingMessage: string;
}

export interface ImageGenerationResult {
    baseImageBuffer: Buffer;
    success: boolean;
    error?: string;
}

export interface FinalRenderResult {
    finalImageBuffer: Buffer;
    success: boolean;
    error?: string;
}

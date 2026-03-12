import { z } from 'zod';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    // In production (Render) there is no .env file, variables are injected by the OS
    dotenv.config();
}

const envSchema = z.object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram Bot Token is required"),
    TELEGRAM_ALLOWED_USER_ID: z.string().regex(/^\d+$/, "Must be a numeric ID").transform(Number),
    TELEGRAM_WEBHOOK_SECRET: z.string().min(1, "Telegram Webhook Secret Token is required"),
    PUBLIC_BASE_URL: z.string().url("Must be a valid URL"),
    GROQ_API_KEY: z.string().min(1, "Groq API Key is required"),
    HUGGING_FACE_TOKEN: z.string().optional(),
    FLUX_MICROSERVICE_URL: z.string().url("Must be a valid URL").default('http://localhost:8000'),
    LOG_LEVEL: z.string().default('info')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("❌ Invalid environment variables:", JSON.stringify(parsedEnv.error.format(), null, 2));
    process.exit(1);
}

export const env = parsedEnv.data;

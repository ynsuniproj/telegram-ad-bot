import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load env explicitly for script running independently
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = `${process.env.PUBLIC_BASE_URL}/webhook/telegram`;
const SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!TOKEN || !WEBHOOK_URL || !SECRET_TOKEN) {
    console.error("❌ Missing required environment variables. Ensure TELEGRAM_BOT_TOKEN, PUBLIC_BASE_URL and TELEGRAM_WEBHOOK_SECRET are set.");
    process.exit(1);
}

const registerWebhook = async () => {
    console.log(`📡 Registering Webhook Target -> ${WEBHOOK_URL}`);

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
            url: WEBHOOK_URL,
            secret_token: SECRET_TOKEN,
            allowed_updates: ["message", "edited_message"] // Optimize payload delivery
        });

        if (response.data.ok) {
            console.log("✅ Webhook successfully registered with Telegram!");
            console.log("Response:", response.data.description);
        } else {
            console.error("❌ Failed to register webhook:", response.data);
        }
    } catch (error: any) {
        console.error("❌ Telegram API Error:", error.response?.data || error.message);
    }
};

registerWebhook();

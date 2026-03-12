# Telegram AI Advertisement Bot

This project is a Telegram bot that generates professional social media advertisement images using AI. It leverages a local FLUX model for image generation, Groq API for prompt engineering, and an internal rendering engine for Arabic typography.

## Telegram Bot Integration

The bot is currently configured to accept messages exclusively from an authorized user ID for strict access control. 

### Configuration & Required Environment Variables

To configure and run the bot, you need to populate your `.env` file with the following required variables:

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token (obtained from @BotFather).
- `TELEGRAM_ALLOWED_USER_ID`: The numeric Telegram User ID of the single authorized user. Messages from any other ID will be silently rejected.
- `PORT`: (Optional) The server port (default 3000).
- `LOG_LEVEL`: (Optional) Logging level (default 'info').

Example `.env` configuration:
```env
TELEGRAM_BOT_TOKEN=8668592558:AAEpE6sntn_KlAiFJ8YE7yRZnRJCVaSmZzY
TELEGRAM_ALLOWED_USER_ID=6577704915
GROQ_API_KEY=your_groq_api_key_here
FLUX_MICROSERVICE_URL=http://localhost:8000
NODE_ENV=development
```

### Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   The bot will start polling for messages automatically.

### Example Request Flow
1. **User Authorization**: The bot checks `msg.from.id` against `TELEGRAM_ALLOWED_USER_ID`. If it does not match, the message is ignored.
2. **Message Receipt**:
   - **Image + Caption**: Extracts `file_id` and text. Downloads the highest resolution image via Telegram API and saves it locally to `tmp/uploads`. Replies with success.
   - **Text Only**: Logs the message and asks the user for an image.
   - **Invalid Formats**: Asks the user to send an image.

## System Architecture

### Render Deployment & Webhooks
The Node.js server is designed to run in production on platforms like [Render.com](https://render.com). It listens to POST requests from Telegram Webhooks.

#### Preparation
Ensure the following Environment Variables are configured in your Render Web Service dashboard:
- `TELEGRAM_BOT_TOKEN`: The API Token from BotFather.
- `TELEGRAM_ALLOWED_USER_ID`: The exact numeric ID of the single authorized bot user.
- `TELEGRAM_WEBHOOK_SECRET`: A secure randomly generated string to verify incoming requests.
- `PUBLIC_BASE_URL`: Your actual deployed Render domain (e.g. `https://my-ad-bot.onrender.com`).
- `GROQ_API_KEY`: API Key.

#### Deployment Steps
1. Connect you Github Repository in Render and create a new Web Service.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Deploy the service.
5. Watch the Render console to confirm it says `Server listening on port...`.

#### Registering Webhook
Once the service is live, register it with the Telegram API by running the standalone script from any terminal that has your `.env` configured with the new Render domain:
```bash
npx ts-node scripts/setWebhook.ts
```
This tells Telegram to send updates seamlessly via HTTP along with your unique `TELEGRAM_WEBHOOK_SECRET` Header.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed breakdown of the system components, separation of concerns, and module interactions.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Docker and Docker Compose
- Groq API Key
- Telegram Bot Token

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd telegram-ad-bot
   ```

2. **Environment Variables:**
   Copy the example environment file and fill in your secrets.
   ```bash
   cp .env.example .env
   ```

3. **Install Dependencies (Node.js):**
   ```bash
   npm install
   ```

4. **Install Dependencies (Python Microservice):**
   ```bash
   cd microservices/flux-generator
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

5. **Start the Application:**
   For local development (without Docker):
   ```bash
   # Start the Python microservice
   cd microservices/flux-generator && python main.py
   
   # Start the Node.js application (in a new terminal)
   npm run dev
   ```

### Docker Deployment

To run the entire stack using Docker Compose:
```bash
docker-compose up --build
```

## Development Workflow

1. Check out a new branch for your feature (`feature/your-feature-name`).
2. Write clean, single-responsibility functions.
3. Ensure configuration is added to `.env.example` and validated in `src/config/env.ts`.
4. Write tests for any new AI prompts or rendering logic in `tests/`.
5. Run tests using `npm test`.
6. Submit a Pull Request.

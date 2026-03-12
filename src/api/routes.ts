// Optional REST implementation, e.g., using Express or Fastify
// In case the bot needs to be triggered via webhooks instead of polling,
// or if there is a dashboard UI for the admins.

// import express from 'express';
// import { env } from '../config/env';

export const initApi = (port: string | number) => {
    /*
    const app = express();
    app.use(express.json());
  
    app.post('/webhook', (req, res) => {
      // Forward to bot
      res.sendStatus(200);
    });
  
    app.listen(port, () => {
      console.log(`API Server listening on port ${port}`);
    });
    */
};

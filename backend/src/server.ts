import './env';
import express from 'express';
import cors from 'cors';
import { mastra } from './mastra';

const app = express();
const port = process.env.PORT || 3001;

// Allow Expo app to connect (adjust origin in production)
app.use(cors());
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Growwit Backend is live' });
});

/**
 * Main endpoint for generating Reddit campaigns with streaming
 */
app.post('/api/generate-campaign', async (req, res) => {
    const { productName, productDescription, userGoal } = req.body;

    if (!productName || !productDescription || !userGoal) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const orchestrator = mastra.getAgent('campaignGenerator');

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        const prompt = `Create a complete Reddit marketing campaign.
        
        CAMPAIGN TARGET:
        - Product: ${productName}
        - Description: ${productDescription}
        - Goal: ${userGoal}
        
        REQUIRED WORKFLOW:
        1. Delegate to the 'strategist' agent to find the best subreddits and framing strategies.
        2. Once you have the research, delegate to the 'cadenceAgent' to find the absolute best posting times.
        3. Once you have both research and timing, delegate to the 'writer' agent to create voices-matched drafts.
        4. Finally, compile and output the full report in the required markdown format.`;

        console.log(`🚀 [Campaign] Orchestrating generation for: ${productName}`);

        const stream = await orchestrator.stream(prompt);

        let fullResponse = '';
        for await (const chunk of (stream as any).textStream) {
            fullResponse += chunk;
            process.stdout.write(chunk); // See it in real-time in terminal
            res.write(chunk);
        }

        res.end();
        console.log(`\n\n[DEBUG] Full response length: ${fullResponse.length}`);
        console.log(`✅ Campaign orchestration complete for: ${productName}`);

    } catch (error: any) {
        console.error('💥 Error in generate-campaign:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message || 'Internal Server Error' });
        } else {
            res.write(`\n\n[ERROR]: ${error.message}`);
            res.end();
        }
    }
});

app.listen(port, () => {
    console.log(`
  🚀 Growwit Backend Bridge is live!
  📡 Listening on: http://localhost:${port}
  🔗 Expo endpoint: http://localhost:${port}/api/generate-campaign
  `);
});

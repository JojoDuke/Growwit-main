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
        const strategist = mastra.getAgent('strategist');
        const writer = mastra.getAgent('writer');
        const cadence = mastra.getAgent('cadenceAgent');

        // Set headers for SSE (Server-Sent Events) or raw streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        const strategistPrompt = `Perform a deep research and scout the best subreddits for:
Product Name: ${productName}
Description: ${productDescription}
Goal: ${userGoal}

Identify 3-5 subreddits, verify their rules, and define a native framing strategy.`;

        console.log(`🔍 [Campaign] Starting generation for: ${productName}`);

        // STEP 1: Scouting
        res.write('[STEP:1]\n');
        console.log('Step 1: Scouting...');

        let strategyText = '';
        const strategistStream = await strategist.stream(strategistPrompt);

        for await (const chunk of (strategistStream as any).textStream) {
            res.write(chunk);
            strategyText += chunk;

            // Heuristic for Step 2: Once we have some text, we're likely analyzing it
            if (strategyText.length > 500 && !strategyText.includes('[STEP:2]')) {
                // res.write('\n[STEP:2]\n'); // We'll let the agent output trigger it if possible, or just send it here
            }
        }

        // STEP 3: Verifying rules + STEP 4: Drafting
        res.write('\n\n[STEP:3]\n\n');
        res.write('--- 🤖 HANDING OFF TO WRITER AGENT ---\n\n');
        console.log('Step 3/4: Writing...');

        const writerPrompt = `
        Here is the strategy research provided by Agent A. 
        Please generate high-quality Reddit post drafts based on this data.
        
        STRATEGY DATA:
        ${strategyText}
        
        INSTRUCTIONS:
        - Generate a specific post for EACH subreddit recommended above.
        - STRICTLY follow the "Rules Constraints" and "Safety Rating" provided for each.
        - Use the specific "Framing Strategy" suggested.
        - Start by saying you are performing a safety check.
        `;

        let writerText = '';
        const writerStream = await writer.stream(writerPrompt);

        for await (const chunk of (writerStream as any).textStream) {
            res.write(chunk);
            writerText += chunk;

            if (writerText.includes('**Title:**') && !writerText.includes('[STEP:4]')) {
                res.write('\n[STEP:4]\n');
            }
        }

        // STEP 5: Finalizing Cadence
        res.write('\n\n[STEP:5]\n\n');
        res.write('--- 🤖 HANDING OFF TO CADENCE AGENT ---\n\n');
        console.log('Step 5: Scheduling...');

        const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const cadencePrompt = `
        We have the strategy and the drafts. Now we need the TIMING.
        
        CONTEXT:
        Current Day: ${currentDay}
        Current Time: ${currentTime} UTC
        
        STRATEGY DATA:
        ${strategyText}
        
        DRAFT CONTENT:
        ${writerText}
        
        INSTRUCTIONS:
        - Analyze the "Optimal Overall" posting times for EACH subreddit mentioned.
        - cross-reference with "Self-promo" days if found in the rules.
        - Provide the final scheduling block for the user.
        `;

        const cadenceResult = await cadence.stream(cadencePrompt);

        for await (const chunk of (cadenceResult as any).textStream) {
            res.write(chunk);
        }

        res.end();
        console.log(`\n✅ Campaign generation complete for: ${productName}`);

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

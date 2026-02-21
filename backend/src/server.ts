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

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        const strategistPrompt = `Perform a deep research and scout the best subreddits for:
Product Name: ${productName}
Description: ${productDescription}
Goal: ${userGoal}

Identify 5 potential subreddits and verify their rules.`;

        console.log(`🔍 [Campaign] Starting generation for: ${productName}`);

        // STEP 1 & 2: Scouting & Research
        res.write('[STEP:1]\n');
        console.log('Step 1: Scouting...');

        let strategyText = '';
        let sentStep2 = false;
        const strategistStream = await strategist.stream(strategistPrompt);

        for await (const chunk of (strategistStream as any).textStream) {
            res.write(chunk);
            strategyText += chunk;
            if (strategyText.length > 500 && !sentStep2) {
                res.write('\n[STEP:2]\n');
                sentStep2 = true;
            }
        }

        // STEP 5: Timing Analysis (Internal, but moves progress)
        res.write('\n\n--- 🤖 HANDING OFF TO CADENCE AGENT ---\n\n');
        res.write('\n[STEP:5]\n');
        console.log('Step 5: Scheduling Analysis...');

        const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const cadencePrompt = `
        For each subreddit identified by the Strategist, find the absolute best peak day and hour to post.
        
        CONTEXT:
        Current Time: ${currentTime} UTC (${currentDay})
        
        SUBREDDITS FOUND:
        ${strategyText}
        
        Provide the Optimal Overall peak window (Day and Time) for each.
        `;

        let cadenceText = '';
        const cadenceStream = await cadence.stream(cadencePrompt);

        for await (const chunk of (cadenceStream as any).textStream) {
            // We stream it so frontend can see it if it wants, but it will be filtered from main view
            res.write(chunk);
            cadenceText += chunk;
        }

        // STEP 3 & 4: Safety & Drafting (Final Step)
        res.write('\n\n[STEP:3]\n\n');
        res.write('--- 🤖 HANDING OFF TO WRITER AGENT ---\n\n');
        console.log('Step 3/4: Writing Drafts...');

        const writerPrompt = `
        Generate high-quality Reddit post drafts based on the research and timing provided below.
        
        RESEARCH:
        ${strategyText}
        
        TIMING ANALYSIS:
        ${cadenceText}
        
        INSTRUCTIONS:
        - For EACH recommendation, start with a header exactly like this: "## r/[SubredditName]"
        - Follow with "**Title:**" and "**Body:**" sections.
        - Follow with a "**Scheduled For:** [Day] at [Time]" section using the peak window research.
        - MATCH THE USER VOICE: Direct, casual, no corporate fluff (no "hey folks", no "I got curious").
        - Keep the posts very authentic and human-like.
        `;

        res.write('\n[STEP:4]\n');
        let writerText = '';
        const writerStream = await writer.stream(writerPrompt);

        for await (const chunk of (writerStream as any).textStream) {
            res.write(chunk);
            writerText += chunk;
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

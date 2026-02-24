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

        const prompt = `Create a high-impact Reddit marketing campaign for the following product:
        
        PRODUCT: ${productName}
        DESCRIPTION: ${productDescription}
        GOAL: ${userGoal}
        
        Execute your full orchestration workflow (Scouting -> Timing -> Writing) and deliver the final report in your required markdown format.`;

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

/**
 * Phase 2: Generating the actual volume of posts based on confirmed strategy
 */
app.post('/api/craft-real-posts', async (req, res) => {
    const { aiOutput, postsPerMonth, productName, productDescription } = req.body;

    if (!aiOutput || !postsPerMonth) {
        return res.status(400).json({ error: 'Missing required strategy or post count' });
    }

    try {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        // 1. Parse Subreddits and Strategies from the aiOutput
        const subMatch = aiOutput.match(/# 🎯 TARGET SUBREDDITS([\s\S]*?)(?=#|$)/i);
        const subreddits = subMatch ? subMatch[1]
            .split("\n")
            .map((s: string) => s.trim().replace(/^[-*]\s*r\//, ""))
            .filter((s: string) => s.length > 0) : ["marketing"];

        const framingMatch = aiOutput.match(/# 💡 FRAMING STRATEGIES([\s\S]*?)(?=#|$)/i);
        const strategies = framingMatch ? framingMatch[1].trim() : "Standard marketing angle.";

        const count = parseInt(postsPerMonth) || 5;
        const writer = mastra.getAgent('writer');

        console.log(`🔨 [Crafting] Starting high-volume generation: ${count} posts for ${productName}`);

        for (let i = 0; i < count; i++) {
            const subredditIndex = i % subreddits.length;
            const targetSub = subreddits[subredditIndex];

            // Generate a unique post
            const prompt = `
            SUBREDDIT: r/${targetSub}
            PRODUCT: ${productName}
            DESCRIPTION: ${productDescription}
            STRATEGIC CONTEXT: ${strategies}
            
            MISSION: Generate a unique, high-quality post #${i + 1} for this subreddit.
            Ensure it follows the GROWWIT VOICE (direct, casual, no fluff).
            Vary the angle from previous posts if possible.
            
            OUTPUT: Provide the Title and Body in the standard format.
            `;

            const result = await writer.generate(prompt);
            const text = result.text || "";

            // Wrap in a marker for easy frontend parsing
            const wrappedPost = `\n[POST_START]\n[SUBREDDIT]: r/${targetSub}\n${text}\n[POST_END]\n`;
            res.write(wrappedPost);

            // Console progress
            console.log(`✅ [Crafting] Generated post ${i + 1}/${count} for r/${targetSub}`);
        }

        res.end();
        console.log(`✨ [Crafting] All ${count} posts generated successfully.`);

    } catch (error: any) {
        console.error('💥 Error in craft-real-posts:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message || 'Internal Server Error' });
        } else {
            res.write(`\n\n[ERROR]: ${error.message}`);
            res.end();
        }
    }
});

app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`
  🚀 Growwit Backend Bridge is live!
  📡 Listening on: http://0.0.0.0:${port} (LAN: http://192.168.1.204:${port})
  🔗 Core Endpoint: /api/generate-campaign
  🛠️ Craft Endpoint: /api/craft-real-posts
  `);
});

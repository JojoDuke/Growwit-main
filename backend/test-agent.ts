import dotenv from 'dotenv';
dotenv.config();

console.log('🔑 test-agent checking keys:');
console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('API_KEY')));

import { mastra } from './src/mastra';

async function test() {
    const orchestrator = mastra.getAgent('campaignGenerator');
    const prompt = "Generate a campaign for Zest AI, an AI meal planner for busy software engineers looking for 5 beta testers.";

    console.log("Starting test...");
    const result = await orchestrator.generate(prompt);
    console.log("\n--- AGENT OUTPUT ---\n");
    console.log(result.text);
    console.log("\n--- END OUTPUT ---\n");
}

test();

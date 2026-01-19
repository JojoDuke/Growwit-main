import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
import dotenv from 'dotenv';

dotenv.config();

export const MODELS = {
    // Agent B: The Voice Specialist (Premium brain for human-like writing)
    WRITER: openai('gpt-4o'),

    // Orchestrator: The Project Manager (Ultra-fast routing and planning)
    ORCHESTRATOR: groq('llama-3.3-70b-versatile'),

    // Agent A: The Deep Researcher (Reasoning-focused for subreddit scouting)
    STRATEGIST: groq('llama-3.3-70b-versatile'),

    // Agent C: The Data Analyst (Logic-focused for engagement peak analysis)
    CADENCE: groq('qwen/qwen3-32b'),
};

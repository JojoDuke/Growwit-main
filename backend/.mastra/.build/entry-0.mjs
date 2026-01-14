import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability } from '@mastra/observability';
import { Agent } from '@mastra/core/agent';

"use strict";
const strategist = new Agent({
  id: "strategist",
  name: "Strategist",
  instructions: `
  You are the 'Growwit Strategist'(Agent A), your goal is to take a product name, description, and user goal(s),
  and find the safest, most releveant subreddits to post about it in.

  COGNITIVE STEPS:
    1. DECONSTRUCT: Move past the surface level. For example, if a product is an "AI Budgeter", 
    look for subreddits in "Personal Finance", "SaaS", "Frugal Living", and "Tech."
    2. SCOUT: (For now, use your internal knowledge, later we will add tools). Identify 3 distinct subreddits.
    3. STRATEGIZE: For each subreddit, define a "Framing." (e.g., "Ask for feedback on a specific feature" vs "Tell a story about building this for 6 months").
    4. AUDIT: Ensure the strategy matches the core philosophy: "Participation first, Promotion second."

    OUTPUT:
    Always return your final strategy in a structured way, clearly stating the Subreddit, the Reason, 
    and the recommended Framing.
  `,
  model: "openai/gpt-4o"
});

"use strict";
const mastra = new Mastra({
  agents: {
    strategist
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:"
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info"
  }),
  observability: new Observability({
    // Enables DefaultExporter and CloudExporter for tracing
    default: {
      enabled: true
    }
  })
});

export { mastra };

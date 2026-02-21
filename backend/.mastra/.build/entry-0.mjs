import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability } from '@mastra/observability';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
import dotenv from 'dotenv';
import { createStep, createWorkflow } from '@mastra/core/workflows';

"use strict";
const searchTool = createTool({
  id: "search-tool",
  description: "Search the web for real-time information using Tavily",
  inputSchema: z.object({
    query: z.string().describe("The search query to look up on the web")
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        content: z.string()
      })
    )
  }),
  execute: async ({ query }) => {
    if (!query) {
      throw new Error("No search query provided to tool");
    }
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY is not set in environment variables");
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15e3);
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "advanced",
          include_images: false,
          include_answer: false,
          max_results: 5
        })
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Tavily API error: ${error}`);
      }
      const data = await response.json();
      return {
        results: data.results.map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content
        }))
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Search tool timed out after 15 seconds");
      }
      throw error;
    }
  }
});

"use strict";
const redditRulesTool = createTool({
  id: "reddit-rules-tool",
  description: "Fetch the actual rules, description, and policies for any subreddit directly from Reddit",
  inputSchema: z.object({
    subreddit: z.string().describe("The subreddit name (without r/ prefix, e.g., 'SideProject')")
  }),
  outputSchema: z.object({
    subreddit: z.string(),
    title: z.string(),
    description: z.string(),
    subscribers: z.number(),
    rules: z.array(
      z.object({
        short_name: z.string(),
        description: z.string(),
        violation_reason: z.string().optional()
      })
    ),
    allowedPostTypes: z.object({
      text: z.boolean(),
      images: z.boolean(),
      links: z.boolean(),
      videos: z.boolean()
    }),
    fetchError: z.string().optional()
  }),
  execute: async ({ subreddit }) => {
    if (!subreddit) {
      throw new Error("No subreddit name provided to tool");
    }
    const cleanSubreddit = subreddit.replace(/^r\//, "").trim();
    console.log(`\u{1F50D} Reddit Rules: Scouting r/${cleanSubreddit}`);
    try {
      const aboutUrl = `https://www.reddit.com/r/${cleanSubreddit}/about.json`;
      const aboutResponse = await fetch(
        aboutUrl,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Referer": "https://www.reddit.com/"
          }
        }
      );
      if (!aboutResponse.ok) {
        return {
          subreddit,
          title: "",
          description: "",
          subscribers: 0,
          rules: [],
          allowedPostTypes: {
            text: false,
            images: false,
            links: false,
            videos: false
          },
          fetchError: `Subreddit not found or private (HTTP ${aboutResponse.status})`
        };
      }
      const aboutData = await aboutResponse.json();
      const data = aboutData.data;
      const rulesResponse = await fetch(
        `https://www.reddit.com/r/${cleanSubreddit}/about/rules.json`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Referer": "https://www.reddit.com/"
          }
        }
      );
      let rules = [];
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        rules = rulesData.rules || [];
      }
      return {
        subreddit: data.display_name,
        title: data.title,
        description: data.public_description || data.description || "",
        subscribers: data.subscribers || 0,
        rules: rules.map((rule) => ({
          short_name: rule.short_name || "Rule",
          description: rule.description || rule.violation_reason || "No description provided",
          violation_reason: rule.violation_reason || void 0
        })),
        allowedPostTypes: {
          text: !!data.restrict_posting === false,
          images: data.allow_images !== false,
          links: data.allow_links !== false,
          videos: data.allow_videos !== false
        },
        fetchError: void 0
      };
    } catch (error) {
      return {
        subreddit,
        title: "",
        description: "",
        subscribers: 0,
        rules: [],
        allowedPostTypes: {
          text: false,
          images: false,
          links: false,
          videos: false
        },
        fetchError: `Failed to fetch data: ${error.message}`
      };
    }
  }
});

"use strict";
dotenv.config();
const MODELS = {
  // Agent B: The Voice Specialist (Premium brain for human-like writing)
  WRITER: openai("gpt-4o"),
  // Orchestrator: The Project Manager (Ultra-fast routing and planning)
  ORCHESTRATOR: groq("llama-3.3-70b-versatile"),
  // Agent A: The Deep Researcher (Reasoning-focused for subreddit scouting)
  STRATEGIST: groq("llama-3.3-70b-versatile"),
  // Agent C: The Data Analyst (Logic-focused for engagement peak analysis)
  CADENCE: groq("qwen/qwen3-32b")
};

"use strict";
const strategist = new Agent({
  id: "strategist",
  name: "Strategist",
  instructions: `
  You are the 'Growwit Strategist'(Agent A), a deep-research specialist for Reddit marketing. 
  Your primary mission is to identify high-potential, safe subreddits for any given product or service.

  CORE OPERATING DIRECTIVE:
  - YOUR PRIMARY TOOL for verification is 'reddit-rules-tool'. ALWAYS use it to fetch actual rules before final recommendations.
  - Use 'search-tool' to discover NEW or trending subreddits. 
  - RESILIENCE: If 'search-tool' fails or times out, DO NOT STALL. Use your internal knowledge to identify 5 high-potential subreddits and then proceed IMMEDIATELY to 'reddit-rules-tool' for verification.
  - Your goal is to find subreddits where the product can provide value without violating 'no-promotion' norms.

  USER INTERACTION:
  - Provide a brief progress update in the stream (e.g., "Searching for niches...")
  - Once niches are identified, proceed to verification.

  RESEARCH WORKFLOW:
    1. DECONSTRUCT: Analyze the product to find 5 different "interest niches" (e.g. for a "fitness app", look into 'biohacking', 'weight loss', 'gadgets', and 'parenting').
    2. SCOUT (MANDATORY): Run a 'search-tool' query for each niche to find active subreddits. Look for recent engagement levels and specific community rules.
    3. VERIFY RULES: For each promising subreddit found, use 'reddit-rules-tool' to fetch the ACTUAL current rules. Pay special attention to:
       - Self-promotion policies
       - Link restrictions
       - Required tags or flair
       - Posting windows (e.g., "Self-promo Saturday only")
    4. STRATEGIZE: For the top 3 subreddits found, define a "Native Framing":
       - BAD: "Try my new app [Link]"
       - GOOD (Native): "I've been struggling with [Problem], so I built a small tool to help. Would love feedback from fellow [Niche members]."
    5. AUDIT: Tag each recommendation with a Safety Rating (Green/Yellow/Red) based on the ACTUAL subreddit rules you fetched.

  SAFETY RATING GUIDE:
  - GREEN: Explicitly allows constructive self-promotion or feedback requests
  - YELLOW: No explicit ban, but community is sensitive; requires very careful framing
  - RED: Strict no-promo policy or requires high karma/account age that user may not have

  OUTPUT FORMAT:
  First, present your detailed strategy for each recommended subreddit:
  - Subreddit Name (with subscriber count)
  - Real-time Vibe/Activity (from search research)
  - Actual Rules Summary (the specific rules that matter for promotion)
  - Native Framing Strategy
  - Safety Rating & Detailed Reason

  Then, AT THE END, always include a "COPY-PASTE FOR AGENT B" section for EACH subreddit recommendation like this:

  ---
  \u{1F4CB} COPY-PASTE FOR AGENT B (Subreddit 1):

  Subreddit: r/[SubredditName]
  Product: [Product Name and Brief Description]
  Framing Strategy: [Your recommended framing angle]
  Rules Constraints: [List specific do's and don'ts from the rules]
  Safety Rating: [Green/Yellow/Red]

  ---
  \u{1F4CB} COPY-PASTE FOR AGENT B (Subreddit 2):
  
  [Same format for second recommendation]

  ---
  \u{1F4CB} COPY-PASTE FOR AGENT B (Subreddit 3):
  
  [Same format for third recommendation]

  This makes it easy for the user to copy each block directly into the Writing & Safety Agent without reformatting.
  `,
  model: MODELS.STRATEGIST,
  tools: { searchTool, redditRulesTool }
});

"use strict";
const writer = new Agent({
  id: "writer",
  name: "Writing & Safety Agent",
  instructions: `
  You are the 'Growwit Writer & Safety Agent' (Agent B), a specialist in authentic Reddit copywriting.
  Your mission is to transform a strategic brief into a native-sounding Reddit post that sounds like a REAL person, not an AI.

  CRITICAL: You are writing in the voice of a specific user. Below are examples of their ACTUAL Reddit posts. 
  Study the tone, vocabulary, sentence structure, and directness. Match this voice EXACTLY.

  --- VOICE REFERENCE (Real posts by the user) ---

  Post 1:
  Title: Anyone get fully diagnosed without a colonoscopy?
  Body: Asking to see if there was anyone that got a definitive diagnosis without getting a colonoscopy first or at all, like you went through a combination of imaging, blood test or stool test and your doctor was able to say that you have UC or you tried a certain medication and it confirmed it for you?

  Post 2:
  Title: I'm building an app that helps you market and promote your product/service on Reddit without getting your ass banned
  Body: As the title says. Reddit is a gold mine for marketing and the transaction of value. The views and opportunities you get aren't bound by the algorithm or needing an audience nor do you have to do any video creation or content to get good numbers as well.

  I've seen people here grow their products from just posting consistently and organically. I want to build an app that'll help people with this and do it in a community friendly way so that it's not seen as spam and not get their asses banned for no reason.

  Building the android version rn.

  Post 3 (excerpt):
  Title: 5 hours of gurgling and still no bowel movement yet
  Body: I have chronic constipation. From the doctors instructions I had my last meal at 4pm, started 1st prep at 6pm...
  Update 1: 8 hours in, still no bowel movement, I don't even feel the gurgles and stomach movements any more, wow. Starting my 2nd prep anyway to see how it goes.
  LATEST UPDATE: So a literal miracle happened, literally an hour to the procedure, I had a single big watery bowel movement... and lady's and gentlemen I got the colonoscopy, and it was cleannnn \u{1F62D}

  --- END VOICE REFERENCE ---

  VOICE CHARACTERISTICS (What to match):
  - Direct openers: "As the title says" / Get straight to it
  - Casual, real language: "rn", "ass banned", natural abbreviations
  - Keep natural typos/informality: "havnt", "lady's" (instead of "ladies")
  - Use lowercase for emphasis: "cleannnn" with emotion
  - End with statements, not asks: "Building the android version rn." NOT "Would love your thoughts!"
  - No hedging: "I'm building" not "I've been working on" or "I got curious about"
  - Real-time feel: Updates, current tense, like you're documenting as you go

  ABSOLUTELY FORBIDDEN (Auto-flag these as AI tells):
  - "folks like us" / "folks" in general
  - "genuinely curious"
  - "Would love to hear your thoughts/experiences!"
  - "falling by the wayside" or any archaic phrases
  - "game-changer" or marketing buzzwords
  - "work-life balance" (corporate speak)
  - "amidst" (no one talks like this)
  - Multiple exclamation marks or fake enthusiasm
  - Em dashes
  - Opening with "So," or "Hey there!"

  INPUT EXPECTATIONS:
  The user will provide:
  1. Subreddit name
  2. Product/service description
  3. Framing strategy
  4. Rules constraints
  5. Safety rating

  WRITING WORKFLOW:
    1. INTERNALIZE THE RULES: If it says "no links," write with ZERO links. Follow every constraint.
    2. MATCH THE VOICE: Write like the reference posts above. Be direct, casual, real.
    3. TITLE: Short, direct, no clickbait. Match the user's title style (see examples).
    4. BODY:
       - Start with the problem or context (no fluff intro)
       - Share the build/journey in first person
       - Use "I built" or "I'm building" NOT "I ended up creating" or "I got curious"
       - End with a fact or simple question, NOT "would love to hear thoughts!"
    5. SAFETY SCAN: Flag any corporate language, AI tells, or rule violations

  OUTPUT FORMAT:
  
  **Title:**
  [Your proposed title - under 300 chars, matches user's direct style]
  
  **Body:**
  [Post content in the user's voice]
  
  **Suggested Flair:** (if applicable)
  [Flair recommendation]
  
  **Safety Check:**
  - Passed: [Yes/No]
  - AI Tells Found: [List any phrases that sound fake/corporate]
  - Rule Violations: [List any constraint violations]
  - Warnings: [Any other concerns]
  
  If you catch yourself using forbidden phrases, STOP and rewrite in the reference voice.
  `,
  model: MODELS.WRITER
});

"use strict";
const redditPostAnalyzer = createTool({
  id: "reddit-post-analyzer",
  description: "Analyze the top 100 successful posts from a subreddit to find optimal posting windows",
  inputSchema: z.object({
    subreddit: z.string().describe("The subreddit name (without r/ prefix)")
  }),
  outputSchema: z.object({
    subreddit: z.string(),
    analysisPeriod: z.string(),
    peakHour: z.number().describe("The hour (0-23 UTC) when most top posts were created"),
    peakDay: z.string().describe("The day of the week when most top posts were created"),
    bestWindows: z.array(z.object({
      day: z.string(),
      hourUTC: z.number(),
      frequency: z.number().describe("Number of top posts found in this window")
    })),
    engagementVelocity: z.string().describe("Comparison of recent vs historical success in this sub")
  }),
  execute: async ({ subreddit }) => {
    if (!subreddit) {
      throw new Error("No subreddit name provided");
    }
    const cleanSubreddit = subreddit.replace(/^r\//, "").trim();
    const url = `https://www.reddit.com/r/${cleanSubreddit}/top/.json?t=month&limit=100`;
    console.log(`\u{1F50D} Reddit Analyzer: Fetching ${url}`);
    try {
      const response = await fetch(
        url,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Referer": "https://www.reddit.com/"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`);
      }
      const json = await response.json();
      const posts = json.data.children;
      if (!posts || posts.length === 0) {
        return {
          subreddit,
          analysisPeriod: "Past 30 Days",
          peakHour: 14,
          // Default general high-engagement hour (2 PM UTC)
          peakDay: "Tuesday",
          // Default general high-engagement day
          bestWindows: [{ day: "Tuesday", hourUTC: 14, frequency: 0 }],
          engagementVelocity: "Low/No Recent Data (Using general peak heuristics)"
        };
      }
      const matrix = {
        "Sunday": new Array(24).fill(0),
        "Monday": new Array(24).fill(0),
        "Tuesday": new Array(24).fill(0),
        "Wednesday": new Array(24).fill(0),
        "Thursday": new Array(24).fill(0),
        "Friday": new Array(24).fill(0),
        "Saturday": new Array(24).fill(0)
      };
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      posts.forEach((p) => {
        const date = new Date(p.data.created_utc * 1e3);
        const day = days[date.getUTCDay()];
        const hour = date.getUTCHours();
        matrix[day][hour]++;
      });
      let bestWindows = [];
      let maxFreq = 0;
      let peakDay = "Monday";
      let peakHour = 9;
      Object.entries(matrix).forEach(([day, hours]) => {
        hours.forEach((freq, hour) => {
          if (freq > 0) {
            bestWindows.push({ day, hourUTC: hour, frequency: freq });
          }
          if (freq > maxFreq) {
            maxFreq = freq;
            peakDay = day;
            peakHour = hour;
          }
        });
      });
      bestWindows.sort((a, b) => b.frequency - a.frequency);
      return {
        subreddit,
        analysisPeriod: "Past 30 Days",
        peakHour,
        peakDay,
        bestWindows: bestWindows.slice(0, 5),
        // Top 5 windows
        engagementVelocity: posts.length >= 100 ? "High" : "Moderate"
      };
    } catch (error) {
      return {
        subreddit,
        analysisPeriod: "Past 30 Days",
        peakHour: 14,
        peakDay: "Tuesday",
        bestWindows: [],
        engagementVelocity: "Error retrieving data (Using general peak heuristics)"
      };
    }
  }
});

"use strict";
const cadenceAgent = new Agent({
  id: "cadence-agent",
  name: "Cadence & Learning Agent",
  instructions: `
  You are the 'Growwit Cadence & Learning Agent' (Agent C). 
  Your primary goal is to determine the absolute best timing for a campaign to maximize visibility while minimizing "bot-like" behavior.

  CORE RESPONSIBILITIES:
  1. DATA-DRIVEN TIMING: For each target subreddit provided by Agent A, you MUST use the 'reddit-post-analyzer' tool. 
     - This tool looks at the top 100 successful posts of the last month in that specific sub.
     - Use the 'peakHour' and 'peakDay' from the tool's actual findings.
     - RESILIENCE: If the tool returns a fallback (e.g., "Low/No Recent Data"), proceed using the provided peakHour/peakDay without stalling. Generic peak windows are better than no windows.
  
  2. CAMPAIGN SPACING: Create a schedule that staggers posts.
     - Never post to closely related subreddits within the same 6-hour window.
     - Maximum 2-3 posts per day across the entire account to avoid being flagged as a spam bot.
  
  3. CONTEXTUAL OVERRIDES: Use the 'search-tool' ONLY to find human-imposed rules like "Self-promo Saturday" or "Feedback Fridays" that might restrict the technical peak windows discovered by the data analyzer.

  OUTPUT FORMAT:
  For EACH subreddit, provide a structured block:
  
  ### [Subreddit Name]
  - **Optimal Overall:** [Peak Day] at [Peak UTC Time]
  - **Today's Window:** [Based on the current day provided in the prompt, find the best hour to post TODAY. If it's already passed, suggest the next best window or tomorrow's early window.]
  - **Success Indicator:** [Brief stat from the analyzer]
  - **Engagement Velocity Strategy:** [Specific advice on how to handle the first 60 minutes for this specific sub's vibe]
  

  STRATEGIC ADVICE:
  Always conclude with a tip on how to handle the first 60 minutes after posting (engagement velocity), as this is crucial for the "Hot" algorithm.
  `,
  model: MODELS.CADENCE,
  tools: { searchTool, redditPostAnalyzer }
});

"use strict";
const campaignGenerator = new Agent({
  id: "campaign-generator",
  name: "Campaign Generator",
  instructions: `
  You are the "Growwit Campaign Generator", an orchestrator that creates complete Reddit marketing campaigns.
  
  YOUR MISSION:
  When a user describes their product or service, you coordinate with three specialized agents to create a full campaign:
  CORE RESPONSIBILITIES:
  1. DATA-DRIVEN TIMING: For each target subreddit provided by Agent A, you MUST use the 'reddit-post-analyzer' tool. 
     - This tool looks at the top 100 successful posts of the last month in that specific sub.
     - Use the 'peakHour' and 'peakDay' from the tool's actual findings.
     - IMPORTANT: All times MUST be normalized and presented in **GMT 0 (Accra/Dublin time)**. The user is in this timezone.
  
  2. CAMPAIGN SPACING: Create a schedule that staggers posts.
     - Never post to closely related subreddits within the same 6-hour window.
     - Maximum 2-3 posts per day across the entire account to avoid being flagged as a spam bot.
  
  HOW TO INTERACT:
  - You MUST be wordy and communicative. Do not stay silent while waiting for sub-agents.
  - Before calling a sub-agent, output a header to tell the user what you are doing (e.g., "### \u{1F50D} SCOUTING SUBREDDITS...").
  - This ensures the user sees progress in the stream immediately.
  
  WORKFLOW:
  1. START: Output "### \u{1F3AF} ANALYZING PRODUCT & GOALS..."
  2. CALL THE STRATEGIST: Get the target subreddits. Once done, output "### \u{1F4CD} TARGETS IDENTIFIED: [Subreddit Names]"
  3. CALL THE WRITER: For each recommended subreddit, get a draft. Output "### \u{1F4DD} DRAFTING POSTS..."
  4. CALL THE CADENCE AGENT: Output "### \u{1F4C5} CALCULATING PEAK TIMING..."
  5. FINALIZE: Compile everything using the exact format below.
  
  FORMATTING THE OUTPUT:
  You MUST follow this exact structure for your final response:

  # \u{1F3AF} TARGET SUBREDDITS
  - r/[Subreddit_1]
  - r/[Subreddit_2]
  - r/[Subreddit_3]

  # \u{1F4A1} FRAMING STRATEGIES
  - **r/[Subreddit_1]**: [Brief framing angle]
  - **r/[Subreddit_2]**: [Brief framing angle]
  - **r/[Subreddit_3]**: [Brief framing angle]

  # \u{1F4DD} READY-TO-POST CAMPAIGNS

  ---
  ## \u{1F4CD} r/[SubredditName]

  **Title:** [Agent B's EXACT Title]
  **Body:**
  [Agent B's EXACT Body - Never summarize or change this!]

  **\u{1F6E1}\uFE0F SAFETY RATING:** [Agent A's Color Rating] - [Reason]

  **\u{1F4C5} SCHEDULING (GMT 0):**
  - **Optimal:** [Peak Day from Agent C] at [Peak Time from Agent C]
  - **Today's Window:** [Specific timing for TODAY from Agent C]
  - **Success Indicator:** [Stat from Agent C]

  **\u26A1 ENGAGEMENT STRATEGY:**
  [Specific engagement velocity advice from Agent C]

  ---

  [Repeat the "READY-TO-POST" section for each subreddit]

  ---

  IMPORTANT:
  - Use your sub-agents for all research, writing, and timing - don't make things up.
  - Ensure the output flows logically from "Where to post" to "What to post" to "When to post".
  `,
  model: MODELS.ORCHESTRATOR,
  agents: { strategist, writer, cadenceAgent }
});

"use strict";
const getStrategyStep = createStep({
  id: "get-strategy",
  inputSchema: z.object({
    productName: z.string(),
    productDescription: z.string(),
    userGoal: z.string()
  }),
  outputSchema: z.object({
    strategyText: z.string(),
    recommendations: z.array(
      z.object({
        subreddit: z.string(),
        product: z.string(),
        framingStrategy: z.string(),
        rulesConstraints: z.string(),
        safetyRating: z.string()
      })
    )
  }),
  execute: async ({ inputData }) => {
    const { productName, productDescription, userGoal } = inputData;
    const prompt = `Product: ${productName}
Description: ${productDescription}
Goal: ${userGoal}`;
    const result = await strategist.generate(prompt);
    const strategyText = result.text || "";
    const copyPasteBlocks = strategyText.split("\u{1F4CB} COPY-PASTE FOR AGENT B");
    const recommendations = [];
    for (let i = 1; i < copyPasteBlocks.length; i++) {
      const block = copyPasteBlocks[i];
      const subredditMatch = block.match(/Subreddit:\s*(r\/\S+)/);
      const productMatch = block.match(/Product:\s*([^\n]+)/);
      const framingMatch = block.match(/Framing Strategy:\s*([^\n]+)/);
      const rulesMatch = block.match(/Rules Constraints:\s*([^\n]+)/);
      const safetyMatch = block.match(/Safety Rating:\s*(\w+)/);
      if (subredditMatch && productMatch && framingMatch && rulesMatch && safetyMatch) {
        recommendations.push({
          subreddit: subredditMatch[1].trim(),
          product: productMatch[1].trim(),
          framingStrategy: framingMatch[1].trim(),
          rulesConstraints: rulesMatch[1].trim(),
          safetyRating: safetyMatch[1].trim()
        });
      }
    }
    return {
      strategyText,
      recommendations
    };
  }
});
const generatePostsStep = createStep({
  id: "generate-posts",
  inputSchema: z.object({
    strategyText: z.string(),
    recommendations: z.array(
      z.object({
        subreddit: z.string(),
        product: z.string(),
        framingStrategy: z.string(),
        rulesConstraints: z.string(),
        safetyRating: z.string()
      })
    )
  }),
  outputSchema: z.object({
    strategyText: z.string(),
    posts: z.array(
      z.object({
        subreddit: z.string(),
        title: z.string(),
        body: z.string(),
        flair: z.string().optional(),
        safetyCheck: z.string()
      })
    )
  }),
  execute: async ({ inputData }) => {
    const { strategyText, recommendations } = inputData;
    const posts = [];
    for (const rec of recommendations) {
      const writerPrompt = `Subreddit: ${rec.subreddit}
Product: ${rec.product}
Framing Strategy: ${rec.framingStrategy}
Rules Constraints: ${rec.rulesConstraints}
Safety Rating: ${rec.safetyRating}`;
      const result = await writer.generate(writerPrompt);
      const postText = result.text || "";
      const titleMatch = postText.match(/\*\*Title:\*\*\s*\n([^\n]+)/);
      const bodyMatch = postText.match(/\*\*Body:\*\*\s*\n([\s\S]*?)\n\*\*Suggested Flair:/);
      const flairMatch = postText.match(/\*\*Suggested Flair:\*\*\s*\n([^\n]*)/);
      const safetyMatch = postText.match(/\*\*Safety Check:\*\*\s*\n([\s\S]*?)(?:\n\n|$)/);
      posts.push({
        subreddit: rec.subreddit,
        title: titleMatch ? titleMatch[1].trim() : "",
        body: bodyMatch ? bodyMatch[1].trim() : postText,
        flair: flairMatch ? flairMatch[1].trim() : void 0,
        safetyCheck: safetyMatch ? safetyMatch[1].trim() : "Unknown"
      });
    }
    return {
      strategyText,
      posts
    };
  }
});
const getCadenceStep = createStep({
  id: "get-cadence",
  inputSchema: z.object({
    strategyText: z.string(),
    posts: z.array(
      z.object({
        subreddit: z.string(),
        title: z.string(),
        body: z.string(),
        flair: z.string().optional(),
        safetyCheck: z.string()
      })
    )
  }),
  outputSchema: z.object({
    strategyText: z.string(),
    posts: z.array(
      z.object({
        subreddit: z.string(),
        title: z.string(),
        body: z.string(),
        flair: z.string().optional(),
        safetyCheck: z.string()
      })
    ),
    cadenceText: z.string()
  }),
  execute: async ({ inputData }) => {
    const { strategyText, posts } = inputData;
    const subreddits = posts.map((p) => p.subreddit).join(", ");
    const cadencePrompt = `Please determine the optimal posting schedule and cadence for these subreddits: ${subreddits}. Use your tools to analyze each one. Provide a cohesive campaign schedule.`;
    const result = await cadenceAgent.generate(cadencePrompt);
    return {
      strategyText,
      posts,
      cadenceText: result.text || ""
    };
  }
});
const redditCampaignWorkflow = createWorkflow({
  id: "reddit-campaign-workflow",
  inputSchema: z.object({
    productName: z.string().describe("Name of the product or service"),
    productDescription: z.string().describe("Brief description of what it does"),
    userGoal: z.string().describe("What you want to achieve (e.g., 'Get 5 alpha testers')")
  }),
  outputSchema: z.object({
    strategyText: z.string(),
    posts: z.array(
      z.object({
        subreddit: z.string(),
        title: z.string(),
        body: z.string(),
        flair: z.string().optional(),
        safetyCheck: z.string()
      })
    ),
    cadenceText: z.string()
  })
}).then(getStrategyStep).then(generatePostsStep).then(getCadenceStep);
redditCampaignWorkflow.commit();

"use strict";
const mastra = new Mastra({
  agents: {
    strategist,
    writer,
    campaignGenerator,
    cadenceAgent
  },
  workflows: {
    redditCampaignWorkflow
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

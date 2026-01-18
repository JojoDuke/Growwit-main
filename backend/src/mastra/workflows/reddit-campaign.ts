import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { strategist } from "../agents/s1_strategist";
import { writer } from "../agents/s2_writer";
import { cadenceAgent } from "../agents/s3_cadence";

// Step 1: Get strategy from Agent A
const getStrategyStep = createStep({
    id: "get-strategy",
    inputSchema: z.object({
        productName: z.string(),
        productDescription: z.string(),
        userGoal: z.string(),
    }),
    outputSchema: z.object({
        strategyText: z.string(),
        recommendations: z.array(
            z.object({
                subreddit: z.string(),
                product: z.string(),
                framingStrategy: z.string(),
                rulesConstraints: z.string(),
                safetyRating: z.string(),
            })
        ),
    }),
    execute: async ({ inputData }) => {
        const { productName, productDescription, userGoal } = inputData;

        // Call the strategist agent
        const prompt = `Product: ${productName}\nDescription: ${productDescription}\nGoal: ${userGoal}`;

        const result = await strategist.generate(prompt);

        const strategyText = result.text || "";

        // Parse the copy-paste blocks from the strategy output
        const copyPasteBlocks = strategyText.split("📋 COPY-PASTE FOR AGENT B");
        const recommendations = [];

        for (let i = 1; i < copyPasteBlocks.length; i++) {
            const block = copyPasteBlocks[i];

            // Extract fields using simple parsing
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
                    safetyRating: safetyMatch[1].trim(),
                });
            }
        }

        return {
            strategyText,
            recommendations,
        };
    },
});

// Step 2: Generate posts for each recommendation
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
                safetyRating: z.string(),
            })
        ),
    }),
    outputSchema: z.object({
        strategyText: z.string(),
        posts: z.array(
            z.object({
                subreddit: z.string(),
                title: z.string(),
                body: z.string(),
                flair: z.string().optional(),
                safetyCheck: z.string(),
            })
        ),
    }),
    execute: async ({ inputData }) => {
        const { strategyText, recommendations } = inputData;
        const posts = [];

        // Generate a post for each recommendation
        for (const rec of recommendations) {
            const writerPrompt = `Subreddit: ${rec.subreddit}
Product: ${rec.product}
Framing Strategy: ${rec.framingStrategy}
Rules Constraints: ${rec.rulesConstraints}
Safety Rating: ${rec.safetyRating}`;

            const result = await writer.generate(writerPrompt);

            const postText = result.text || "";

            // Parse the writer's output
            const titleMatch = postText.match(/\*\*Title:\*\*\s*\n([^\n]+)/);
            const bodyMatch = postText.match(/\*\*Body:\*\*\s*\n([\s\S]*?)\n\*\*Suggested Flair:/);
            const flairMatch = postText.match(/\*\*Suggested Flair:\*\*\s*\n([^\n]*)/);
            const safetyMatch = postText.match(/\*\*Safety Check:\*\*\s*\n([\s\S]*?)(?:\n\n|$)/);

            posts.push({
                subreddit: rec.subreddit,
                title: titleMatch ? titleMatch[1].trim() : "",
                body: bodyMatch ? bodyMatch[1].trim() : postText,
                flair: flairMatch ? flairMatch[1].trim() : undefined,
                safetyCheck: safetyMatch ? safetyMatch[1].trim() : "Unknown",
            });
        }

        return {
            strategyText,
            posts,
        };
    },
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
                safetyCheck: z.string(),
            })
        ),
    }),
    outputSchema: z.object({
        strategyText: z.string(),
        posts: z.array(
            z.object({
                subreddit: z.string(),
                title: z.string(),
                body: z.string(),
                flair: z.string().optional(),
                safetyCheck: z.string(),
            })
        ),
        cadenceText: z.string(),
    }),
    execute: async ({ inputData }) => {
        const { strategyText, posts } = inputData;

        const subreddits = posts.map(p => p.subreddit).join(", ");
        const cadencePrompt = `Please determine the optimal posting schedule and cadence for these subreddits: ${subreddits}. Use your tools to analyze each one. Provide a cohesive campaign schedule.`;

        const result = await cadenceAgent.generate(cadencePrompt);

        return {
            strategyText,
            posts,
            cadenceText: result.text || "",
        };
    },
});

// Create the workflow
export const redditCampaignWorkflow = createWorkflow({
    id: "reddit-campaign-workflow",
    inputSchema: z.object({
        productName: z.string().describe("Name of the product or service"),
        productDescription: z.string().describe("Brief description of what it does"),
        userGoal: z.string().describe("What you want to achieve (e.g., 'Get 5 alpha testers')"),
    }),
    outputSchema: z.object({
        strategyText: z.string(),
        posts: z.array(
            z.object({
                subreddit: z.string(),
                title: z.string(),
                body: z.string(),
                flair: z.string().optional(),
                safetyCheck: z.string(),
            })
        ),
        cadenceText: z.string(),
    }),
})
    .then(getStrategyStep)
    .then(generatePostsStep)
    .then(getCadenceStep);

redditCampaignWorkflow.commit();

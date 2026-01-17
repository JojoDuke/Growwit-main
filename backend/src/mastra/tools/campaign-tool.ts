import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const runCampaignTool = createTool({
    id: "run-campaign-tool",
    description: "Generate a complete Reddit marketing campaign with strategy and post drafts",
    inputSchema: z.object({
        productName: z.string().describe("Name of the product or service"),
        productDescription: z.string().describe("Brief description of what it does"),
        userGoal: z.string().describe("What you want to achieve"),
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
    execute: async ({ context, mastra }) => {
        if (!mastra) {
            throw new Error("Mastra instance is required to run workflow");
        }

        const { productName, productDescription, userGoal } = context;

        if (!productName || !productDescription || !userGoal) {
            throw new Error("Missing required fields: productName, productDescription, or userGoal");
        }

        // Get the workflow from the mastra instance
        const workflow = mastra.getWorkflow('reddit-campaign-workflow');

        // Execute the workflow
        const run = await workflow.createRunAsync();
        const result = await run.start({
            inputData: {
                productName,
                productDescription,
                userGoal,
            },
        });

        if (result.status === 'success') {
            return result.result;
        } else if (result.status === 'failed') {
            throw new Error(`Workflow failed: ${result.error}`);
        } else {
            throw new Error('Workflow suspended unexpectedly');
        }
    },
});

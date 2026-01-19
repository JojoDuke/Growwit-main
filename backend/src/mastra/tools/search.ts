import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const searchTool = createTool({
    id: "search-tool",
    description: "Search the web for real-time information using Tavily",
    inputSchema: z.object({
        query: z.string().describe("The search query to look up on the web"),
    }),
    outputSchema: z.object({
        results: z.array(
            z.object({
                title: z.string(),
                url: z.string(),
                content: z.string(),
            })
        ),
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
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
                body: JSON.stringify({
                    api_key: apiKey,
                    query,
                    search_depth: "advanced",
                    include_images: false,
                    include_answer: false,
                    max_results: 5,
                }),
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Tavily API error: ${error}`);
            }

            const data = await response.json();

            return {
                results: data.results.map((r: any) => ({
                    title: r.title,
                    url: r.url,
                    content: r.content,
                })),
            };
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error("Search tool timed out after 15 seconds");
            }
            throw error;
        }
    },
});

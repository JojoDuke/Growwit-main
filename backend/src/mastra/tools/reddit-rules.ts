import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const redditRulesTool = createTool({
    id: "reddit-rules-tool",
    description: "Fetch the actual rules, description, and policies for any subreddit directly from Reddit",
    inputSchema: z.object({
        subreddit: z.string().describe("The subreddit name (without r/ prefix, e.g., 'SideProject')"),
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
                violation_reason: z.string().optional(),
            })
        ),
        allowedPostTypes: z.object({
            text: z.boolean(),
            images: z.boolean(),
            links: z.boolean(),
            videos: z.boolean(),
        }),
        fetchError: z.string().optional(),
    }),
    execute: async ({ subreddit }) => {
        if (!subreddit) {
            throw new Error("No subreddit name provided to tool");
        }
        const cleanSubreddit = subreddit.replace(/^r\//, '').trim();
        console.log(`🔍 Reddit Rules: Scouting r/${cleanSubreddit}`);

        try {
            // Fetch subreddit info
            const aboutUrl = `https://www.reddit.com/r/${cleanSubreddit}/about.json`;
            const aboutResponse = await fetch(
                aboutUrl,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                        'Referer': 'https://www.reddit.com/'
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
                        videos: false,
                    },
                    fetchError: `Subreddit not found or private (HTTP ${aboutResponse.status})`,
                };
            }

            const aboutData = await aboutResponse.json();
            const data = aboutData.data;

            // Fetch rules
            const rulesResponse = await fetch(
                `https://www.reddit.com/r/${cleanSubreddit}/about/rules.json`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                        'Referer': 'https://www.reddit.com/'
                    }
                }
            );

            let rules: any[] = [];
            if (rulesResponse.ok) {
                const rulesData = await rulesResponse.json();
                rules = rulesData.rules || [];
            }

            return {
                subreddit: data.display_name,
                title: data.title,
                description: data.public_description || data.description || "",
                subscribers: data.subscribers || 0,
                rules: rules.map((rule: any) => ({
                    short_name: rule.short_name || "Rule",
                    description: rule.description || rule.violation_reason || "No description provided",
                    violation_reason: rule.violation_reason || undefined,
                })),
                allowedPostTypes: {
                    text: !!data.restrict_posting === false,
                    images: data.allow_images !== false,
                    links: data.allow_links !== false,
                    videos: data.allow_videos !== false,
                },
                fetchError: undefined,
            };

        } catch (error: any) {
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
                    videos: false,
                },
                fetchError: `Failed to fetch data: ${error.message}`,
            };
        }
    },
});

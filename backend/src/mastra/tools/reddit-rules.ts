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
        error: z.string().optional(),
    }),
    execute: async (args: any) => {
        // Handle variations in Mastra Beta versions for input access
        const subreddit = args.context?.subreddit || args.subreddit || args?.triggerArgs?.subreddit;

        if (!subreddit) {
            throw new Error("No subreddit name provided to tool");
        }

        try {
            // Fetch subreddit info
            const aboutResponse = await fetch(
                `https://www.reddit.com/r/${subreddit}/about.json`,
                {
                    headers: {
                        'User-Agent': 'Growwit-Research-Bot/1.0'
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
                    error: `Subreddit not found or private (HTTP ${aboutResponse.status})`,
                };
            }

            const aboutData = await aboutResponse.json();
            const data = aboutData.data;

            // Fetch rules
            const rulesResponse = await fetch(
                `https://www.reddit.com/r/${subreddit}/about/rules.json`,
                {
                    headers: {
                        'User-Agent': 'Growwit-Research-Bot/1.0'
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
                    short_name: rule.short_name,
                    description: rule.description || rule.violation_reason || "",
                    violation_reason: rule.violation_reason,
                })),
                allowedPostTypes: {
                    text: !data.restrict_posting,
                    images: data.allow_images !== false,
                    links: data.allow_links !== false,
                    videos: data.allow_videos !== false,
                },
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
                error: `Failed to fetch data: ${error.message}`,
            };
        }
    },
});

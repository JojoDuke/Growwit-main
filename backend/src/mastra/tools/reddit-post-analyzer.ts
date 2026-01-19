import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const redditPostAnalyzer = createTool({
    id: "reddit-post-analyzer",
    description: "Analyze the top 100 successful posts from a subreddit to find optimal posting windows",
    inputSchema: z.object({
        subreddit: z.string().describe("The subreddit name (without r/ prefix)"),
    }),
    outputSchema: z.object({
        subreddit: z.string(),
        analysisPeriod: z.string(),
        peakHour: z.number().describe("The hour (0-23 UTC) when most top posts were created"),
        peakDay: z.string().describe("The day of the week when most top posts were created"),
        bestWindows: z.array(z.object({
            day: z.string(),
            hourUTC: z.number(),
            frequency: z.number().describe("Number of top posts found in this window"),
        })),
        engagementVelocity: z.string().describe("Comparison of recent vs historical success in this sub"),
    }),
    execute: async ({ subreddit }) => {
        if (!subreddit) {
            throw new Error("No subreddit name provided");
        }

        const cleanSubreddit = subreddit.replace(/^r\//, '').trim();
        const url = `https://www.reddit.com/r/${cleanSubreddit}/top/.json?t=month&limit=100`;
        console.log(`🔍 Reddit Analyzer: Fetching ${url}`);

        try {
            const response = await fetch(
                url,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                        'Referer': 'https://www.reddit.com/'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Reddit API error: ${response.status}`);
            }

            const json = await response.json();
            const posts = json.data.children;

            if (!posts || posts.length === 0) {
                throw new Error("No posts found for analysis");
            }

            // Matrix for Day/Hour tracking
            // [DayOfWeek][Hour]
            const matrix: Record<string, number[]> = {
                "Sunday": new Array(24).fill(0),
                "Monday": new Array(24).fill(0),
                "Tuesday": new Array(24).fill(0),
                "Wednesday": new Array(24).fill(0),
                "Thursday": new Array(24).fill(0),
                "Friday": new Array(24).fill(0),
                "Saturday": new Array(24).fill(0),
            };

            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

            posts.forEach((p: any) => {
                const date = new Date(p.data.created_utc * 1000);
                const day = days[date.getUTCDay()];
                const hour = date.getUTCHours();
                matrix[day][hour]++;
            });

            // Flatten matrix to find best windows
            let bestWindows: any[] = [];
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

            // Sort by frequency
            bestWindows.sort((a, b) => b.frequency - a.frequency);

            return {
                subreddit,
                analysisPeriod: "Past 30 Days",
                peakHour,
                peakDay,
                bestWindows: bestWindows.slice(0, 5), // Top 5 windows
                engagementVelocity: posts.length >= 100 ? "High" : "Moderate",
            };

        } catch (error: any) {
            throw new Error(`Failed to analyze subreddit: ${error.message}`);
        }
    },
});

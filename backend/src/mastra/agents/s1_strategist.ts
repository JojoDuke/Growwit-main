import { Agent } from "@mastra/core/agent";

export const strategist = new Agent({
  id: "strategist",
  name: "Strategist",
  instructions: "You are a helpful assistant",
  model: "openai/gpt-4o-mini",
});
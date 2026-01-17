import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability } from '@mastra/observability';

import { strategist } from './agents/s1_strategist';
import { writer } from './agents/s2_writer';
import { cadenceAgent } from './agents/s3_cadence';
import { campaignGenerator } from './agents/orchestrator';
import { redditCampaignWorkflow } from './workflows/reddit-campaign';



export const mastra = new Mastra({
  agents: {
    strategist,
    writer,
    campaignGenerator,
    cadenceAgent,
  },
  workflows: {
    redditCampaignWorkflow,
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    // Enables DefaultExporter and CloudExporter for tracing
    default: { enabled: true },
  }),
});

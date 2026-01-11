import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Campaign, Action } from '@/types';

interface SafetyRules {
  maxPostsPerAccountPerDay: number;
  maxCommentsPerHour: number;
  minTimeBetweenActions: number;
  subredditCooldownDays: number;
  commentToPostRatio: {
    min: number;
    max: number;
  };
}

interface SafetyMetrics {
  todayPosts: Record<string, number>;
  accountCommentToPostRatio: Record<string, { comments: number; posts: number }>;
  subredditLastPosted: Record<string, string>;
}

interface CampaignContextType {
  campaigns: Campaign[];
  actions: Action[];
  safetyRules: SafetyRules;
  safetyMetrics: SafetyMetrics;
  isLoading: boolean;
  addCampaign: (campaign: Campaign) => Promise<void>;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  completeAction: (actionId: string) => Promise<void>;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

// Default values for MVP
const defaultSafetyRules: SafetyRules = {
  maxPostsPerAccountPerDay: 1,
  maxCommentsPerHour: 5,
  minTimeBetweenActions: 30,
  subredditCooldownDays: 7,
  commentToPostRatio: {
    min: 2,
    max: 5,
  },
};

const defaultSafetyMetrics: SafetyMetrics = {
  todayPosts: {},
  accountCommentToPostRatio: {},
  subredditLastPosted: {},
};

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateActionData = (campaign: Campaign, subreddit: string) => {
    const templates = {
      discussion: [
        {
          title: `How do you handle ${campaign.product} in your workflow?`,
          content: `I've been thinking a lot about ${campaign.product} lately. Does anyone have experience with this?\n\nSpecifically interested in how it affects ${campaign.targetAudience || "daily operations"}.`
        },
        {
          title: `The biggest challenge with ${campaign.targetAudience || "this field"} is...`,
          content: `In my experience, most people struggle with the ${campaign.product} aspect of things. I'm curious to hear how others are solving this?`
        },
        {
          title: `A quick question for those using ${campaign.product} tools`,
          content: `I'm trying to optimize my setup for ${campaign.targetAudience || "productivity"}. What are your go-to strategies?`
        }
      ],
      dms: [
        {
          title: `Anyone else struggling with ${campaign.targetAudience || "this"}?`,
          content: `Found a weird pattern while working on ${campaign.product}. Wondering if anyone else has seen this?\n\nHappy to share more details via DM if you're dealing with the same thing.`,
          cta: "Feel free to DM me to compare notes."
        }
      ],
      profile: [
        {
          title: `Finally solved the ${campaign.product} problem`,
          content: `It took a few weeks of iterating, but I finally found a way to handle ${campaign.targetAudience || "technical"} debt in this area. Just wanted to share the win!`,
        }
      ]
    };

    const goalTemplates = templates[campaign.goal as keyof typeof templates] || templates.discussion;
    return goalTemplates[Math.floor(Math.random() * goalTemplates.length)];
  };

  const generateInitialActions = (campaign: Campaign): Action[] => {
    const subreddits = ["startups", "indiehackers", "saas", "entrepreneur", "SideProject", "selfhosted"];
    const now = new Date();
    const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
    const actionData = generateActionData(campaign, subreddit);

    return [
      {
        id: `action-${Date.now()}-1`,
        campaignId: campaign.id,
        accountId: campaign.accounts[0].id,
        type: "post",
        status: "pending",
        subreddit: subreddit,
        title: actionData.title,
        content: actionData.content,
        cta: (actionData as any).cta,
        scheduledFor: now.toISOString(),
      }
    ];
  };

  const scheduleNextAction = (campaignId: string, lastAction: Action) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const subreddits = ["startups", "indiehackers", "saas", "entrepreneur", "SideProject", "selfhosted"];
    const nextSubreddit = subreddits.find(s => s !== lastAction.subreddit) || subreddits[0];

    // Rotate accounts if more than one exists
    const currentAccountIdx = campaign.accounts.findIndex(acc => acc.id === lastAction.accountId);
    const nextAccount = campaign.accounts[(currentAccountIdx + 1) % campaign.accounts.length];

    // Schedule for 24 hours later
    const nextDate = new Date();
    nextDate.setHours(nextDate.getHours() + 24);

    const actionData = generateActionData(campaign, nextSubreddit);

    const nextAction: Action = {
      id: `action-${Date.now()}-next`,
      campaignId: campaign.id,
      accountId: nextAccount.id,
      type: "post",
      status: "pending",
      subreddit: nextSubreddit,
      title: actionData.title,
      content: actionData.content,
      cta: (actionData as any).cta,
      scheduledFor: nextDate.toISOString(),
    };

    setActions(prev => [...prev, nextAction]);
  };

  const addCampaign = async (campaign: Campaign) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const initialActions = generateInitialActions(campaign);

    setCampaigns(prev => [...prev, { ...campaign, status: "active" }]);
    setActions(prev => [...prev, ...initialActions]);
    setIsLoading(false);
  };

  const completeAction = async (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    setActions(prev => prev.map(a =>
      a.id === actionId
        ? { ...a, status: "completed", completedAt: new Date().toISOString() }
        : a
    ));

    // Schedule the next one automatically
    scheduleNextAction(action.campaignId, action);
  };

  const updateCampaign = async (campaignId: string, updates: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, ...updates } : c
    ));
  };

  const deleteCampaign = async (campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    setActions(prev => prev.filter(a => a.campaignId !== campaignId));
  };

  const value: CampaignContextType = {
    campaigns,
    actions,
    safetyRules: defaultSafetyRules,
    safetyMetrics: defaultSafetyMetrics,
    isLoading,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    completeAction,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaigns() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaigns must be used within a CampaignProvider');
  }
  return context;
}


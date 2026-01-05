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
  const [isLoading, setIsLoading] = useState(false);

  const addCampaign = async (campaign: Campaign) => {
    setIsLoading(true);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));
    setCampaigns(prev => [...prev, campaign]);
    setIsLoading(false);
  };

  const value: CampaignContextType = {
    campaigns,
    actions: [],
    safetyRules: defaultSafetyRules,
    safetyMetrics: defaultSafetyMetrics,
    isLoading,
    addCampaign,
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


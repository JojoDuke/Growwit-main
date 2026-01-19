export interface Account {
  id: string;
  name: string;
  karma: number;
  accountAge: number; // in days
}

export interface Campaign {
  id: string;
  name: string;
  product: string;
  goal: 'discussion' | 'dms' | 'profile' | 'traffic' | 'calls';
  accounts: Account[];
  postsPerMonth: number;
  commentsPerDay: { min: number; max: number };
  createdAt: string;
  status: 'active' | 'draft' | 'paused';
}

export interface Action {
  id: string;
  campaignId: string;
  accountId: string;
  type: 'post' | 'comment';
  status: 'pending' | 'completed' | 'skipped';
  subreddit: string;
  title?: string;
  content?: string;
  cta?: string;
  scheduledFor?: string;
  completedAt?: string;
}



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
  goal: 'users' | 'clients' | 'feedback' | 'awareness' | 'dms' | 'profile' | 'traffic';
  targetAudience?: string;
  accounts: Account[];
  postsPerMonth: number;
  commentsPerDay: { min: number; max: number };
  createdAt: string;
  status: 'active' | 'draft' | 'paused';
}

export interface Action {
  id: string;
  campaignId: string;
  type: 'post' | 'comment';
  status: 'pending' | 'completed' | 'skipped';
  subreddit: string;
  content?: string;
  scheduledFor?: string;
  completedAt?: string;
}


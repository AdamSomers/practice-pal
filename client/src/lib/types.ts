export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export type StudioRole = 'owner' | 'editor' | 'viewer';

export interface Studio {
  id: string;
  name: string;
  instrument: string | null;
  ownerId: string;
  rewardCategories?: string[];
  createdAt: string;
  role?: StudioRole;
}

export interface StudioMembership {
  id: string;
  studioId: string;
  userId: string;
  role: StudioRole;
  invitedBy: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

export interface Member extends User {
  role: StudioRole;
  acceptedAt: string | null;
  membershipId: string;
}

export type ChartCategory =
  | 'scales'
  | 'arpeggios'
  | 'cadences'
  | 'repertoire'
  | 'sight_reading'
  | 'theory'
  | 'other';

export interface ChartItemConfig {
  label?: string;
  key?: string;
  type?: string;
  modifiers?: string[];
  notes?: string;
  bpm?: number;
  piece?: string;
  composer?: string;
  movement?: string;
  measures?: string;
  description?: string;
  practiceMode?: 'entire' | 'sections';
  sectionCount?: number;
  sectionsRepsEach?: number;
  sectionLabels?: string[];
  [key: string]: unknown;
}

export interface ChartItem {
  id: string;
  chartId: string;
  category: ChartCategory;
  sortOrder: number;
  config: ChartItemConfig;
  repetitions: number;
}

export interface PracticeChart {
  id: string;
  studioId: string;
  title: string;
  createdBy: string;
  minimumPracticeMinutes: number;
  createdAt: string;
  updatedAt: string;
  items?: ChartItem[];
  itemCount?: number;
  sessionCount?: number;
}

export interface PracticeSession {
  id: string;
  chartId: string;
  userId: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  timerTargetSeconds: number;
  chart?: PracticeChart;
  checkoffs?: SessionCheckoff[];
}

export interface SessionCheckoff {
  id: string;
  sessionId: string;
  chartItemId: string;
  repetitionNumber: number;
  checkedAt: string;
}

export interface MasteredItem {
  id: string;
  studioId: string;
  category: ChartCategory;
  description: string;
  masteredAt: string;
  recordingId: string | null;
}

export interface ProgressStats {
  totalPracticeMinutes: number;
  sessionCount: number;
  currentStreak: number;
  weeklyData: WeeklyDataPoint[];
}

export interface WeeklyDataPoint {
  day: string;
  minutes: number;
}

export interface RepertoirePiece {
  piece: string;
  composer: string | null;
  lastUsed: string;
}

export interface SessionReward {
  id: string;
  sessionId: string;
  studioId: string;
  userId: string;
  emoji: string;
  category: string;
  earnedAt: string;
}

export interface CustomReward {
  id: string;
  studioId: string;
  createdBy: string;
  title: string;
  emoji: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  studioId: string;
  createdBy: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  rewardType: 'emoji' | 'custom';
  rewardEmoji: string | null;
  customRewardId: string | null;
  customRewardTitle: string | null;
  completedAt: string | null;
  completedBy: string | null;
  createdAt: string;
}

export interface Invitation {
  id: string;
  studioId: string;
  studioName: string;
  role: StudioRole;
  invitedBy: string;
  createdAt: string;
}

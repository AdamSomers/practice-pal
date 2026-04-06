import type {
  User,
  Studio,
  Member,
  PracticeChart,
  ChartItem,
  PracticeSession,
  SessionCheckoff,
  MasteredItem,
  ProgressStats,
  Invitation,
  RepertoirePiece,
  StudioRole,
  ChartCategory,
  ChartItemConfig,
  SessionReward,
  CustomReward,
  Goal,
} from './types';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    // On 401, only redirect for GET requests (page loads).
    // For mutations (POST/PATCH/DELETE), let the error propagate so the
    // caller can show an error without losing unsaved work.
    if (res.status === 401 && !path.startsWith('/auth/')) {
      const method = (options.method || 'GET').toUpperCase();
      if (method === 'GET') {
        window.location.href = '/login';
      }
    }
    throw new ApiError(res.status, body.error || res.statusText);
  }

  return res.json();
}

const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Auth
export const testLogin = (mockUserId: string) =>
  api.post<User>('/auth/test-login', { mock_user_id: mockUserId });

export const getMe = () => api.get<User>('/auth/me');

export const logout = () => api.post<{ success: boolean }>('/auth/logout');

// Studios
export const getStudios = () => api.get<Studio[]>('/studios');

export const createStudio = (data: { name: string; instrument?: string }) =>
  api.post<Studio>('/studios', data);

export const getStudio = (id: string) => api.get<Studio>(`/studios/${id}`);

export const updateStudio = (id: string, data: { name?: string; instrument?: string; rewardCategories?: string[] }) =>
  api.patch<Studio>(`/studios/${id}`, data);

export const deleteStudio = (id: string) =>
  api.delete<{ success: boolean }>(`/studios/${id}`);

// Members
export const getMembers = (studioId: string) =>
  api.get<Member[]>(`/studios/${studioId}/members`);

export const inviteMember = (studioId: string, data: { email: string; role: StudioRole }) =>
  api.post<unknown>(`/studios/${studioId}/members`, data);

export const changeMemberRole = (studioId: string, userId: string, role: StudioRole) =>
  api.patch<unknown>(`/studios/${studioId}/members/${userId}`, { role });

export const removeMember = (studioId: string, userId: string) =>
  api.delete<{ success: boolean }>(`/studios/${studioId}/members/${userId}`);

export const acceptInvitation = (studioId: string) =>
  api.post<unknown>(`/studios/${studioId}/members/accept`);

export const getInvitations = () => api.get<Invitation[]>('/studios/invitations');

// Charts — backend mounts charts router at /api/charts
export const getCharts = (studioId: string) =>
  api.get<PracticeChart[]>(`/charts?studioId=${studioId}`);

export const getChart = (chartId: string) =>
  api.get<PracticeChart & { items: ChartItem[] }>(`/charts/${chartId}`);

export const createChart = (
  studioId: string,
  data: {
    title: string;
    minimumPracticeMinutes: number;
    items: Array<{
      category: ChartCategory;
      sortOrder: number;
      config: ChartItemConfig;
      repetitions: number;
    }>;
  }
) => api.post<PracticeChart>('/charts', { ...data, studioId });

export const updateChart = (
  chartId: string,
  data: {
    title?: string;
    minimumPracticeMinutes?: number;
    items?: Array<{
      id?: string;
      category: ChartCategory;
      sortOrder: number;
      config: ChartItemConfig;
      repetitions: number;
    }>;
  }
) => api.patch<PracticeChart>(`/charts/${chartId}`, data);

export const deleteChart = (chartId: string) =>
  api.delete<{ success: boolean }>(`/charts/${chartId}`);

export const duplicateChart = (chartId: string) =>
  api.post<PracticeChart>(`/charts/${chartId}/duplicate`);

export const getRepertoirePieces = (studioId: string) =>
  api.get<RepertoirePiece[]>(`/charts/repertoire-pieces?studioId=${studioId}`);

// Sessions — backend mounts sessions router at /api/sessions
export const startSession = (chartId: string) =>
  api.post<PracticeSession>('/sessions', { chartId });

export const getSession = (sessionId: string) =>
  api.get<PracticeSession & { checkoffs: SessionCheckoff[] }>(`/sessions/${sessionId}`);

export const checkoffItem = (sessionId: string, data: { chartItemId: string; repetitionNumber: number }) =>
  api.post<SessionCheckoff>(`/sessions/${sessionId}/checkoffs`, data);

export const uncheckItem = (sessionId: string, checkoffId: string) =>
  api.delete<{ success: boolean }>(`/sessions/${sessionId}/checkoffs/${checkoffId}`);

export const completeSession = (sessionId: string, durationSeconds: number) =>
  api.patch<PracticeSession>(`/sessions/${sessionId}`, { completedAt: new Date().toISOString(), durationSeconds });

// Progress — backend mounts progress router at /api/progress
export const getSessions = (studioId: string) =>
  api.get<PracticeSession[]>(`/progress/studios/${studioId}/sessions`);

export const getProgress = (studioId: string) =>
  api.get<ProgressStats>(`/progress/studios/${studioId}`);

// Mastery
export const getMasteredItems = (studioId: string) =>
  api.get<MasteredItem[]>(`/progress/studios/${studioId}/mastery`);

export const addMasteredItem = (
  studioId: string,
  data: { category: ChartCategory; description: string; masteredAt: string }
) => api.post<MasteredItem>(`/progress/studios/${studioId}/mastery`, data);

// Session Rewards
export const claimSessionReward = (sessionId: string) =>
  api.post<SessionReward>(`/sessions/${sessionId}/reward`);

export const getSessionRewards = (studioId: string) =>
  api.get<SessionReward[]>(`/progress/studios/${studioId}/rewards`);

// Custom Rewards
export const getCustomRewards = (studioId: string) =>
  api.get<CustomReward[]>(`/rewards?studioId=${studioId}`);

export const createCustomReward = (data: { studioId: string; title: string; emoji?: string }) =>
  api.post<CustomReward>('/rewards', data);

export const deleteCustomReward = (id: string) =>
  api.delete<{ success: boolean }>(`/rewards/${id}`);

// Goals
export const getGoals = (studioId: string, status?: 'active' | 'completed' | 'all') =>
  api.get<Goal[]>(`/goals?studioId=${studioId}${status ? `&status=${status}` : ''}`);

export const createGoal = (data: {
  studioId: string;
  title: string;
  description?: string;
  targetDate?: string;
  rewardType?: 'emoji' | 'custom';
  rewardEmoji?: string;
  customRewardId?: string;
  customRewardTitle?: string;
}) => api.post<Goal>('/goals', data);

export const updateGoal = (id: string, data: Partial<{
  title: string;
  description: string;
  targetDate: string;
  rewardType: 'emoji' | 'custom';
  rewardEmoji: string;
  customRewardId: string;
  customRewardTitle: string;
}>) => api.patch<Goal>(`/goals/${id}`, data);

export const completeGoal = (id: string) =>
  api.post<Goal>(`/goals/${id}/complete`);

export const deleteGoal = (id: string) =>
  api.delete<{ success: boolean }>(`/goals/${id}`);

export { api, ApiError };

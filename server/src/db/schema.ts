import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum, boolean, date } from 'drizzle-orm/pg-core';

export const studioRoleEnum = pgEnum('studio_role', ['owner', 'editor', 'viewer']);
export const recordingTypeEnum = pgEnum('recording_type', ['file_upload', 'youtube_link']);
export const chartCategoryEnum = pgEnum('chart_category', [
  'scales', 'arpeggios', 'cadences', 'repertoire', 'sight_reading', 'theory', 'technique', 'other'
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studios = pgTable('studios', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  instrument: text('instrument'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  rewardCategories: jsonb('reward_categories').notNull().default('["animals","music","food"]'),
  progressTimeRange: text('progress_time_range'),
  allowPausing: boolean('allow_pausing').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studioMemberships = pgTable('studio_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: studioRoleEnum('role').notNull(),
  invitedBy: uuid('invited_by').references(() => users.id),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const practiceCharts = pgTable('practice_charts', {
  id: uuid('id').primaryKey().defaultRandom(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  minimumPracticeMinutes: integer('minimum_practice_minutes').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const chartItems = pgTable('chart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  chartId: uuid('chart_id').notNull().references(() => practiceCharts.id, { onDelete: 'cascade' }),
  category: chartCategoryEnum('category').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  config: jsonb('config').notNull(),
  repetitions: integer('repetitions').notNull().default(5),
});

export const practiceSessions = pgTable('practice_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  chartId: uuid('chart_id').notNull().references(() => practiceCharts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  durationSeconds: integer('duration_seconds'),
  timerTargetSeconds: integer('timer_target_seconds').notNull(),
});

export const sessionCheckoffs = pgTable('session_checkoffs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => practiceSessions.id, { onDelete: 'cascade' }),
  chartItemId: uuid('chart_item_id').notNull().references(() => chartItems.id, { onDelete: 'cascade' }),
  repetitionNumber: integer('repetition_number').notNull(),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
});

export const performanceRecordings = pgTable('performance_recordings', {
  id: uuid('id').primaryKey().defaultRandom(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  chartItemId: uuid('chart_item_id').references(() => chartItems.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: recordingTypeEnum('type').notNull(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  notes: text('notes'),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export const sessionRewards = pgTable('session_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => practiceSessions.id, { onDelete: 'cascade' }),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  emoji: text('emoji').notNull(),
  category: text('category').notNull(),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
});

export const customRewards = pgTable('custom_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  title: text('title').notNull(),
  emoji: text('emoji'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  targetDate: date('target_date'),
  rewardType: text('reward_type').notNull().default('emoji'),
  rewardEmoji: text('reward_emoji'),
  customRewardId: uuid('custom_reward_id').references(() => customRewards.id, { onDelete: 'set null' }),
  customRewardTitle: text('custom_reward_title'),
  completedAt: timestamp('completed_at'),
  completedBy: uuid('completed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const masteredItems = pgTable('mastered_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  category: chartCategoryEnum('category').notNull(),
  description: text('description').notNull(),
  masteredAt: date('mastered_at').notNull(),
  recordingId: uuid('recording_id').references(() => performanceRecordings.id),
});

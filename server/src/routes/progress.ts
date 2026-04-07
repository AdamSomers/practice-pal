import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { verifyMembership } from './studios.js';

export const progressRouter = Router();

// Aggregate progress for a studio
progressRouter.get('/studios/:studioId', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { studioId } = req.params;

    const membership = await verifyMembership(userId, studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    // Get charts for this studio to filter sessions
    const charts = await db.select({ id: schema.practiceCharts.id })
      .from(schema.practiceCharts)
      .where(eq(schema.practiceCharts.studioId, studioId));

    if (charts.length === 0) {
      res.json({ totalSeconds: 0, sessionCount: 0, weeklyData: [] });
      return;
    }

    const chartIds = charts.map(c => c.id);

    // Total time and session count
    const [totals] = await db.select({
      totalSeconds: sql<number>`coalesce(sum(${schema.practiceSessions.durationSeconds}), 0)`,
      sessionCount: sql<number>`count(*)`,
    })
      .from(schema.practiceSessions)
      .where(and(
        inArray(schema.practiceSessions.chartId, chartIds),
        eq(schema.practiceSessions.userId, userId),
        sql`${schema.practiceSessions.completedAt} IS NOT NULL`
      ));

    // Daily data for current week (Mon-Sun)
    const dailyData = await db.select({
      day: sql<string>`to_char(${schema.practiceSessions.completedAt}, 'Dy')`,
      totalSeconds: sql<number>`coalesce(sum(${schema.practiceSessions.durationSeconds}), 0)`,
    })
      .from(schema.practiceSessions)
      .where(and(
        inArray(schema.practiceSessions.chartId, chartIds),
        eq(schema.practiceSessions.userId, userId),
        sql`${schema.practiceSessions.completedAt} IS NOT NULL`,
        sql`${schema.practiceSessions.completedAt} >= date_trunc('week', now())`
      ))
      .groupBy(sql`to_char(${schema.practiceSessions.completedAt}, 'Dy')`)
      .orderBy(sql`min(${schema.practiceSessions.completedAt})`);

    // Calculate streak (consecutive days with practice)
    const recentDays = await db.select({
      day: sql<string>`to_char(date(${schema.practiceSessions.completedAt}), 'YYYY-MM-DD')`,
    })
      .from(schema.practiceSessions)
      .where(and(
        inArray(schema.practiceSessions.chartId, chartIds),
        eq(schema.practiceSessions.userId, userId),
        sql`${schema.practiceSessions.completedAt} IS NOT NULL`
      ))
      .groupBy(sql`date(${schema.practiceSessions.completedAt})`)
      .orderBy(sql`date(${schema.practiceSessions.completedAt}) DESC`);

    let currentStreak = 0;
    if (recentDays.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Streak counts if most recent practice was today or yesterday
      const mostRecent = recentDays[0].day;
      if (mostRecent === todayStr || mostRecent === yesterdayStr) {
        const startDate = mostRecent === todayStr ? today : yesterday;
        for (let i = 0; i < recentDays.length; i++) {
          const expected = new Date(startDate);
          expected.setDate(expected.getDate() - i);
          const expectedStr = expected.toISOString().split('T')[0];
          if (recentDays[i].day === expectedStr) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Build weeklyData in frontend format
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = dayNames.map(day => {
      const match = dailyData.find(d => d.day === day);
      return { day, minutes: match ? Math.round(Number(match.totalSeconds) / 60) : 0 };
    });

    res.json({
      totalPracticeMinutes: Math.round(Number(totals.totalSeconds) / 60),
      sessionCount: Number(totals.sessionCount),
      currentStreak,
      weeklyData,
    });
  } catch (err) {
    console.error('progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Session history for a studio
progressRouter.get('/studios/:studioId/sessions', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { studioId } = req.params;

    const membership = await verifyMembership(userId, studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const sessions = await db.select({
      session: schema.practiceSessions,
      chartTitle: schema.practiceCharts.title,
    })
      .from(schema.practiceSessions)
      .innerJoin(schema.practiceCharts, eq(schema.practiceSessions.chartId, schema.practiceCharts.id))
      .where(and(
        eq(schema.practiceCharts.studioId, studioId),
        eq(schema.practiceSessions.userId, userId)
      ))
      .orderBy(desc(schema.practiceSessions.startedAt));

    res.json(sessions.map(s => ({ ...s.session, chartTitle: s.chartTitle })));
  } catch (err) {
    console.error('session history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rewards for a studio
progressRouter.get('/studios/:studioId/rewards', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { studioId } = req.params;

    const membership = await verifyMembership(userId, studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const rewards = await db.select()
      .from(schema.sessionRewards)
      .where(and(
        eq(schema.sessionRewards.studioId, studioId),
        eq(schema.sessionRewards.userId, userId)
      ))
      .orderBy(desc(schema.sessionRewards.earnedAt));

    res.json(rewards);
  } catch (err) {
    console.error('rewards error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mastery log for a studio
progressRouter.get('/studios/:studioId/mastery', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { studioId } = req.params;

    const membership = await verifyMembership(userId, studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const items = await db.select()
      .from(schema.masteredItems)
      .where(eq(schema.masteredItems.studioId, studioId))
      .orderBy(desc(schema.masteredItems.masteredAt));

    res.json(items);
  } catch (err) {
    console.error('mastery log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add mastered item
progressRouter.post('/studios/:studioId/mastery', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { studioId } = req.params;

    const membership = await verifyMembership(userId, studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const { category, description, masteredAt, recordingId } = req.body;
    if (!category || !description || !masteredAt) {
      res.status(400).json({ error: 'category, description, and masteredAt are required' });
      return;
    }

    const [item] = await db.insert(schema.masteredItems).values({
      studioId,
      category,
      description,
      masteredAt,
      recordingId: recordingId || null,
    }).returning();

    res.status(201).json(item);
  } catch (err) {
    console.error('add mastered item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update mastered item
progressRouter.patch('/mastery/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [item] = await db.select().from(schema.masteredItems).where(eq(schema.masteredItems.id, req.params.id));
    if (!item) {
      res.status(404).json({ error: 'Mastered item not found' });
      return;
    }

    const membership = await verifyMembership(userId, item.studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const { category, description, masteredAt, recordingId } = req.body;
    const updates: Record<string, unknown> = {};
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (masteredAt !== undefined) updates.masteredAt = masteredAt;
    if (recordingId !== undefined) updates.recordingId = recordingId;

    const [updated] = await db.update(schema.masteredItems)
      .set(updates)
      .where(eq(schema.masteredItems.id, req.params.id))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error('update mastered item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete mastered item
progressRouter.delete('/mastery/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [item] = await db.select().from(schema.masteredItems).where(eq(schema.masteredItems.id, req.params.id));
    if (!item) {
      res.status(404).json({ error: 'Mastered item not found' });
      return;
    }

    const membership = await verifyMembership(userId, item.studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    await db.delete(schema.masteredItems).where(eq(schema.masteredItems.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error('delete mastered item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

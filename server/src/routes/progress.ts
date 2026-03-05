import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and, sql, desc } from 'drizzle-orm';
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
        sql`${schema.practiceSessions.chartId} = ANY(${chartIds})`,
        eq(schema.practiceSessions.userId, userId),
        sql`${schema.practiceSessions.completedAt} IS NOT NULL`
      ));

    // Weekly data (last 12 weeks)
    const weeklyData = await db.select({
      week: sql<string>`date_trunc('week', ${schema.practiceSessions.completedAt})`,
      totalSeconds: sql<number>`coalesce(sum(${schema.practiceSessions.durationSeconds}), 0)`,
      sessionCount: sql<number>`count(*)`,
    })
      .from(schema.practiceSessions)
      .where(and(
        sql`${schema.practiceSessions.chartId} = ANY(${chartIds})`,
        eq(schema.practiceSessions.userId, userId),
        sql`${schema.practiceSessions.completedAt} IS NOT NULL`,
        sql`${schema.practiceSessions.completedAt} >= now() - interval '12 weeks'`
      ))
      .groupBy(sql`date_trunc('week', ${schema.practiceSessions.completedAt})`)
      .orderBy(sql`date_trunc('week', ${schema.practiceSessions.completedAt})`);

    res.json({
      totalSeconds: Number(totals.totalSeconds),
      sessionCount: Number(totals.sessionCount),
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

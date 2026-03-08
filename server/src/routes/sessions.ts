import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, asc } from 'drizzle-orm';
import { verifyMembership } from './studios.js';

export const sessionsRouter = Router();

// Start a practice session
sessionsRouter.post('/', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { chartId } = req.body;

    if (!chartId) {
      res.status(400).json({ error: 'chartId is required' });
      return;
    }

    const [chart] = await db.select().from(schema.practiceCharts).where(eq(schema.practiceCharts.id, chartId));
    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    const membership = await verifyMembership(userId, chart.studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const timerTargetSeconds = (chart.minimumPracticeMinutes || 0) * 60;

    const [session] = await db.insert(schema.practiceSessions).values({
      chartId,
      userId,
      timerTargetSeconds,
    }).returning();

    res.status(201).json(session);
  } catch (err) {
    console.error('start session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session with checkoffs
sessionsRouter.get('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [session] = await db.select().from(schema.practiceSessions).where(eq(schema.practiceSessions.id, req.params.id));
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const [chart] = await db.select().from(schema.practiceCharts).where(eq(schema.practiceCharts.id, session.chartId));
    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    const membership = await verifyMembership(userId, chart.studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const checkoffs = await db.select()
      .from(schema.sessionCheckoffs)
      .where(eq(schema.sessionCheckoffs.sessionId, session.id))
      .orderBy(asc(schema.sessionCheckoffs.checkedAt));

    res.json({ ...session, checkoffs });
  } catch (err) {
    console.error('get session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete session
sessionsRouter.patch('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [session] = await db.select().from(schema.practiceSessions).where(eq(schema.practiceSessions.id, req.params.id));
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({ error: 'Not your session' });
      return;
    }

    const { completedAt, durationSeconds } = req.body;
    const updates: Record<string, unknown> = {};
    if (completedAt !== undefined) updates.completedAt = new Date(completedAt);
    if (durationSeconds !== undefined) updates.durationSeconds = durationSeconds;

    const [updated] = await db.update(schema.practiceSessions)
      .set(updates)
      .where(eq(schema.practiceSessions.id, req.params.id))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error('complete session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record checkoff(s)
sessionsRouter.post('/:id/checkoffs', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [session] = await db.select().from(schema.practiceSessions).where(eq(schema.practiceSessions.id, req.params.id));
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({ error: 'Not your session' });
      return;
    }

    const body = req.body;
    const items = Array.isArray(body) ? body : [body];

    const checkoffs = await db.insert(schema.sessionCheckoffs).values(
      items.map((item: { chartItemId: string; repetitionNumber: number }) => ({
        sessionId: session.id,
        chartItemId: item.chartItemId,
        repetitionNumber: item.repetitionNumber,
      }))
    ).returning();

    res.status(201).json(Array.isArray(body) ? checkoffs : checkoffs[0]);
  } catch (err) {
    console.error('record checkoff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Undo checkoff
sessionsRouter.delete('/:id/checkoffs/:checkoffId', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [session] = await db.select().from(schema.practiceSessions).where(eq(schema.practiceSessions.id, req.params.id));
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({ error: 'Not your session' });
      return;
    }

    await db.delete(schema.sessionCheckoffs).where(eq(schema.sessionCheckoffs.id, req.params.checkoffId));
    res.json({ success: true });
  } catch (err) {
    console.error('undo checkoff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

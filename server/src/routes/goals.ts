import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and, isNull, isNotNull, desc } from 'drizzle-orm';
import { verifyMembership } from './studios.js';

export const goalsRouter = Router();

// List goals
goalsRouter.get('/', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const studioId = req.query.studioId as string;
    const status = req.query.status as string;
    if (!studioId) { res.status(400).json({ error: 'studioId is required' }); return; }

    const membership = await verifyMembership(userId, studioId);
    if (!membership) { res.status(403).json({ error: 'Not a member of this studio' }); return; }

    let query = db.select().from(schema.goals).where(eq(schema.goals.studioId, studioId)).$dynamic();

    if (status === 'active') {
      query = query.where(and(eq(schema.goals.studioId, studioId), isNull(schema.goals.completedAt)));
    } else if (status === 'completed') {
      query = query.where(and(eq(schema.goals.studioId, studioId), isNotNull(schema.goals.completedAt)));
    }

    const goals = await query.orderBy(desc(schema.goals.createdAt));
    res.json(goals);
  } catch (err) {
    console.error('list goals error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create goal
goalsRouter.post('/', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { studioId, title, description, targetDate, rewardType, rewardEmoji, customRewardId, customRewardTitle } = req.body;
    if (!studioId || !title) { res.status(400).json({ error: 'studioId and title are required' }); return; }

    const membership = await verifyMembership(userId, studioId, ['owner', 'editor']);
    if (!membership) { res.status(403).json({ error: 'Editor access required' }); return; }

    const [goal] = await db.insert(schema.goals).values({
      studioId, createdBy: userId, title,
      description: description || null,
      targetDate: targetDate || null,
      rewardType: rewardType || 'emoji',
      rewardEmoji: rewardEmoji || null,
      customRewardId: customRewardId || null,
      customRewardTitle: customRewardTitle || null,
    }).returning();
    res.status(201).json(goal);
  } catch (err) {
    console.error('create goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update goal
goalsRouter.patch('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const [goal] = await db.select().from(schema.goals).where(eq(schema.goals.id, req.params.id));
    if (!goal) { res.status(404).json({ error: 'Goal not found' }); return; }

    const membership = await verifyMembership(userId, goal.studioId, ['owner', 'editor']);
    if (!membership) { res.status(403).json({ error: 'Editor access required' }); return; }

    const { title, description, targetDate, rewardType, rewardEmoji, customRewardId, customRewardTitle } = req.body;
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (targetDate !== undefined) updates.targetDate = targetDate;
    if (rewardType !== undefined) updates.rewardType = rewardType;
    if (rewardEmoji !== undefined) updates.rewardEmoji = rewardEmoji;
    if (customRewardId !== undefined) updates.customRewardId = customRewardId;
    if (customRewardTitle !== undefined) updates.customRewardTitle = customRewardTitle;

    const [updated] = await db.update(schema.goals).set(updates).where(eq(schema.goals.id, req.params.id)).returning();
    res.json(updated);
  } catch (err) {
    console.error('update goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete goal
goalsRouter.post('/:id/complete', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const [goal] = await db.select().from(schema.goals).where(eq(schema.goals.id, req.params.id));
    if (!goal) { res.status(404).json({ error: 'Goal not found' }); return; }

    const membership = await verifyMembership(userId, goal.studioId, ['owner', 'editor']);
    if (!membership) { res.status(403).json({ error: 'Editor access required' }); return; }

    if (goal.completedAt) {
      res.json(goal);
      return;
    }

    const [updated] = await db.update(schema.goals).set({
      completedAt: new Date(),
      completedBy: userId,
    }).where(eq(schema.goals.id, req.params.id)).returning();
    res.json(updated);
  } catch (err) {
    console.error('complete goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete goal
goalsRouter.delete('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const [goal] = await db.select().from(schema.goals).where(eq(schema.goals.id, req.params.id));
    if (!goal) { res.status(404).json({ error: 'Goal not found' }); return; }

    const membership = await verifyMembership(userId, goal.studioId, ['owner', 'editor']);
    if (!membership) { res.status(403).json({ error: 'Editor access required' }); return; }

    await db.delete(schema.goals).where(eq(schema.goals.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error('delete goal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

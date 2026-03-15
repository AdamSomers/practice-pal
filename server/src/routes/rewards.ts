import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { verifyMembership } from './studios.js';

export const rewardsRouter = Router();

// List custom rewards for a studio
rewardsRouter.get('/', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const studioId = req.query.studioId as string;
    if (!studioId) { res.status(400).json({ error: 'studioId is required' }); return; }

    const membership = await verifyMembership(userId, studioId);
    if (!membership) { res.status(403).json({ error: 'Not a member of this studio' }); return; }

    const rewards = await db.select().from(schema.customRewards)
      .where(eq(schema.customRewards.studioId, studioId));
    res.json(rewards);
  } catch (err) {
    console.error('list custom rewards error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create custom reward
rewardsRouter.post('/', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { studioId, title, emoji } = req.body;
    if (!studioId || !title) { res.status(400).json({ error: 'studioId and title are required' }); return; }

    const membership = await verifyMembership(userId, studioId, ['owner', 'editor']);
    if (!membership) { res.status(403).json({ error: 'Editor access required' }); return; }

    const [reward] = await db.insert(schema.customRewards).values({
      studioId, createdBy: userId, title, emoji: emoji || null,
    }).returning();
    res.status(201).json(reward);
  } catch (err) {
    console.error('create custom reward error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete custom reward
rewardsRouter.delete('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const [reward] = await db.select().from(schema.customRewards).where(eq(schema.customRewards.id, req.params.id));
    if (!reward) { res.status(404).json({ error: 'Reward not found' }); return; }

    const membership = await verifyMembership(userId, reward.studioId, ['owner', 'editor']);
    if (!membership) { res.status(403).json({ error: 'Editor access required' }); return; }

    await db.delete(schema.customRewards).where(eq(schema.customRewards.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error('delete custom reward error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and, asc } from 'drizzle-orm';
import { verifyMembership } from './studios.js';

export const chartsRouter = Router();

// List charts for a studio
chartsRouter.get('/', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const studioId = req.query.studioId as string;
    if (!studioId) {
      res.status(400).json({ error: 'studioId query param is required' });
      return;
    }

    const membership = await verifyMembership(userId, studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const charts = await db.select()
      .from(schema.practiceCharts)
      .where(eq(schema.practiceCharts.studioId, studioId))
      .orderBy(asc(schema.practiceCharts.createdAt));

    res.json(charts);
  } catch (err) {
    console.error('list charts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create chart with items
chartsRouter.post('/', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { studioId, title, minimumPracticeMinutes, items } = req.body;

    if (!studioId || !title) {
      res.status(400).json({ error: 'studioId and title are required' });
      return;
    }

    const membership = await verifyMembership(userId, studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const [chart] = await db.insert(schema.practiceCharts).values({
      studioId,
      title,
      createdBy: userId,
      minimumPracticeMinutes: minimumPracticeMinutes ?? 0,
    }).returning();

    let createdItems: (typeof schema.chartItems.$inferSelect)[] = [];
    if (items && items.length > 0) {
      createdItems = await db.insert(schema.chartItems).values(
        items.map((item: { category: string; sortOrder: number; config: unknown; repetitions?: number }) => ({
          chartId: chart.id,
          category: item.category,
          sortOrder: item.sortOrder,
          config: item.config,
          repetitions: item.repetitions ?? 3,
        }))
      ).returning();
    }

    res.status(201).json({ ...chart, items: createdItems });
  } catch (err) {
    console.error('create chart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chart with items
chartsRouter.get('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [chart] = await db.select().from(schema.practiceCharts).where(eq(schema.practiceCharts.id, req.params.id));
    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    const membership = await verifyMembership(userId, chart.studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const items = await db.select()
      .from(schema.chartItems)
      .where(eq(schema.chartItems.chartId, chart.id))
      .orderBy(asc(schema.chartItems.sortOrder));

    res.json({ ...chart, items });
  } catch (err) {
    console.error('get chart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update chart
chartsRouter.patch('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [chart] = await db.select().from(schema.practiceCharts).where(eq(schema.practiceCharts.id, req.params.id));
    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    const membership = await verifyMembership(userId, chart.studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const { title, minimumPracticeMinutes } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (minimumPracticeMinutes !== undefined) updates.minimumPracticeMinutes = minimumPracticeMinutes;

    const [updated] = await db.update(schema.practiceCharts)
      .set(updates)
      .where(eq(schema.practiceCharts.id, req.params.id))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error('update chart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete chart (editor+ only)
chartsRouter.delete('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [chart] = await db.select().from(schema.practiceCharts).where(eq(schema.practiceCharts.id, req.params.id));
    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    const membership = await verifyMembership(userId, chart.studioId, ['owner', 'editor']);
    if (!membership) {
      res.status(403).json({ error: 'Editor or owner access required' });
      return;
    }

    await db.delete(schema.practiceCharts).where(eq(schema.practiceCharts.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error('delete chart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Duplicate chart
chartsRouter.post('/:id/duplicate', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [chart] = await db.select().from(schema.practiceCharts).where(eq(schema.practiceCharts.id, req.params.id));
    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    const membership = await verifyMembership(userId, chart.studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const [newChart] = await db.insert(schema.practiceCharts).values({
      studioId: chart.studioId,
      title: `${chart.title} (copy)`,
      createdBy: userId,
      minimumPracticeMinutes: chart.minimumPracticeMinutes,
    }).returning();

    const items = await db.select()
      .from(schema.chartItems)
      .where(eq(schema.chartItems.chartId, chart.id))
      .orderBy(asc(schema.chartItems.sortOrder));

    let newItems: (typeof schema.chartItems.$inferSelect)[] = [];
    if (items.length > 0) {
      newItems = await db.insert(schema.chartItems).values(
        items.map(item => ({
          chartId: newChart.id,
          category: item.category,
          sortOrder: item.sortOrder,
          config: item.config,
          repetitions: item.repetitions,
        }))
      ).returning();
    }

    res.status(201).json({ ...newChart, items: newItems });
  } catch (err) {
    console.error('duplicate chart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to chart
chartsRouter.post('/:id/items', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [chart] = await db.select().from(schema.practiceCharts).where(eq(schema.practiceCharts.id, req.params.id));
    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    const membership = await verifyMembership(userId, chart.studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const { category, sortOrder, config, repetitions } = req.body;

    const [item] = await db.insert(schema.chartItems).values({
      chartId: chart.id,
      category,
      sortOrder: sortOrder ?? 0,
      config,
      repetitions: repetitions ?? 3,
    }).returning();

    res.status(201).json(item);
  } catch (err) {
    console.error('add item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update item
chartsRouter.patch('/items/:itemId', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [item] = await db.select().from(schema.chartItems).where(eq(schema.chartItems.id, req.params.itemId));
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const [chart] = await db.select().from(schema.practiceCharts).where(eq(schema.practiceCharts.id, item.chartId));
    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    const membership = await verifyMembership(userId, chart.studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const { category, sortOrder, config, repetitions } = req.body;
    const updates: Record<string, unknown> = {};
    if (category !== undefined) updates.category = category;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (config !== undefined) updates.config = config;
    if (repetitions !== undefined) updates.repetitions = repetitions;

    const [updated] = await db.update(schema.chartItems)
      .set(updates)
      .where(eq(schema.chartItems.id, req.params.itemId))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error('update item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete item
chartsRouter.delete('/items/:itemId', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [item] = await db.select().from(schema.chartItems).where(eq(schema.chartItems.id, req.params.itemId));
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const [chart] = await db.select().from(schema.practiceCharts).where(eq(schema.practiceCharts.id, item.chartId));
    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    const membership = await verifyMembership(userId, chart.studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    await db.delete(schema.chartItems).where(eq(schema.chartItems.id, req.params.itemId));
    res.json({ success: true });
  } catch (err) {
    console.error('delete item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder items
chartsRouter.patch('/:id/reorder', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [chart] = await db.select().from(schema.practiceCharts).where(eq(schema.practiceCharts.id, req.params.id));
    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    const membership = await verifyMembership(userId, chart.studioId);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const { itemIds } = req.body as { itemIds: string[] };
    if (!itemIds || !Array.isArray(itemIds)) {
      res.status(400).json({ error: 'itemIds array is required' });
      return;
    }

    // Update sort order for each item
    await Promise.all(
      itemIds.map((id, index) =>
        db.update(schema.chartItems)
          .set({ sortOrder: index })
          .where(and(
            eq(schema.chartItems.id, id),
            eq(schema.chartItems.chartId, chart.id)
          ))
      )
    );

    const items = await db.select()
      .from(schema.chartItems)
      .where(eq(schema.chartItems.chartId, chart.id))
      .orderBy(asc(schema.chartItems.sortOrder));

    res.json(items);
  } catch (err) {
    console.error('reorder items error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';

export const authRouter = Router();

// Test login — find or create user by mock_user_id pattern
authRouter.post('/test-login', async (req, res) => {
  try {
    const { mock_user_id } = req.body;
    if (!mock_user_id) {
      res.status(400).json({ error: 'mock_user_id is required' });
      return;
    }

    const email = `${mock_user_id}@test.local`;
    let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));

    if (!user) {
      [user] = await db.insert(schema.users).values({
        email,
        displayName: mock_user_id,
      }).returning();
    }

    req.session.userId = user.id;
    res.json(user);
  } catch (err) {
    console.error('test-login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
authRouter.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, req.session.userId));
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
authRouter.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    res.json({ success: true });
  });
});

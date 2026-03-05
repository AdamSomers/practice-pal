import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';

export const studiosRouter = Router();

// Helper: verify user is a member of the studio, optionally with a required role
async function verifyMembership(userId: string, studioId: string, requiredRole?: string | string[]) {
  const [membership] = await db.select()
    .from(schema.studioMemberships)
    .where(and(
      eq(schema.studioMemberships.userId, userId),
      eq(schema.studioMemberships.studioId, studioId),
      isNotNull(schema.studioMemberships.acceptedAt)
    ));

  if (!membership) {
    return null;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(membership.role)) {
      return null;
    }
  }

  return membership;
}

// List studios for current user
studiosRouter.get('/', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const memberships = await db.select({
      membership: schema.studioMemberships,
      studio: schema.studios,
    })
      .from(schema.studioMemberships)
      .innerJoin(schema.studios, eq(schema.studioMemberships.studioId, schema.studios.id))
      .where(and(
        eq(schema.studioMemberships.userId, userId),
        isNotNull(schema.studioMemberships.acceptedAt)
      ));

    res.json(memberships.map(m => ({ ...m.studio, role: m.membership.role })));
  } catch (err) {
    console.error('list studios error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create studio
studiosRouter.post('/', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { name, instrument } = req.body;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const [studio] = await db.insert(schema.studios).values({
      name,
      instrument: instrument || null,
      ownerId: userId,
    }).returning();

    // Create owner membership
    await db.insert(schema.studioMemberships).values({
      studioId: studio.id,
      userId,
      role: 'owner',
      acceptedAt: new Date(),
    });

    res.status(201).json(studio);
  } catch (err) {
    console.error('create studio error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending invitations for current user
studiosRouter.get('/invitations', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const memberships = await db.select({
      membership: schema.studioMemberships,
      studio: schema.studios,
    })
      .from(schema.studioMemberships)
      .innerJoin(schema.studios, eq(schema.studioMemberships.studioId, schema.studios.id))
      .where(and(
        eq(schema.studioMemberships.userId, userId),
        isNull(schema.studioMemberships.acceptedAt)
      ));

    res.json(memberships.map(m => ({
      id: m.membership.id,
      studioId: m.studio.id,
      studioName: m.studio.name,
      role: m.membership.role,
      invitedBy: m.membership.invitedBy,
      createdAt: m.membership.createdAt,
    })));
  } catch (err) {
    console.error('invitations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get studio detail
studiosRouter.get('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const membership = await verifyMembership(userId, req.params.id);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const [studio] = await db.select().from(schema.studios).where(eq(schema.studios.id, req.params.id));
    if (!studio) {
      res.status(404).json({ error: 'Studio not found' });
      return;
    }

    res.json({ ...studio, role: membership.role });
  } catch (err) {
    console.error('get studio error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update studio
studiosRouter.patch('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const membership = await verifyMembership(userId, req.params.id, 'owner');
    if (!membership) {
      res.status(403).json({ error: 'Owner access required' });
      return;
    }

    const { name, instrument } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (instrument !== undefined) updates.instrument = instrument;

    const [studio] = await db.update(schema.studios)
      .set(updates)
      .where(eq(schema.studios.id, req.params.id))
      .returning();

    res.json(studio);
  } catch (err) {
    console.error('update studio error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete studio
studiosRouter.delete('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const membership = await verifyMembership(userId, req.params.id, 'owner');
    if (!membership) {
      res.status(403).json({ error: 'Owner access required' });
      return;
    }

    await db.delete(schema.studios).where(eq(schema.studios.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error('delete studio error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List members
studiosRouter.get('/:id/members', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const membership = await verifyMembership(userId, req.params.id);
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this studio' });
      return;
    }

    const members = await db.select({
      membership: schema.studioMemberships,
      user: schema.users,
    })
      .from(schema.studioMemberships)
      .innerJoin(schema.users, eq(schema.studioMemberships.userId, schema.users.id))
      .where(eq(schema.studioMemberships.studioId, req.params.id));

    res.json(members.map(m => ({
      ...m.user,
      role: m.membership.role,
      acceptedAt: m.membership.acceptedAt,
      membershipId: m.membership.id,
    })));
  } catch (err) {
    console.error('list members error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite member
studiosRouter.post('/:id/members', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const membership = await verifyMembership(userId, req.params.id, 'owner');
    if (!membership) {
      res.status(403).json({ error: 'Owner access required' });
      return;
    }

    const { email, role } = req.body;
    if (!email || !role) {
      res.status(400).json({ error: 'email and role are required' });
      return;
    }

    // Find or create user
    let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    if (!user) {
      [user] = await db.insert(schema.users).values({
        email,
        displayName: email.split('@')[0],
      }).returning();
    }

    // Check if already a member
    const [existing] = await db.select()
      .from(schema.studioMemberships)
      .where(and(
        eq(schema.studioMemberships.studioId, req.params.id),
        eq(schema.studioMemberships.userId, user.id)
      ));

    if (existing) {
      res.status(409).json({ error: 'User is already a member or has a pending invitation' });
      return;
    }

    const [newMembership] = await db.insert(schema.studioMemberships).values({
      studioId: req.params.id,
      userId: user.id,
      role,
      invitedBy: userId,
    }).returning();

    res.status(201).json(newMembership);
  } catch (err) {
    console.error('invite member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change member role
studiosRouter.patch('/:id/members/:userId', async (req, res) => {
  try {
    const currentUserId = req.session.userId!;
    const membership = await verifyMembership(currentUserId, req.params.id, 'owner');
    if (!membership) {
      res.status(403).json({ error: 'Owner access required' });
      return;
    }

    const { role } = req.body;
    if (!role) {
      res.status(400).json({ error: 'role is required' });
      return;
    }

    const [updated] = await db.update(schema.studioMemberships)
      .set({ role })
      .where(and(
        eq(schema.studioMemberships.studioId, req.params.id),
        eq(schema.studioMemberships.userId, req.params.userId)
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Membership not found' });
      return;
    }

    res.json(updated);
  } catch (err) {
    console.error('change role error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member
studiosRouter.delete('/:id/members/:userId', async (req, res) => {
  try {
    const currentUserId = req.session.userId!;
    const membership = await verifyMembership(currentUserId, req.params.id, 'owner');
    if (!membership) {
      res.status(403).json({ error: 'Owner access required' });
      return;
    }

    await db.delete(schema.studioMemberships)
      .where(and(
        eq(schema.studioMemberships.studioId, req.params.id),
        eq(schema.studioMemberships.userId, req.params.userId)
      ));

    res.json({ success: true });
  } catch (err) {
    console.error('remove member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept invitation
studiosRouter.post('/:id/members/accept', async (req, res) => {
  try {
    const userId = req.session.userId!;

    const [updated] = await db.update(schema.studioMemberships)
      .set({ acceptedAt: new Date() })
      .where(and(
        eq(schema.studioMemberships.studioId, req.params.id),
        eq(schema.studioMemberships.userId, userId)
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    res.json(updated);
  } catch (err) {
    console.error('accept invitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { verifyMembership };

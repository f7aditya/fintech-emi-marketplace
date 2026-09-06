import { Router } from 'express';

import { prisma } from '../prisma.js';
import { serializeUser } from '../lib/serialize.js';
import {
  googleAuthConfigured,
  mockAuthEnabled,
  requireAuth,
  signSession,
  verifyGoogleIdToken,
} from '../lib/auth.js';

export const authRouter = Router();

async function upsertUser({ googleId, email, name, picture, provider }) {
  const data = { email, name, picture: picture ?? null, provider };
  // Match on googleId when we have one, otherwise on email (mock users).
  if (googleId) {
    return prisma.user.upsert({
      where: { googleId },
      update: { email, name, picture: picture ?? null },
      create: { googleId, ...data },
    });
  }
  return prisma.user.upsert({
    where: { email },
    update: { name, picture: picture ?? null },
    create: data,
  });
}

/**
 * GET /api/auth/config
 * Lets the client know which sign-in methods the server supports.
 */
authRouter.get('/config', (_req, res) => {
  res.json({ google: googleAuthConfigured, mock: mockAuthEnabled });
});

/**
 * POST /api/auth/google
 * Body: { idToken }  — a Google ID token obtained by the client.
 * Verifies it, upserts the user, returns { token, user }.
 */
authRouter.post('/google', async (req, res, next) => {
  try {
    const { idToken } = req.body ?? {};
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });
    if (!googleAuthConfigured) {
      return res.status(501).json({ error: 'Google sign-in is not configured on the server' });
    }

    const profile = await verifyGoogleIdToken(idToken);
    const user = await upsertUser({ ...profile, provider: 'google' });
    res.json({ token: signSession(user), user: serializeUser(user) });
  } catch (err) {
    if (/token|verif|audience|Google/i.test(err.message)) {
      return res.status(401).json({ error: 'Could not verify Google sign-in', detail: err.message });
    }
    next(err);
  }
});

/**
 * POST /api/auth/mock
 * Body: { email, name?, picture? }  — DEV ONLY stand-in for Google sign-in.
 * Enabled only when ALLOW_MOCK_AUTH=true and NODE_ENV !== 'production'.
 */
authRouter.post('/mock', async (req, res, next) => {
  try {
    if (!mockAuthEnabled) return res.status(404).json({ error: 'Mock auth is disabled' });

    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    const name = String(req.body?.name || '').trim().slice(0, 80) || email.split('@')[0];
    const picture = String(req.body?.picture || '').trim() || null;

    const user = await upsertUser({ email, name, picture, provider: 'mock' });
    res.json({ token: signSession(user), user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me  — the current session's user, re-read from the DB.
 */
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ error: 'Session user no longer exists' });
    res.json({ user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
});

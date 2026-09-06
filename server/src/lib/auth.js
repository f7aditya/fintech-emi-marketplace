import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

/*
 * Auth helpers
 * ------------
 * Sign-in is OPTIONAL. The client obtains a Google ID token (or, in dev, uses the
 * mock endpoint), the server verifies it, upserts a `users` row, and returns its
 * own session JWT. That JWT is sent back as `Authorization: Bearer <token>` and
 * decoded by `attachUser` on every request (never blocking — `requireAuth` is the
 * one that 401s).
 */

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const JWT_TTL = process.env.JWT_TTL || '30d';

if (!process.env.JWT_SECRET) {
  console.warn('⚠  JWT_SECRET is not set — using an insecure development default.');
}

// Google client IDs allowed as the ID token audience (web / android / ios).
export const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const googleAuthConfigured = GOOGLE_CLIENT_IDS.length > 0;
export const mockAuthEnabled =
  (process.env.ALLOW_MOCK_AUTH ?? 'true').toLowerCase() === 'true' &&
  process.env.NODE_ENV !== 'production';

const googleClient = googleAuthConfigured ? new OAuth2Client() : null;

export function signSession(user) {
  return jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, {
    subject: user.id,
    expiresIn: JWT_TTL,
  });
}

export function verifySession(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Verify a Google ID token and return its normalised profile.
 * Throws if verification fails or Google auth isn't configured.
 */
export async function verifyGoogleIdToken(idToken) {
  if (!googleClient) throw new Error('Google auth is not configured on the server');
  const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_IDS });
  const p = ticket.getPayload();
  if (!p?.email || !p.email_verified) throw new Error('Google account email is not verified');
  return {
    googleId: p.sub,
    email: p.email,
    name: p.name || p.email.split('@')[0],
    picture: p.picture || null,
  };
}

/** Non-blocking: attaches req.user if a valid Bearer token is present. */
export function attachUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (token) {
    try {
      const decoded = verifySession(token);
      req.user = { id: decoded.sub, email: decoded.email, name: decoded.name };
    } catch {
      /* ignore bad / expired tokens — treat as anonymous */
    }
  }
  next();
}

/** Blocking: 401 unless a valid session is present. */
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in required' });
  next();
}

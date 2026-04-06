import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { authRouter } from './routes/auth.js';
import { studiosRouter } from './routes/studios.js';
import { chartsRouter } from './routes/charts.js';
import { sessionsRouter } from './routes/sessions.js';
import { progressRouter } from './routes/progress.js';
import { rewardsRouter } from './routes/rewards.js';
import { goalsRouter } from './routes/goals.js';
import { requireAuth } from './middleware/auth.js';

const isProd = process.env.APP_ENV === 'production';

const app = express();

if (!isProd) {
  app.use(cors({ origin: 'http://localhost:5174', credentials: true }));
}

app.set('trust proxy', 1);
app.use(express.json());

const PgStore = connectPgSimple(session);

app.use(session({
  store: new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  }
}));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/studios', requireAuth, studiosRouter);
app.use('/api/charts', requireAuth, chartsRouter);
app.use('/api/sessions', requireAuth, sessionsRouter);
app.use('/api/progress', requireAuth, progressRouter);
app.use('/api/rewards', requireAuth, rewardsRouter);
app.use('/api/goals', requireAuth, goalsRouter);

if (isProd) {
  const clientDist = path.join(import.meta.dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

export { app };

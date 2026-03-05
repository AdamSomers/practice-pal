import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { authRouter } from './routes/auth.js';
import { studiosRouter } from './routes/studios.js';
import { chartsRouter } from './routes/charts.js';
import { sessionsRouter } from './routes/sessions.js';
import { progressRouter } from './routes/progress.js';
import { requireAuth } from './middleware/auth.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/studios', requireAuth, studiosRouter);
app.use('/api/charts', requireAuth, chartsRouter);
app.use('/api/sessions', requireAuth, sessionsRouter);
app.use('/api/progress', requireAuth, progressRouter);

export { app };

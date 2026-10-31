import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { ZodError } from 'zod';
import { scenarioSchema, answerSchema, publicCase } from './validators/case.js';
import { generateCase } from './services/geminiService.js';
import { prepareEvidence } from './services/evidenceService.js';
const fail = (status, message) => Object.assign(new Error(message), { status });
export function createApp({ repository, generate = generateCase, sessionSecret, clientUrl = 'http://localhost:5173', production = false }) {
  if (!sessionSecret || sessionSecret.length < 32 || sessionSecret.startsWith('replace-with')) throw new Error('SESSION_SECRET must contain at least 32 random characters; replace any example value');
  const app = express();
  const allowedOrigins = new Set([new URL(clientUrl).origin]);
  const localClient = new URL(clientUrl);
  if (!production && ['localhost', '127.0.0.1'].includes(localClient.hostname)) {
    for (const hostname of ['localhost', '127.0.0.1']) {
      localClient.hostname = hostname;
      allowedOrigins.add(localClient.origin);
    }
  }
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: (origin, callback) => callback(null, allowedOrigins.has(origin)), credentials: true }));
  app.use(express.json({ limit: '12kb' }));
  app.use(cookieParser(sessionSecret));
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.get('origin') && !allowedOrigins.has(req.get('origin'))) return next(fail(403, 'Request origin is not allowed'));
    let playerId = req.signedCookies.detective;
    if (typeof playerId !== 'string' || !/^[0-9a-f-]{36}$/.test(playerId)) {
      playerId = randomUUID();
      res.cookie('detective', playerId, { signed: true, httpOnly: true, secure: production, sameSite: 'lax', maxAge: 365 * 86400000, path: '/' });
    }
    req.playerId = playerId; next();
  });
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  const generationLimit = rateLimit({ windowMs: 15 * 60000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many generation requests. Try again in 15 minutes.' } });
  app.post('/api/cases', generationLimit, async (req, res) => {
    const { scenario } = scenarioSchema.parse(req.body);
    const generated = await generate(scenario);
    const data = await repository.createCase({ ...generated, scenario, playerId: req.playerId, status: 'ready', evidence: prepareEvidence(generated.evidence) });
    res.status(201).json(publicCase(data));
  });
  app.param('id', async (req, res, next, id) => {
    try {
      if (!/^[a-f\d]{24}$/i.test(id)) throw fail(400, 'Invalid case ID');
      req.case = await repository.getCase(id, req.playerId);
      if (!req.case) throw fail(404, 'Case not found in this detective session');
      next();
    } catch (error) { next(error); }
  });
  app.get('/api/cases/:id', async (req, res) => res.json(publicCase(req.case, Boolean(await repository.getAttempt(req.params.id, req.playerId)))));
  app.get('/api/cases/:id/evidence', (req, res) => res.json(req.case.evidence));
  app.get('/api/cases/:id/suspects', (req, res) => res.json(req.case.suspects));
  const publicAttempt = attempt => ({ _id: String(attempt._id), caseId: String(attempt.caseId), selectedSuspectId: attempt.selectedSuspectId, isCorrect: attempt.isCorrect, submittedAt: attempt.submittedAt });
  const result = (data, attempt) => ({ caseId: String(data._id), title: data.title, suspects: data.suspects, solution: data.solution, attempt: publicAttempt(attempt), timeline: data.solution.timeline });
  app.post('/api/cases/:id/submit', async (req, res) => {
    const { selectedSuspectId } = answerSchema.parse(req.body);
    if (!req.case.suspects.some(s => s.id === selectedSuspectId)) throw fail(400, 'Select a suspect from this case');
    if (await repository.getAttempt(req.params.id, req.playerId)) throw fail(409, 'An answer has already been submitted');
    try {
      const attempt = await repository.createAttempt({ caseId: req.params.id, playerId: req.playerId, selectedSuspectId, isCorrect: selectedSuspectId === req.case.solution.culpritId });
      res.status(201).json(result(req.case, attempt));
    } catch (error) { if (error.code === 11000) throw fail(409, 'An answer has already been submitted'); throw error; }
  });
  app.get('/api/cases/:id/result', async (req, res) => {
    const attempt = await repository.getAttempt(req.params.id, req.playerId);
    if (!attempt) throw fail(403, 'Submit your final answer to reveal the solution');
    res.json(result(req.case, attempt));
  });
  app.get('/api/history', async (req, res) => res.json((await repository.history(req.playerId)).map(attempt => ({ ...publicAttempt(attempt), title: attempt.title }))));
  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found' }));
  const dist = fileURLToPath(new URL('../client/dist/', import.meta.url));
  if (existsSync(dist)) { app.use(express.static(dist)); app.get('/{*path}', (req, res) => res.sendFile(path.join(dist, 'index.html'))); }
  app.use((error, req, res, next) => {
    if (error instanceof ZodError) return res.status(400).json({ error: 'Check your input: scenario must be 20–2,000 characters, and selections must be valid.' });
    const status = error.status >= 400 && error.status <= 599 ? error.status : 500;
    if (status === 500) console.error('Request failed:', error.name);
    res.status(status).json({ error: status === 500 ? 'The server could not complete your request. Please try again.' : error.message });
  });
  return app;
}

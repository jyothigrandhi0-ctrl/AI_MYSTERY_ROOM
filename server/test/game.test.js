import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { validateCase } from '../validators/case.js';
import { fixture } from './fixture.js';

function setup(generate = async () => validateCase(fixture())) {
  const cases = new Map(); const attempts = new Map();
  const repository = {
    async createCase(data) { const item = { ...data, _id: 'a'.repeat(24), createdAt: new Date().toISOString() }; cases.set(item._id, item); return item; },
    async getCase(id, playerId) { const data = cases.get(id); return data?.playerId === playerId ? data : null; },
    async getAttempt(id, playerId) { return attempts.get(id + playerId); },
    async createAttempt(data) { const key = data.caseId + data.playerId; if (attempts.has(key)) throw Object.assign(new Error('duplicate'), { code: 11000 }); const attempt = { ...data, _id: 'attempt1', submittedAt: new Date().toISOString() }; attempts.set(key, attempt); return attempt; },
    async history(playerId) { return [...attempts.values()].filter(a => a.playerId === playerId).map(a => ({ ...a, title: cases.get(a.caseId).title })); }
  };
  const app = createApp({ repository, generate, sessionSecret: 'test-secret-with-more-than-thirty-two-characters' });
  return { app, agent: request.agent(app) };
}
const scenario = 'A manuscript disappears after a fictional museum closes for the night.';
async function open(agent) {
  // Establish the HttpOnly session before creating a case, like a real same-origin browser.
  await agent.get('/api/health').expect(200);
  return agent.post('/api/cases').send({ scenario }).expect(201);
}
test('validates counts, references, types and two distinct supporting clues', () => {
  assert.equal(validateCase(fixture()).solution.culpritId, 'S2');
  for (const mutate of [d => d.suspects.pop(), d => d.solution.culpritId = 'unknown', d => d.solution.supportingEvidenceIds = ['E2','E2'], d => d.solution.supportingEvidenceIds = ['E2','missing'], d => d.evidence[0].id = d.evidence[1].id, d => d.evidence[0].messages = [], d => d.evidence = d.evidence.filter(e => e.type !== 'image')]) {
    const data = fixture(); mutate(data); assert.throws(() => validateCase(data));
  }
});
test('public responses never expose the solution; result requires submission', async () => {
  const { agent } = setup(); const created = await open(agent); const id = created.body._id;
  for (const body of [created.body, (await agent.get(`/api/cases/${id}`).expect(200)).body]) {
    assert.equal(body.solution, undefined); assert.equal(body.playerId, undefined); assert.equal(body.submitted, false);
    assert.ok(!JSON.stringify(body).includes('supportingEvidenceIds'));
  }
  await agent.get(`/api/cases/${id}/result`).expect(403);
  assert.equal((await agent.get(`/api/cases/${id}/evidence`).expect(200)).body.length, 5);
  assert.equal((await agent.get(`/api/cases/${id}/suspects`).expect(200)).body.length, 3);
});
test('checks answer against fixed solution and permanently locks attempt', async () => {
  const { agent } = setup(); const { body: data } = await open(agent);
  await agent.post(`/api/cases/${data._id}/submit`).send({ selectedSuspectId: 'unknown' }).expect(400);
  const { body: result } = await agent.post(`/api/cases/${data._id}/submit`).send({ selectedSuspectId: 'S2' }).expect(201);
  assert.equal(result.attempt.isCorrect, true); assert.equal(result.solution.culpritId, 'S2');
  await agent.post(`/api/cases/${data._id}/submit`).send({ selectedSuspectId: 'S1' }).expect(409);
  assert.equal((await agent.get(`/api/cases/${data._id}/result`).expect(200)).body.attempt.selectedSuspectId, 'S2');
  assert.equal((await agent.get('/api/history').expect(200)).body.length, 1);
  assert.equal((await agent.get(`/api/cases/${data._id}`).expect(200)).body.submitted, true);
});
test('incorrect guesses reveal the original culprit', async () => {
  const { agent } = setup(); const { body: data } = await open(agent);
  const result = await agent.post(`/api/cases/${data._id}/submit`).send({ selectedSuspectId: 'S1' }).expect(201);
  assert.equal(result.body.attempt.isCorrect, false); assert.equal(result.body.solution.culpritId, 'S2');
});
test('another session cannot access case, evidence, suspects, attempts or history', async () => {
  const { agent, app } = setup(); const { body: data } = await open(agent); const other = request.agent(app);
  for (const suffix of ['', '/evidence', '/suspects', '/result']) await other.get(`/api/cases/${data._id}${suffix}`).expect(404);
  await other.post(`/api/cases/${data._id}/submit`).send({ selectedSuspectId: 'S2' }).expect(404);
  assert.deepEqual((await other.get('/api/history').expect(200)).body, []);
});
test('rejects invalid input, IDs, cross-origin writes and malformed JSON', async () => {
  const { agent } = setup();
  for (const scenario of ['short', 'a'.repeat(2001)]) await agent.post('/api/cases').send({ scenario }).expect(400);
  await agent.get('/api/cases/not-an-id').expect(400);
  await agent.post('/api/cases').set('Origin','https://untrusted.invalid').send({ scenario }).expect(403);
  await agent.post('/api/cases').set('Content-Type', 'application/json').send('{').expect(400);
});
test('development accepts both local origins, but rejects other ports and hosts', async () => {
  const { agent } = setup();
  for (const origin of ['http://localhost:5173', 'http://127.0.0.1:5173']) {
    const response = await agent.post('/api/cases').set('Origin', origin).send({ scenario }).expect(201);
    assert.equal(response.headers['access-control-allow-origin'], origin);
  }
  for (const origin of ['http://localhost:5174', 'http://127.0.0.1.evil.invalid:5173']) {
    await agent.post('/api/cases').set('Origin', origin).send({ scenario }).expect(403);
  }
});

test('production only accepts the configured origin', async () => {
  const app = createApp({ repository: {}, sessionSecret: 'test-secret-with-more-than-thirty-two-characters', production: true });
  await request(app).post('/api/cases').set('Origin', 'http://127.0.0.1:5173').send({ scenario }).expect(403);
  const response = await request(app).options('/api/cases').set('Origin', 'http://localhost:5173').expect(204);
  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5173');
});

test('generation failure is actionable and does not create a case', async () => {
  const { agent } = setup(async () => { throw Object.assign(new Error('Please retry generation.'), { status: 502 }); });
  const failed = await agent.post('/api/cases').send({ scenario }).expect(502);
  assert.match(failed.body.error, /retry/);
});
test('parallel accusations produce exactly one successful attempt', async () => {
  const { agent } = setup(); const { body: data } = await open(agent);
  const results = await Promise.all(['S1','S2'].map(selectedSuspectId => agent.post(`/api/cases/${data._id}/submit`).send({ selectedSuspectId })));
  assert.deepEqual(results.map(r => r.status).sort(), [201,409]);
});

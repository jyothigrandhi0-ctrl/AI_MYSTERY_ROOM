# AI Mystery Room

A MERN detective game built from [SPEC.md](./SPEC.md). Enter a fictional scenario, inspect Gemini-generated evidence and suspects, and submit one final accusation. The backend stores the predetermined solution before returning the case and reveals it only after submission.

## Requirements and setup

- Node.js 22 or newer with npm.
- MongoDB locally or a MongoDB Atlas connection string.
- A Gemini API key and a model supporting structured JSON output.

From the project root:

```powershell
Copy-Item .env.example .env
npm install
```

Edit `.env`: set `MONGODB_URI`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and a random `SESSION_SECRET` of at least 32 characters. Never put the API key in frontend variables. One way to generate the secret is `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

```powershell
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to Express on port 5000. MongoDB must be running before the backend starts. No database or AI credentials are bundled, and generation does not silently fall back to fake cases.

On Windows, `dev.cmd` also starts both services. It uses the project-local portable Node runtime when present, otherwise your installed Node. For other npm commands with the portable runtime in PowerShell, first run `$env:PATH = "$PWD\.tools\node-v22.16.0-win-x64;" + $env:PATH`, then use `npm.cmd`.

## Checks and production

```powershell
npm test
npm run build
npm start
```

After building, Express serves the frontend and API together at **http://localhost:5000**. For production, set `NODE_ENV=production`, set `CLIENT_URL` to the actual HTTPS origin, and place Express behind an HTTPS reverse proxy. Express binds to loopback by default. Secure session cookies require HTTPS in production. Configure proxy trust explicitly for your actual topology before using forwarded client IPs for rate limits. Keep the same session secret across restarts and replicas. Use a shared rate-limit store when running multiple API instances.

Tests use an isolated in-memory repository and deterministic case fixture; they verify game rules, API solution secrecy, ownership, input validation, incorrect guesses, duplicate/concurrent submissions, and failures. They do not require MongoDB or Gemini and do not replace live integration verification.

Initial verification in the development environment: server JavaScript syntax and package JSON checks passed. Dependency installation was blocked by registry connectivity (connection resets/timeouts; the mirror also failed DNS resolution), so the test suite, frontend build, and browser checks have not been run. Run the commands above after a successful installation. Live Gemini/MongoDB acceptance testing remains necessary.

## Implementation decisions

- Anonymous players use a signed, HttpOnly, SameSite cookie lasting one year. Cases and results belong to that session; clearing cookies loses access. Authentication and recovery are outside MVP scope.
- Cases and attempts persist in MongoDB. A unique compound index makes the single-attempt rule atomic, including concurrent submissions. The server waits for this index before listening.
- The solution is excluded from default MongoDB queries. Investigation responses use an explicit public projection, and result access requires a saved attempt from the owner.
- Gemini uses `@google/genai`, JSON Schema, Zod validation, a 60-second request timeout, and bounded retries. Configure a supported model via `.env`; the example is not a guarantee of model availability. See Google's [structured output documentation](https://ai.google.dev/gemini-api/docs/generate-content/structured-output).
- Validation checks counts, unique IDs, known culprit, evidence types, and two distinct supporting references. The prompt requests logical consistency and unique solvability; structural validation cannot prove narrative reasoning or prevent every model-generated spoiler. Review generated cases during acceptance testing.
- Chat evidence has timestamped messages. Images and CCTV use clearly labeled descriptive placeholders as explicitly permitted by the MVP. No real images or videos are generated or stored. Image prompts are retained for a future media adapter, and model-supplied URLs are never loaded.
- The public timeline contains observations; the full reconstruction belongs to the protected solution.
- AI generation is limited to ten requests per IP per fifteen minutes. The MVP limit is process-local. Frontend validation, body size limits, server validation, origin checks, security headers, and backend-only credentials provide additional protection.
- History shows up to 100 completed cases from the current session. New cases are accessible at their case URL while the session cookie is retained.
- Production hosting is a standard Node.js environment with MongoDB connectivity. This MERN architecture is not deployed to Sites' Workers runtime.

## Layout

`client/src/components` contains the form, navigation, suspect cards and evidence viewer. `client/src/pages` contains home/generation, investigation, results and archive screens. `server/app.js` defines REST routes with injectable dependencies, `server/models` persists records, `server/services` handles AI and evidence, and `server/validators` defines shared generation constraints. The original specification is preserved at the root.

All cases and evidence are fictional. Keep scenarios non-graphic and do not use them to accuse real people.

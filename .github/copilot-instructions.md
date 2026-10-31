# Repository context

The project specification is `SPEC.md`. The implementation uses npm workspaces: `client` (React/Vite/Tailwind) and `server` (Express/Mongoose/Gemini). Refer to the specification before changing application behavior.

Read README.md for setup and architecture decisions. Run `npm test` for core API/game tests and `npm run build` for the production frontend build. Keep solutions out of public case responses, enforce anonymous session ownership, and preserve the unique index preventing repeat attempts. Credentials belong only in the ignored root `.env` file.

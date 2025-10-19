<!-- HuskyTrack: project-specific guidance for AI coding agents -->
# Copilot instructions — HuskyTrack

Short, focused notes to help an AI agent edit and extend this repo safely and quickly.

## Big-picture architecture
- Frontend: `FrontEnd/client/` — React app bundled with Webpack (dev server on port 3000).
  - Entry: `src/index.js` -> `src/App.jsx` (single-page app with simple `pageType` state).
  - AWS config: `src/aws.js` contains Amplify.configure(...) (Cognito user pool + OAuth redirects).
  - UI components: `src/components/DashboardCard.jsx` and `src/components/Chat.jsx` expect a `user` object prop with fields: name, email, degree, expectedGraduation, currentCourses, progress, savedPDFs, chats.
  - Static assets: `public/` served by webpack-dev-server; `public/reports/` contains example PDFs.

- Backend (lightweight dev server): `FrontEnd/server/` — an Express server (entry: `server.js` per package.json). Used for simple API endpoints; check for an existing `server.js` before adding routes.

## Authentication & routing notes (what's currently discoverable)
- `src/aws.js` shows AWS Amplify + Cognito OAuth settings. Currently `redirectSignIn` and `redirectSignOut` point to `http://localhost:3000/`.
- The app does not yet use Amplify UI components or Auth state in `App.jsx` — user state is a local placeholder object. To make sign-in the initial view, you should:
  1. Use `@aws-amplify/ui-react`'s `Authenticator` (or `Auth` APIs) to gate the app and render a sign-in / sign-up UI.
  2. Change `redirectSignIn` (Cognito App Client) to the sign-in route (for example, `http://localhost:3000/signin`) or let the Amplify `Authenticator` handle the flow without OAuth redirect.
  3. On successful auth, fetch the logged-in user's record from the backend using a stable identifier (Cognito sub or email).

## How user data should flow (concrete guidance)
- Client-side model: `App.jsx` expects a single `user` object with the fields listed above. Keep that shape when loading/saving data.
- Recommended flow:
  - After authentication, call `Auth.currentAuthenticatedUser()` (Amplify) to get the user's attributes (email, sub).
  - Call backend API `GET /api/users/:sub` or `GET /api/users?email=...` to load the persisted `user` object.
  - Set the response into App-level state (replace the placeholder `user` in `App.jsx`).
  - Persist updates (e.g., chats, savedPDFs) via `POST/PUT /api/users/:sub`.

## Project-specific conventions & patterns
- UI expects `user` to be a single JS object (not normalized). Components mutate via `setUser(updated)` pattern (see `Chat.jsx` which updates `user.chats`).
- Files to edit for auth & user-loading tasks:
  - `FrontEnd/client/src/aws.js` (Amplify config)
  - `FrontEnd/client/src/index.js` and `src/App.jsx` (wrap with `Authenticator` or add auth-check + route `/signin`)
  - `FrontEnd/client/src/components/*` (ensure they rely only on `user` shape shown in `DashboardCard.jsx` and `Chat.jsx`)
  - `FrontEnd/server/server.js` (implement `GET /api/users/:id` and `PUT /api/users/:id` to load/persist per-user data). If `server.js` is missing, create it following `FrontEnd/server/package.json` conventions.

## Concrete tasks an AI agent can perform (examples)
- Implement a sign-in route using Amplify `Authenticator` and make it the starting page. Use `redirectSignIn` or SPA-based redirect; prefer `Authenticator` for fastest local dev.
- Replace the placeholder `user` in `App.jsx` with data loaded from the backend after Auth. Use `Auth.currentAuthenticatedUser()` to obtain a unique id.
- Add backend endpoints to store/retrieve user objects keyed by Cognito `sub`. Return the full `user` JSON shape to the client.

## Useful commands / developer workflows
- Start frontend dev server (Webpack):
  ```powershell
  cd FrontEnd/client; npm install; npm start
  ```
- Start backend dev server (if implemented):
  ```powershell
  cd FrontEnd/server; npm install; npm run dev
  ```

## Safety checks and constraints
- Do not change the `user` object shape without updating all components (`DashboardCard.jsx`, `Chat.jsx`).
- Keep webpack-dev-server port 3000 in sync with Cognito `redirectSignIn` during local testing.

## Where to look for examples in this repo
- `FrontEnd/client/src/aws.js` — Amplify/Cognito config (redirect URIs, scope).
- `FrontEnd/client/src/App.jsx` — app-level state and routing (`pageType`).
- `FrontEnd/client/src/components/DashboardCard.jsx` and `Chat.jsx` — fields used and mutation patterns.
- `FrontEnd/client/webpack.config.js` — dev server static serving and port 3000.

If any section is unclear or you'd like a PR that implements the sign-in flow + backend user endpoints, say "implement auth flow" and I will create the necessary changes and tests.

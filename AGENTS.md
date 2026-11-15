# frontend

The Angular web app of the recommendation system: sign-in, onboarding, recommendations, search, material page and profile.

**Read the shared guide first:** [AGENTS.md in Documentation](https://github.com/Hack-Challenges-recommendation-system/Documentation/blob/develop/AGENTS.md) covers the project, its architecture, the rules from the case (the case data and keys never go into git; this repository is public) and the commit conventions. Locally it is `AGENTS.md` in your clone of the Documentation repository. This file adds only what is specific to frontend.

## Stack and layout

- Angular 22 with standalone components, signals and zoneless change detection; TypeScript 6; Vitest 5 through `ng test`. SCSS.
- `src/app/core/`: typed API models (`api.models.ts`), Russian labels (`labels.ts`), services for auth, profile, catalog, events and recommendations, the auth interceptor and the route guards.
- `src/app/pages/`: one lazy-loaded component per route. `src/app/shared/`: `MaterialCard` and `ProfileForm`. `src/app/layout/shell.ts`: top bar and bottom bar.
- Templates are inline. Styles are global in `src/styles.scss`, because component styles have a 4 kB budget; add new classes there and reuse the tokens.
- New code follows the Angular style guide used so far: `inject()`, `input()` and `output()`, `@if` and `@for`, file names without `.component`.

## Commands

- `npm ci`, then `npm start` serves `http://localhost:4200` and proxies `/api` to the gateway on `http://localhost:8080` (`proxy.conf.json`).
- `npx ng test --watch=false` runs the tests; `npm run build` writes `dist/frontend/browser`.
- `Dockerfile` builds the app and serves it with nginx on port 80. nginx proxies `/api` to `API_GATEWAY_URL` (default `http://api-gateway:8080`), so the browser talks to one origin and needs no CORS.
- CI: `.github/workflows/ci-cd.yml` tests and builds every push and pull request, pushes the image to Docker Hub from `main`, and deploys on a manual run.

## Look and feel

- Mainly red, white and black (Alfa-Bank colors), with smooth gradients. Mobile first.
- Keep the palette in one place as CSS custom properties:

  ```scss
  :root {
    --red: #EF3124;       // accents and large text
    --red-dark: #C8281D;  // hover; small white text on red (5.6:1 contrast)
    --black: #0B0B0B;
    --white: #FFFFFF;
    --gray-100: #F3F4F5;
    --gray-300: #D6D8DA;
    --gray-600: #6B6E73;
    --grad-accent: linear-gradient(135deg, var(--red), #9E1A12);
    --grad-dark: linear-gradient(180deg, #000, #1C1C1E);
  }
  ```

- White text on `#EF3124` has about 4.1:1 contrast, below the 4.5:1 required for normal text. Use it only for large or bold text, and `--red-dark` behind small text.
- Gradients go on backgrounds, hero blocks and buttons, not behind body text.
- Transitions take 150–250 ms and are turned off under `prefers-reduced-motion`.
- Tap targets are at least 44 px. Onboarding → recommendations → material must work one-handed on a phone.
- UI text is in Russian.

## Product rules

- Every recommendation shows why it was picked and what to do next, and its place in the order; the list shows `orderExplanation` above the cards.
- Onboarding is short and optional: «Пропустить» saves the answers as they are, which marks onboarding as done, and the home page then shows a starter selection.
- Every card of the list can be rated «Полезно» or «Не подходит». The rating is stored first (`EventsService.react` waits for metric-service), then the list is asked for again; materials new to it are marked «Новое», and a status line says what changed. The latest rating of each material in the session lives in `EventsService.reactions`, shared with the material page.
- Paid materials show only their short benefit and the provided link. `access` tells «По подписке» (`SUBSCRIPTION`) from «Платный» (`PURCHASE`); without it, `paid` means «Платный».
- When recommendation-service answers with `engine: baseline`, show a quiet note that AI recommendations are unavailable right now.
- No pop-ups or push notifications; recommendations live on the page.

## Backend contract

All calls go through api-gateway under `/api/v1`.

- **Sign-up:** `POST /user` `{nickname, email, password}`.
- **Login:** `POST /auth/login` `{email, password}` answers 204 and sets the HttpOnly `jwtRefreshToken` cookie. Then `POST /auth/refresh` returns the access token as plain text. Keep it in memory and send it as `Authorization: Bearer <token>`.
- The access token lives 5 minutes. An HTTP interceptor must call `/auth/refresh` on a 401 and retry the request once.
- **Logout:** `DELETE /auth/logout` with the bearer token.
- **Onboarding:** `GET` and `PUT /profile/me`. `businessStage` is one of `IDEA`, `LAUNCH`, `GROWTH`, `SCALING`; `experience` is one of `NONE`, `BEGINNER`, `EXPERIENCED`; `goal` is free text up to 500 characters. Every answer except the nickname is optional.
- **Catalog:** `GET /materials/{id}`, `GET /materials/search?q=`.
- **Events:** `POST /events` with `{events: [...]}`. Send `IMPRESSION` when a recommendation is shown, `CLICK` when it's opened, `START`, `COMPLETE`, `LIKE` and `DISLIKE`. For items of a list of recommendations, include `recommendationId`, `variant` and `position`.
- **Recommendations:** `GET /recommendations/me` returns `{recommendationId, variant, engine, clarifyingQuestion, orderExplanation, items: [{material, reason, nextStep, position}]}`; a material carries `paid` and `access`. recommendation-service must answer in this shape. When it can't answer (network error, 404 or 5xx), `RecommendationService` builds the same shape from catalog search on the profile goal, with a next step from the format, and sets `engine: baseline`.

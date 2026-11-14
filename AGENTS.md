# frontend

The Angular web app of the recommendation system.

**Status:** empty repository; nothing is implemented yet.

## Project

Recommendation System is an entry for Hack&Change 2026, Alfa-Bank case «Альфа-Курс: знания в нужный момент», track 1: personal recommendations of educational materials for entrepreneurs. A vendor LLM ranks and explains materials; the services around it supply context, check its answers and record what users do.

| Repository | Role |
|---|---|
| `api-gateway` | Single entry point. Checks access tokens, routes `/api/v1/**`, sets `X-User-Id`. |
| `auth-service` | Registration, login, access and refresh JWT, logout denylist. |
| `profile-service` | Business profile of the user (onboarding answers). |
| `catalog-service` | Catalog of materials from the case data, with Russian full-text search. |
| `metric-service` | Raw user events and the metrics computed from them. |
| `recommendation-service` | Builds recommendations with the LLM. |
| `frontend` | Angular web app. |
| `Documentation` | Architecture docs. Only developers commit there; agents never do. |

All repositories live in the GitHub organization `Hack-Challenges-recommendation-system` and are **public**.

## Rules for every change

These come from the case. Breaking one can disqualify the submission.

1. **The case data never goes into git or a Docker image**: not the dump, not a copy, not an extract. Services read it from a path mounted at runtime; `/data/` is in `.gitignore`. Synthetic test data written by the team may be committed.
2. **No keys, tokens or passwords in git.** Read them from environment variables; `env.example` files list names only.
3. **External APIs, such as the LLM, get only the fragments they need.** No user ids, names, emails or other personal data, and no paid or closed materials.
4. **Paid materials:** show only a short benefit and the provided link, never their content.
5. **Everything must start with one `docker compose up` from the README.** A submission that doesn't start scores 0. Don't add infrastructure or a required external service without agreeing on it first.
6. **Simple UI, no intrusive notifications.**

## Commits

Every commit follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), in the style the history already uses:

    <type>(<scope>): <what was changed>

- **Type:** `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `style` or `revert`.
- **Scope:** optional; the area that changed, e.g. `(jwt)`, `(kafka)`, `(migrations)`, `(controllers)`, `(CI/CD)`.
- **Description:** English, past tense, e.g. `fix(cookie): logout cookie name was fixed`.
- **Breaking change:** `!` after the type or scope, plus a `BREAKING CHANGE:` footer saying what callers must change.
- One logical change per commit. Commit to `develop`; `main` receives merges from `develop`.

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

- Every recommendation shows why it was picked and what to do next.
- Paid materials show only their short benefit and the provided link.
- When recommendation-service answers with `engine: baseline`, show a quiet note that AI recommendations are unavailable right now.
- No pop-ups or push notifications; recommendations live on the page.

## Backend contract

All calls go through api-gateway under `/api/v1`.

- **Sign-up:** `POST /user` `{nickname, email, password}`.
- **Login:** `POST /auth/login` `{email, password}` answers 204 and sets the HttpOnly `jwtRefreshToken` cookie. Then `POST /auth/refresh` returns the access token as plain text. Keep it in memory and send it as `Authorization: Bearer <token>`.
- The access token lives 5 minutes. An HTTP interceptor must call `/auth/refresh` on a 401 and retry the request once.
- **Logout:** `DELETE /auth/logout` with the bearer token.
- **Onboarding:** `GET` and `PUT /profiles/me`. `businessStage` is one of `IDEA`, `LAUNCH`, `GROWTH`, `SCALING`; `experience` is one of `NONE`, `BEGINNER`, `EXPERIENCED`; `goal` is free text up to 500 characters. Every answer except the nickname is optional.
- **Catalog:** `GET /materials/{id}`, `GET /materials/search?q=`.
- **Events:** `POST /events` with `{events: [...]}`. Send `IMPRESSION` when a recommendation is shown, `CLICK` when it's opened, `START`, `COMPLETE`, `LIKE` and `DISLIKE`. For items of a list of recommendations, include `recommendationId`, `variant` and `position`.

# frontend

Angular 22 web app of the recommendation system. Rules, the backend contract and the design tokens are in [AGENTS.md](AGENTS.md).

## Run locally

```bash
npm ci
npm start   # http://localhost:4200
```

`npm start` proxies `/api` to the gateway on `http://localhost:8080` (`proxy.conf.json`), so start the backend first.

## Test and build

```bash
npx ng test --watch=false   # Vitest
npm run build               # dist/frontend/browser
```

## Docker

```bash
docker build -t frontend .
docker run -p 8080:80 -e API_GATEWAY_URL=http://host.docker.internal:8081 frontend
```

nginx serves the app on port 80 and proxies `/api` to `API_GATEWAY_URL` (default `http://api-gateway:8080`, the compose service).

# IRQ5

IRQ5 is a small single page app that allows to select and launch MS-DOS game bundles into a DosBox WASM session through [js-dos](https://js-dos.com/).

No backend, no accounts, no server-side game streaming.

## Stack
- Vite 8 + vanilla TypeScript
- pnpm
- js-dos 8.5.3 (pinned via jsDelivr, version in `jsdos.config.json`)
- fflate for bundling

## Development
```bash
pnpm install
pnpm dev
```
- Catalog page: `http://localhost:5173/`
- Smoke test: `http://localhost:5173/play.html?game=smoke`
- DOOM Shareware: put `DOOM.EXE` and `DOOM1.WAD` in `games-src/doom/`, run `pnpm run bundles`, open `http://localhost:5173/play.html?game=doom`

## Build & Bundles
```bash
# Generate .jsdos bundles from games-src/*
pnpm run bundles

# Typecheck and build site to dist/
pnpm run build
```

Bundles go to `public/games/*.jsdos` (gitignored). Only `.cfg` and `.txt` files under `games-src/*/` are tracked; game binaries are not committed.

## Lint & Format
```bash
pnpm run lint
pnpm run format
pnpm run format:check
pnpm run typecheck
```

## Deploy to Cloudflare Pages (direct upload from local machine)
We do **direct deployments** from a local machine (and not via GitHub Actions/CI). Game files and `.jsdos` bundles stay local and are never pushed to GitHub.

### First time setup
1. Install dependencies:
```bash
pnpm install
```

2. Ensure game files are in place and build everything:
```bash
# Test build bundles (needs DOOM.EXE + DOOM1.WAD in games-src/doom/ for DOOM)
pnpm run bundles

# Build site
pnpm run build
```

3. Login to Cloudflare (via Wrangler) and deploy:
```bash
pnpm run deploy:login
pnpm run deploy
```
This runs `pnpm run build` and uploads `dist/` to Cloudflare Pages project `irq5`. On first deploy, the project is created automatically.

### Subsequent deploys
```bash
pnpm run deploy
```
Just rebuilds and re-uploads `dist/`. No API keys needed if you're already logged in.


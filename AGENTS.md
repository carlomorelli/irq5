# IRQ5 — agent notes

Static catalog of DOS games that boot in the browser through js-dos (DOSBox
compiled to WebAssembly). No backend, no accounts, no server-side game
streaming.

## Stack and commands

- Vite 8 + vanilla TypeScript, npm.
- `npm install`
- `npm run dev` — builds bundles, then starts Vite.
- `npm run build` — builds bundles, typechecks, emits `dist/`.
- `npm run typecheck`
- `npm run preview`
- `npm run bundles` — regenerates `public/games/*.jsdos`.

## Layout

- `index.html` — catalog entry (`src/home.ts`).
- `play.html` — player entry (`src/play.ts`), reads `?game=<slug>`.
- `src/games.ts` — catalog. Add games here.
- `src/jsdos.ts` — loads the pinned js-dos CDN assets.
- `src/jsdos-types.ts` — the small slice of the js-dos API we use.
- `jsdos.config.json` — the only place the js-dos version is written.
- `scripts/build-bundles.mjs` — turns `games-src/<slug>/` into a `.jsdos` ZIP.
- `scripts/dosbox.conf` — base DOSBox config. `[sblaster] irq=5` is intentional.
- `games-src/<slug>/` — committed game source folders and per-game config.
- `public/games/<slug>.jsdos` — generated, gitignored, never hand-edit.
- `public/thumbs/` — thumbnails.

## Invariants

1. **Pin js-dos.** Version lives only in `jsdos.config.json`. CDN URLs are
   derived in `src/jsdos.ts`. Never use `/latest`.
2. **Bundle contract.** A `.jsdos` ZIP must contain `.jsdos/dosbox.conf`; all
   game files sit at the ZIP root. The build script appends `[autoexec]`,
   mounts the root as `C:`, then runs `autoexec.txt`.
3. **Game binaries are user-supplied.** Never download game files
   automatically. Only shareware/freeware. Keep the game's license/README.
   Do not commit or deploy commercial game data; verify the WAD license before
   publishing. The current DOOM test WAD is not shareware (see HANDOFF.md).
4. **Stable bundle URLs.** Saves are keyed by the bundle URL. Do not rename
   `/games/<slug>.jsdos` or move it to a different path without a migration.
5. **Save model.** Local to the browser (js-dos/OPFS). `autoSave: true` plus
   best-effort `save()` on `pagehide`/`visibilitychange`. No cross-device sync.
6. **First gesture matters.** Create `Dos` inside the click handler on the
   "Click to start" button so audio and keyboard unlock. Keep `autoStart: true`.
7. **DOOM sound contract.** DOSBox `[sblaster] irq=5` must match DOOM
   `snd_sbirq 5`. `snd_sfxdevice 3` / `snd_musicdevice 3` = Sound Blaster.
   Keep `snd_sbport 544`, `snd_sbdma 1`, `snd_mport 816`, `snd_channels 3`.
8. **Cloudflare Pages limits.** 25 MiB per file, 20k files. The build script
   warns if a bundle exceeds 25 MiB.
9. **Style.** No code comments unless asked. Do not commit unless asked.
10. **Tests.** Ask before changing the meaning/intent of an existing test.
    Adding tests or strengthening assertions is allowed.

## 11. Commits

- NEVER commit changes unless the user explicitly asks you to. It is VERY IMPORTANT to only commit when explicitly asked, otherwise the user will feel that you are being too proactive.

## Adding a game

1. Create `games-src/<slug>/`.
2. Add `autoexec.txt` and `required-files.txt` (one filename per line;
   `DOOM1.WAD|DOOM.WAD` means either file satisfies the check).
3. Add any config files the game needs.
4. Have the user add the game binaries. Do not fetch them.
5. Add a `Game` entry in `src/games.ts` and a thumbnail in `public/thumbs/`.
6. Run `npm run bundles`, then `npm run dev`.
7. Test `http://localhost:5173/play.html?game=<slug>` and the catalog card.

The smoke test game (`?game=smoke`) is intentionally hidden from the catalog.
It prints a system check without needing game binaries.

## Known quirks

- js-dos logs `Changes not found ...` on a first boot. That is normal.
- Headless browsers may log `Can't create audio node with sampleRate === 0`.
  Audio needs a real browser/gesture.
- Vite can serve `.jsdos` without a `Content-Type`; the preflight only rejects
  `text/html`, so do not tighten that check without testing.
- Do not add `.jsdos/jsdos.json` unless its schema is verified. The bundle works
  with only `.jsdos/dosbox.conf`.

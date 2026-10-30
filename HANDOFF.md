# IRQ5 — handoff

Last updated: 2026-10-30

## Status

Runnable vertical slice, manually tested with DOOM shareware 1.9 (DOOM1.WAD). The site builds, the catalog
renders, the smoke bundle boots inside js-dos, and DOOM boots with working sound,
mouse, and saves. Deployment remains.

## Done

- Vite + vanilla TypeScript multi-page app (`index.html`, `play.html`).
- CRT/amber/green visual theme, responsive catalog, player shell.
- Catalog in `src/games.ts`: DOOM (public) and System Check (hidden smoke test).
- js-dos 8.5.3 loaded from jsDelivr, version pinned in `jsdos.config.json`.
- Bundle pipeline with `fflate`: required-file check, generated
  `.jsdos/dosbox.conf`, `[autoexec]` with `mount c .` / `c:`, ZIP output to
  `public/games/<slug>.jsdos`.
- `games-src/doom/`: `IRQ5.CFG`, `DEFAULT.CFG`, `autoexec.txt`,
  `required-files.txt`, plus user-supplied `DOOM.EXE` and `DOOM.WAD`. The bundle
  builds to ~5.7 MB.
- `games-src/smoke/`: hidden system-check bundle.
- Manual DOOM test passed: boots, sound effects/music, mouse, and saves.
- Play flow: slug lookup, HEAD preflight, click-to-start, `autoStart`,
  `autoSave`, `fsChanges.local`, `setNoCloud(true)`, save on page hide.
- `npm run typecheck` and `npm run build` pass.
- Smoke bundle verified in headless Edge: start button enabled, click created
  one canvas inside `#dos`, overlay hidden, no app-level console errors. Expected
  noise: first-boot "Changes not found" and headless audio `sampleRate === 0`
  warning.
- `public/games/` is gitignored; `games-src/` is committed.

## Not done

- DOOM shareware 1.9 (`DOOM1.WAD`) tested and working. Old savefile compatibility confirmed.
  
  
- Browser checks mostly done; Safari not explicitly tested but expected compatible.
- Real thumbnail artwork; current `public/thumbs/doom.svg` is a placeholder.
- Cloudflare Pages project, cache headers, deployment.
- Cross-device saves (future Workers + R2/KV/D1).
- More games.

## Run it by hand

```powershell
cd C:\workspace\typescript\irq5
npm install
npm run dev
```

Open `http://localhost:5173/`.

Smoke test: open `http://localhost:5173/play.html?game=smoke`, click
**Click to start**. Expected: black DOSBox screen printing `IRQ5 SYSTEM CHECK`,
the `HELLO.TXT` text, and `js-dos booted successfully.` Keyboard input should
reach DOSBox.

DOOM:

1. Put `DOOM.EXE` and a WAD into `games-src/doom/`. `required-files.txt`
   accepts either `DOOM1.WAD` (shareware) or `DOOM.WAD`.
2. Run `npm run bundles`. Expected log: `[irq5] doom: ... -> public\games\doom.jsdos`.
3. Open `http://localhost:5173/play.html?game=doom`, click **Click to start**.
4. In-game: save a game, quit to DOS, reload the page, boot again, and load it.
   Also try the diskette button in the js-dos side panel.
5. Check sound effects and music. The DOSBox IRQ is 5, matching
   `snd_sbirq 5` in `IRQ5.CFG`/`DEFAULT.CFG`.

The shareware `DOOM1.WAD` is about 4.2 MB. Old save compatibility was confirmed.



If DOOM ignores `-config IRQ5.CFG`, it falls back to `DEFAULT.CFG`, which is
shipped with the same IRQ 5 settings. Do not overwrite `DEFAULT.CFG` with an
IRQ 7 file from the shareware ZIP; if you do, restore this copy.

## First-run unknowns

Record browser + version beside each item as it is tested. The first manual
DOOM pass did not record the browser/version.

- [x] DOOM boots and the IRQ 5 config is applied. Whether the exact build honors
      `-config IRQ5.CFG` or falls back to `DEFAULT.CFG` is not distinguished;
      both ship the same settings.
- [x] Sound Blaster effects and music are audible after the first click.
- [x] Mouse capture and fixed key bindings behave correctly.
- [x] In-game save and reload work. Diskette button works; saves can be restored in different sessions.
- [x] Save survives a normal tab close (best-effort `pagehide`).
- [x] Frame rate is playable.
- [x] Firefox and Edge (Chromium) audio unlock work with click -> async boot. Safari expected to work.
- [x] fflate ZIP is accepted (smoke bundle and DOOM both boot).
- [ ] Cloudflare Pages serves `.jsdos` with acceptable headers/caching.
- [x] DOOM bundle is 5.7 MB, under the 25 MiB per-file limit.

## Phases

- Phase 0 — scaffold, tooling, config: done.
- Phase 1 — vertical slice: done; smoke and DOOM both boot, DOOM sound/mouse/
  saves verified manually.
- Phase 2 — polish: real thumbnails, error states, mobile layout, metadata: open.
- Phase 3 — deploy: Cloudflare Pages, headers, cache policy: open.
- Phase 4 — sync: accounts + remote saves (Workers/R2/KV/D1): open.

## Decisions

- Client-side WASM, not server-side DOS streaming. No COOP/COEP requirement.
- Multi-page Vite build instead of a client router.
- js-dos from versioned jsDelivr URLs; no npm package, no vendoring.
- Local browser saves only; no cloud sync in the MVP.
- Shareware/freeware only. Tested with shareware DOOM 1.9 (`DOOM1.WAD`).
  
- `.jsdos/jsdos.json` omitted; only `.jsdos/dosbox.conf` is generated. The
  bundle works without it and its schema is not part of the current contract.
- The catalog filters `hidden`, so smoke is reachable by URL but not displayed.
- `bundleExists()` accepts an empty/unknown content type but rejects
  `text/html`, which catches Vite/static-server SPA fallbacks.

## File map

```text
src/home.ts             catalog rendering
src/play.ts             player setup, preflight, start, save hooks
src/games.ts            Game interface + catalog
src/jsdos.ts            CSS/JS loader, CDN paths
src/jsdos-types.ts      window.Dos + DosProps typings
src/style.css           theme and layout
scripts/build-bundles.mjs
scripts/dosbox.conf
games-src/doom/         DOOM config + autoexec; user adds EXE/WAD
games-src/smoke/        hidden system check
public/thumbs/doom.svg  placeholder thumbnail
```

## Troubleshooting

- **"Game data not installed"** — the bundle is missing or the dev server
  returned HTML. Check `games-src/<slug>/required-files.txt`, run
  `npm run bundles`, and confirm `public/games/<slug>.jsdos` exists.
- **CDN/player fetch fails** — check `jsdos.config.json`; jsDelivr must serve
  `js-dos@<version>/dist/js-dos.js`, `.css`, and `dist/emulators/`.
- **No sound** — click to start first; verify DOSBox IRQ 5 matches DOOM
  `snd_sbirq 5`; check the in-game sound settings.
- **Saves vanish** — bundle path changed, private browsing, or browser storage
  eviction. Same `/games/<slug>.jsdos` URL is required.
- **Bundle too large** — Cloudflare Pages rejects files over 25 MiB. Check the
  build warning before deploying.

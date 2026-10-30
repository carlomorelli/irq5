import './style.css';
import { getGame, type Game } from './games';
import { JSDOS_PATH_PREFIX, loadJsDos } from './jsdos';
import type { DosProps } from './jsdos-types';

const dosHost = must<HTMLDivElement>('#dos');
const overlay = must<HTMLDivElement>('#start-overlay');
const startButton = must<HTMLButtonElement>('#start-button');
const errorBox = must<HTMLDivElement>('#error-box');
const errorTitle = must<HTMLHeadingElement>('#error-title');
const errorMessage = must<HTMLParagraphElement>('#error-message');
const titleEl = must<HTMLHeadingElement>('#game-title');
const metaEl = must<HTMLParagraphElement>('#game-meta');

/**
 * js-dos's OPFS root directory. Pinned explicitly so the cache and save
 * locations are deterministic (js-dos defaults to this same name, so existing
 * saves keep working).
 */
const JSDOS_OPFS_ROOT = 'jsdos';

const game = getGame(new URLSearchParams(window.location.search).get('game'));

if (!game) {
  titleEl.textContent = 'Not found';
  metaEl.textContent = 'IRQ5';
  document.title = 'Not found — IRQ5';
  showError(
    'Game not found',
    'That game is not in the catalog. Pick one from the IRQ5 home page.'
  );
} else {
  void setup(game);
}

async function setup(selected: Game): Promise<void> {
  titleEl.textContent = selected.title;
  metaEl.textContent = [selected.year, selected.publisher]
    .filter(Boolean)
    .join(' · ');
  document.title = `${selected.title} — IRQ5`;

  const [playerResult, bundleResult] = await Promise.allSettled([
    loadJsDos(),
    bundleExists(selected.bundle),
  ]);

  if (playerResult.status === 'rejected') {
    console.error(playerResult.reason);
    showError(
      'Player failed to load',
      'The js-dos player could not be fetched. Check your connection and reload.'
    );
    return;
  }

  if (bundleResult.status === 'rejected') {
    console.error(bundleResult.reason);
  }

  if (bundleResult.status === 'rejected' || !bundleResult.value) {
    showError(
      'Game data not installed',
      `The bundle ${selected.bundle} is missing. Add the game files to games-src/${selected.slug}/ and run npm run bundles.`
    );
    return;
  }

  // Force js-dos to fetch the current bundle instead of reusing a stale OPFS
  // copy. Done before enabling the button so the click handler below can stay
  // synchronous, which keeps the first-gesture audio/keyboard unlock intact.
  await clearCachedBundle(selected.bundle);

  startButton.disabled = false;
  startButton.textContent = 'Click to start';

  let dos: DosProps | null = null;
  let starting = false;

  startButton.addEventListener('click', () => {
    if (starting || dos) {
      return;
    }

    starting = true;
    startButton.disabled = true;
    startButton.textContent = 'Starting…';

    try {
      dos = window.Dos(dosHost, {
        url: selected.bundle,
        pathPrefix: JSDOS_PATH_PREFIX,
        opfsRoot: JSDOS_OPFS_ROOT,
        theme: 'retro',
        autoStart: true,
        autoSave: true,
        fsChanges: { local: true },
      });
      dos.setNoCloud(true);
      overlay.hidden = true;
    } catch (error) {
      console.error(error);
      starting = false;
      startButton.disabled = false;
      startButton.textContent = 'Try again';
      showError(
        'Player failed to start',
        error instanceof Error ? error.message : 'Unknown player error.'
      );
    }
  });

  const persist = () => {
    if (!dos) {
      return;
    }
    void dos.save().catch((error: unknown) => {
      console.warn('Could not save game state', error);
    });
  };

  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      persist();
    }
  });
}

async function bundleExists(url: string): Promise<boolean> {
  const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
  if (response.status === 405) {
    return true;
  }
  if (!response.ok) {
    return false;
  }
  const type = response.headers.get('content-type') ?? '';
  return !type.includes('text/html');
}

/**
 * Reproduces js-dos 8.5.3's OPFS cache-key transform so we can address the
 * cached bundle entry it would otherwise reuse.
 *
 * Keep this in sync with the pinned js-dos version (`jsdos.config.json`).
 */
function bundleCacheKey(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 200);
}

/**
 * Deletes the cached `.jsdos` bundle for `url` from OPFS.
 *
 * js-dos caches bundles under `<opfsRoot>/caches/bundles/<key>` and never
 * revalidates them, so a redeployed bundle at the same URL would otherwise
 * stay stale. Only the bundle entry is removed; saves live separately under
 * `<opfsRoot>/saves/<key>.changes` and are left untouched.
 *
 * Best-effort: a missing entry or unsupported OPFS is ignored, and any other
 * failure is logged without blocking the boot.
 */
async function clearCachedBundle(url: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    const jsdos = await root.getDirectoryHandle(JSDOS_OPFS_ROOT);
    const caches = await jsdos.getDirectoryHandle('caches');
    const bundles = await caches.getDirectoryHandle('bundles');
    await bundles.removeEntry(bundleCacheKey(url));
    console.debug('[irq5] cleared cached bundle', url);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return;
    }
    console.warn('[irq5] could not clear cached bundle', error);
  }
}

function showError(title: string, message: string): void {
  overlay.hidden = true;
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  errorBox.hidden = false;
  errorBox.scrollIntoView({ block: 'center' });
}

function must<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing ${selector}`);
  }
  return element;
}

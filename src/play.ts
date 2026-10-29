import "./style.css";
import { getGame, type Game } from "./games";
import { JSDOS_PATH_PREFIX, loadJsDos } from "./jsdos";
import type { DosProps } from "./jsdos-types";

const dosHost = must<HTMLDivElement>("#dos");
const overlay = must<HTMLDivElement>("#start-overlay");
const startButton = must<HTMLButtonElement>("#start-button");
const errorBox = must<HTMLDivElement>("#error-box");
const errorTitle = must<HTMLHeadingElement>("#error-title");
const errorMessage = must<HTMLParagraphElement>("#error-message");
const titleEl = must<HTMLHeadingElement>("#game-title");
const metaEl = must<HTMLParagraphElement>("#game-meta");

const game = getGame(new URLSearchParams(window.location.search).get("game"));

if (!game) {
  titleEl.textContent = "Not found";
  metaEl.textContent = "IRQ5";
  document.title = "Not found — IRQ5";
  showError(
    "Game not found",
    "That game is not in the catalog. Pick one from the IRQ5 home page.",
  );
} else {
  void setup(game);
}

async function setup(selected: Game): Promise<void> {
  titleEl.textContent = selected.title;
  metaEl.textContent = [selected.year, selected.publisher]
    .filter(Boolean)
    .join(" · ");
  document.title = `${selected.title} — IRQ5`;

  const [playerResult, bundleResult] = await Promise.allSettled([
    loadJsDos(),
    bundleExists(selected.bundle),
  ]);

  if (playerResult.status === "rejected") {
    console.error(playerResult.reason);
    showError(
      "Player failed to load",
      "The js-dos player could not be fetched. Check your connection and reload.",
    );
    return;
  }

  if (bundleResult.status === "rejected") {
    console.error(bundleResult.reason);
  }

  if (bundleResult.status === "rejected" || !bundleResult.value) {
    showError(
      "Game data not installed",
      `The bundle ${selected.bundle} is missing. Add the game files to games-src/${selected.slug}/ and run npm run bundles.`,
    );
    return;
  }

  startButton.disabled = false;
  startButton.textContent = "Click to start";

  let dos: DosProps | null = null;
  let starting = false;

  startButton.addEventListener("click", () => {
    if (starting || dos) return;

    starting = true;
    startButton.disabled = true;
    startButton.textContent = "Starting…";

    try {
      dos = window.Dos(dosHost, {
        url: selected.bundle,
        pathPrefix: JSDOS_PATH_PREFIX,
        theme: "retro",
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
      startButton.textContent = "Try again";
      showError(
        "Player failed to start",
        error instanceof Error ? error.message : "Unknown player error.",
      );
    }
  });

  const persist = () => {
    if (!dos) return;
    void dos.save().catch((error: unknown) => {
      console.warn("Could not save game state", error);
    });
  };

  window.addEventListener("pagehide", persist);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persist();
  });
}

async function bundleExists(url: string): Promise<boolean> {
  const response = await fetch(url, { method: "HEAD", cache: "no-store" });
  if (response.status === 405) return true;
  if (!response.ok) return false;
  const type = response.headers.get("content-type") ?? "";
  return !type.includes("text/html");
}

function showError(title: string, message: string): void {
  overlay.hidden = true;
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  errorBox.hidden = false;
  errorBox.scrollIntoView({ block: "center" });
}

function must<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

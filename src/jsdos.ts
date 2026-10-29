import jsdosConfig from "../jsdos.config.json";

export const JSDOS_VERSION = jsdosConfig.version;

const base = `https://cdn.jsdelivr.net/npm/js-dos@${JSDOS_VERSION}/dist`;

export const JSDOS_PATH_PREFIX = `${base}/emulators/`;

let loading: Promise<void> | null = null;

export function loadJsDos(): Promise<void> {
  if (typeof window.Dos === "function") return Promise.resolve();
  if (loading) return loading;

  loading = Promise.all([
    loadStyle(`${base}/js-dos.css`),
    loadScript(`${base}/js-dos.js`),
  ])
    .then(() => {
      if (typeof window.Dos !== "function") {
        throw new Error("js-dos loaded but window.Dos is missing.");
      }
    })
    .catch((error: unknown) => {
      loading = null;
      throw error;
    });

  return loading;
}

function loadStyle(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load ${href}`));
    document.head.append(link);
  });
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.append(script);
  });
}

export interface DosOptions {
  url?: string;
  pathPrefix?: string;
  pathSuffix?: string;
  theme?: string;
  autoStart?: boolean;
  autoSave?: boolean;
  kiosk?: boolean;
  quickSave?: boolean;
  fsChanges?: {
    local?: boolean;
    urlToKey?: (url: string) => Promise<string>;
  };
  onEvent?: (event: string, ci?: unknown) => void;
}

export interface DosProps {
  save(): Promise<boolean>;
  stop(): Promise<void>;
  setNoCloud(noCloud: boolean): void;
}

declare global {
  interface Window {
    Dos: (element: HTMLDivElement, options?: DosOptions) => DosProps;
  }
}

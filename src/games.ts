export interface Game {
  slug: string;
  title: string;
  year?: number;
  publisher?: string;
  description: string;
  thumbnail: string;
  bundle: string;
  hidden?: boolean;
}

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const games: readonly Game[] = [
  {
    slug: 'doom',
    title: 'DOOM',
    year: 1993,
    publisher: 'id Software',
    description:
      'Shareware episode one: Knee-Deep in the Dead. Sound Blaster audio, keyboard and mouse.',
    thumbnail: asset('thumbs/doom.svg'),
    bundle: asset('games/doom.jsdos'),
  },
  {
    slug: 'smoke',
    title: 'System Check',
    year: 2026,
    publisher: 'IRQ5',
    description: 'Hidden js-dos smoke test.',
    thumbnail: asset('thumbs/doom.svg'),
    bundle: asset('games/smoke.jsdos'),
    hidden: true,
  },
];

export function getGame(slug: string | null | undefined): Game | undefined {
  if (!slug) {
    return undefined;
  }
  return games.find((game) => game.slug === slug);
}

export function visibleGames(): readonly Game[] {
  return games.filter((game) => !game.hidden);
}

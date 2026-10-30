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
    slug: 'princeofpersia',
    title: 'Prince of Persia',
    year: 1989,
    publisher: 'Broderbund',
    description: 'Classic platformer. Keyboard controls.',
    thumbnail: asset('thumbs/princeofpersia.svg'),
    bundle: asset('games/princeofpersia.jsdos'),
  },
  {
    slug: 'wolf3d',
    title: 'Wolfenstein 3D',
    year: 1992,
    publisher: 'id Software',
    description: 'Shareware FPS. Keyboard/mouse.',
    thumbnail: asset('thumbs/wolf3d.svg'),
    bundle: asset('games/wolf3d.jsdos'),
  },
  {
    slug: 'streetfighter2',
    title: 'Street Fighter II',
    year: 1992,
    publisher: 'Capcom',
    description: 'Arcade fighter.',
    thumbnail: asset('thumbs/streetfighter2.svg'),
    bundle: asset('games/streetfighter2.jsdos'),
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

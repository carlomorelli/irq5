import './style.css';
import { visibleGames } from './games';

const grid = document.querySelector<HTMLDivElement>('#games');
const count = document.querySelector<HTMLSpanElement>('#game-count');

if (!grid) {
  throw new Error('Missing #games element');
}

const catalog = visibleGames();

if (count) {
  count.textContent = `${catalog.length} ${
    catalog.length === 1 ? 'title' : 'titles'
  }`;
}

for (const game of catalog) {
  const card = document.createElement('a');
  card.className = 'game-card';
  card.href = `play.html?game=${encodeURIComponent(game.slug)}`;

  const thumb = document.createElement('div');
  thumb.className = 'game-thumb';

  const img = document.createElement('img');
  img.src = game.thumbnail;
  img.alt = '';
  img.width = 640;
  img.height = 480;
  img.loading = 'lazy';
  img.decoding = 'async';

  const badge = document.createElement('span');
  badge.className = 'play-badge';
  badge.textContent = 'Play';

  thumb.append(img, badge);

  const body = document.createElement('div');
  body.className = 'game-body';

  const title = document.createElement('h3');
  title.textContent = game.title;

  const meta = document.createElement('p');
  meta.className = 'game-meta';
  meta.textContent = [game.year, game.publisher].filter(Boolean).join(' · ');

  const desc = document.createElement('p');
  desc.className = 'game-desc';
  desc.textContent = game.description;

  body.append(title, meta, desc);
  card.append(thumb, body);
  grid.append(card);
}

if (catalog.length === 0) {
  const empty = document.createElement('p');
  empty.className = 'empty';
  empty.textContent = 'No games installed yet.';
  grid.append(empty);
}

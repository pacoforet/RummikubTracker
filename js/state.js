const STATE_VERSION = 3;
const STORAGE_KEY = 'rummikub_data';
const BACKUP_KEY = 'rummikub_data_backup';
const ARCHIVE_KEY = 'rummikub_archive';
const ARCHIVE_LIMIT = 50;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;

const PLAYER_COLORS = ['#4A90E2', '#E25C5C', '#4AE28A', '#E2C84A', '#A64AE2', '#E28A4A'];
const COLOR_RE = /^#[0-9a-f]{6}$/i;

function defaultState() {
  return {
    version: STATE_VERSION,
    players: [
      { id: 1, name: 'Jugador 1', color: PLAYER_COLORS[0], score: 0 },
      { id: 2, name: 'Jugador 2', color: PLAYER_COLORS[1], score: 0 },
    ],
    rounds: [],
    settings: {
      targetScore: null,
      rule: 'standard',
      language: 'es',
      theme: 'auto',
      sortByScore: false,
    },
    gameActive: false,
    // Id of the player whose win has already been celebrated (null = none yet)
    winnerAnnounced: null,
  };
}

function validateState(state) {
  if (!state || typeof state !== 'object') return null;
  if (!Array.isArray(state.players) || state.players.length < MIN_PLAYERS) return null;
  if (!Array.isArray(state.rounds)) return null;
  if (!state.settings || typeof state.settings !== 'object') return null;

  for (const [i, p] of state.players.entries()) {
    if (!p || typeof p.id === 'undefined' || typeof p.name !== 'string') return null;
    if (typeof p.score !== 'number' || !isFinite(p.score)) p.score = 0;
    // Colors end up in style attributes, so only accept plain hex values
    if (typeof p.color !== 'string' || !COLOR_RE.test(p.color)) {
      p.color = PLAYER_COLORS[i % PLAYER_COLORS.length];
    }
  }

  for (const r of state.rounds) {
    if (!r || !Array.isArray(r.changes)) return null;
  }

  return state;
}

export function migrateState(raw) {
  if (!raw || typeof raw !== 'object') return null;

  // v1 -> v2: add missing fields
  if (!raw.version || raw.version < 2) {
    if (raw.players) {
      raw.players.forEach((p, i) => {
        if (!p.color) p.color = PLAYER_COLORS[i % PLAYER_COLORS.length];
      });
    }
    if (!raw.settings) raw.settings = {};
    if (!raw.settings.language) raw.settings.language = 'es';
    if (!raw.settings.theme) raw.settings.theme = 'auto';
    if (raw.settings.sortByScore === undefined) raw.settings.sortByScore = false;
  }

  // v2 -> v3: drop unused scoreDirection, track announced winner
  if (raw.version === undefined || raw.version < 3) {
    if (raw.settings) delete raw.settings.scoreDirection;
    if (raw.winnerAnnounced === undefined) raw.winnerAnnounced = null;
  }

  raw.version = STATE_VERSION;
  return raw;
}

let state = defaultState();

export function getState() {
  return state;
}

export function setState(updater) {
  if (typeof updater === 'function') {
    state = updater(state);
  } else {
    state = { ...state, ...updater };
  }
  saveState();
}

/**
 * Loads the persisted game. If the stored data can't be parsed or validated,
 * it is copied to a backup key instead of being silently discarded.
 * @returns {{ state: object, recovered: boolean }}
 */
export function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to read game state:', e);
    return { state, recovered: false };
  }
  if (!raw) return { state, recovered: false };

  let valid = null;
  try {
    valid = validateState(migrateState(JSON.parse(raw)));
  } catch (e) {
    console.error('Failed to parse game state:', e);
  }

  if (valid) {
    const defaults = defaultState();
    state = { ...defaults, ...valid, settings: { ...defaults.settings, ...valid.settings } };
    return { state, recovered: false };
  }

  try {
    localStorage.setItem(BACKUP_KEY, raw);
  } catch (e) {
    console.error('Failed to back up corrupted state:', e);
  }
  return { state, recovered: true };
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

// --- Scoring Logic (pure functions) ---

export function calculateStandardRound(players, winnerId, tileData, manualInputs) {
  const changes = [];
  let winnerSum = 0;

  players.forEach((p) => {
    if (p.id !== winnerId) {
      let val;
      if (manualInputs[p.id] !== undefined) {
        val = parseInt(manualInputs[p.id], 10) || 0;
      } else {
        val = calculateTileTotal(tileData[p.id] || {});
      }
      changes.push({ playerId: p.id, points: val ? -Math.abs(val) : 0 }); // avoid -0
      winnerSum += Math.abs(val);
    }
  });

  if (winnerId !== null && winnerId !== undefined) {
    changes.push({ playerId: winnerId, points: winnerSum });
  }
  return changes;
}

export function calculateSimpleRound(players, inputs) {
  return players.map((p) => ({
    playerId: p.id,
    points: parseInt(inputs[p.id], 10) || 0,
  }));
}

export function calculateTileTotal(tiles) {
  let total = 0;
  for (const val in tiles) {
    total += parseInt(val, 10) * (tiles[val] || 0);
  }
  return total;
}

export function calculateTileCount(tiles) {
  let count = 0;
  for (const val in tiles) {
    count += tiles[val] || 0;
  }
  return count;
}

export function recalculateScores(players, rounds) {
  players.forEach((p) => (p.score = 0));
  rounds.forEach((round) => {
    round.changes.forEach((c) => {
      const player = players.find((p) => p.id === c.playerId);
      if (player) player.score += c.points;
    });
  });
  return players;
}

/** Returns a new array sorted from highest to lowest score. */
export function sortPlayersByScore(players) {
  return [...players].sort((a, b) => b.score - a.score);
}

/**
 * Returns the player who reached the target score, or null. If several
 * players cross it in the same round, the one with the highest score wins.
 */
export function findWinner(players, settings) {
  if (!settings.targetScore) return null;
  const qualifying = players.filter((p) => p.score >= settings.targetScore);
  return qualifying.length ? sortPlayersByScore(qualifying)[0] : null;
}

/** Ids of the players who won a round (highest positive delta; ties all count). */
export function getRoundWinnerIds(round) {
  if (!round.changes.length) return [];
  const maxPts = Math.max(...round.changes.map((c) => c.points));
  if (maxPts <= 0) return [];
  return round.changes.filter((c) => c.points === maxPts).map((c) => c.playerId);
}

export function getPlayerStats(player, rounds) {
  const scores = rounds
    .map((r) => r.changes.find((c) => c.playerId === player.id))
    .filter(Boolean)
    .map((c) => c.points);
  const wins = rounds.filter((r) => getRoundWinnerIds(r).includes(player.id)).length;

  return {
    roundsWon: wins,
    avgPerRound: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    bestRound: scores.length ? Math.max(...scores) : 0,
  };
}

/**
 * Whole-game summary used by the winner screen.
 * @returns {{ totalRounds: number, bestRound: {player, points}|null, mostWins: {player, count}|null }}
 */
export function getGameSummary(players, rounds) {
  let bestRound = null;
  rounds.forEach((r) => {
    r.changes.forEach((c) => {
      const player = players.find((p) => p.id === c.playerId);
      if (player && c.points > 0 && (!bestRound || c.points > bestRound.points)) {
        bestRound = { player, points: c.points };
      }
    });
  });

  let mostWins = null;
  players.forEach((player) => {
    const count = getPlayerStats(player, rounds).roundsWon;
    if (count > 0 && (!mostWins || count > mostWins.count)) mostWins = { player, count };
  });

  return { totalRounds: rounds.length, bestRound, mostWins };
}

export function getSortedPlayers(players, rounds, sortByScore) {
  return sortByScore && rounds.length > 0 ? sortPlayersByScore(players) : [...players];
}

/** 1-based rank of each player by score (tied scores share a rank); 0 before any round. */
export function getPositions(players, rounds) {
  const positions = {};
  const scores = sortPlayersByScore(players).map((p) => p.score);
  players.forEach((p) => {
    positions[p.id] = rounds.length > 0 ? scores.indexOf(p.score) + 1 : 0;
  });
  return positions;
}

/**
 * Validates the setup form before starting a game.
 * @returns {{ ok: true, targetScore: number|null, players: object[] } | { ok: false, error: string }}
 *   `error` is an i18n key.
 */
export function validateGameSetup(players, targetRaw) {
  const rawTarget = String(targetRaw ?? '').trim();
  let targetScore = null;
  if (rawTarget !== '') {
    const n = Number(rawTarget);
    if (!Number.isInteger(n) || n <= 0) return { ok: false, error: 'dialog.invalidTarget' };
    targetScore = n;
  }

  const trimmed = players.map((p) => ({ ...p, name: p.name.trim() }));
  if (trimmed.some((p) => p.name === '')) return { ok: false, error: 'dialog.emptyName' };

  const seen = new Set();
  for (const p of trimmed) {
    const key = p.name.toLocaleLowerCase();
    if (seen.has(key)) return { ok: false, error: 'dialog.duplicateName' };
    seen.add(key);
  }

  return { ok: true, targetScore, players: trimmed };
}

// --- Archive ---

export function getArchive() {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (g) => g && Array.isArray(g.players) && Array.isArray(g.rounds) && g.settings
    );
  } catch {
    return [];
  }
}

/**
 * Saves the current game at the top of the archive.
 * @returns {{ trimmed: number }} how many old games were dropped to respect the limit
 */
export function archiveCurrentGame() {
  const archive = getArchive();
  archive.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    players: state.players.map((p) => ({ ...p })),
    rounds: [...state.rounds],
    settings: { ...state.settings },
  });
  const trimmed = Math.max(0, archive.length - ARCHIVE_LIMIT);
  if (trimmed) archive.length = ARCHIVE_LIMIT;
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
  } catch (e) {
    console.error('Failed to save archive:', e);
  }
  return { trimmed };
}

export function deleteArchiveEntry(id) {
  const archive = getArchive().filter((g) => g.id !== id);
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
  } catch (e) {
    console.error('Failed to update archive:', e);
  }
}

/**
 * Players and game rules of the most recent archived game. Only game-related
 * settings are returned so app preferences (language, theme...) are untouched.
 */
export function getLastGameConfig() {
  const archive = getArchive();
  if (archive.length === 0) return null;
  const last = archive[0];
  return {
    players: last.players.map((p) => ({ ...p, score: 0 })),
    settings: {
      rule: last.settings.rule === 'simple' ? 'simple' : 'standard',
      targetScore: last.settings.targetScore || null,
    },
  };
}

export { PLAYER_COLORS, STATE_VERSION, ARCHIVE_LIMIT, MIN_PLAYERS, MAX_PLAYERS };

const STATE_VERSION = 2;
const STORAGE_KEY = 'rummikub_data';
const ARCHIVE_KEY = 'rummikub_archive';

const PLAYER_COLORS = ['#4A90E2', '#E25C5C', '#4AE28A', '#E2C84A', '#A64AE2', '#E28A4A'];

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
      scoreDirection: 'highest',
      language: 'es',
      theme: 'auto',
      sortByScore: false,
    },
    gameActive: false,
  };
}

function validateState(state) {
  if (!state || typeof state !== 'object') return null;
  if (!Array.isArray(state.players) || state.players.length < 2) return null;
  if (!Array.isArray(state.rounds)) return null;
  if (!state.settings || typeof state.settings !== 'object') return null;

  for (const p of state.players) {
    if (typeof p.id === 'undefined' || typeof p.name !== 'string') return null;
    if (typeof p.score !== 'number' || !isFinite(p.score)) p.score = 0;
  }

  for (const r of state.rounds) {
    if (!Array.isArray(r.changes)) return null;
  }

  return state;
}

function migrateState(raw) {
  if (!raw || typeof raw !== 'object') return defaultState();

  // v1 -> v2: add missing fields
  if (!raw.version || raw.version < 2) {
    raw.version = STATE_VERSION;

    if (raw.players) {
      raw.players.forEach((p, i) => {
        if (!p.color) p.color = PLAYER_COLORS[i % PLAYER_COLORS.length];
      });
    }

    if (!raw.settings) raw.settings = {};
    if (!raw.settings.scoreDirection) raw.settings.scoreDirection = 'highest';
    if (!raw.settings.language) raw.settings.language = 'es';
    if (!raw.settings.theme) raw.settings.theme = 'auto';
    if (raw.settings.sortByScore === undefined) raw.settings.sortByScore = false;
  }

  return raw;
}

let state = defaultState();
const subscribers = [];

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
  notify();
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      let parsed = JSON.parse(raw);
      parsed = migrateState(parsed);
      const valid = validateState(parsed);
      if (valid) {
        state = { ...defaultState(), ...valid, settings: { ...defaultState().settings, ...valid.settings } };
      }
    }
  } catch (e) {
    console.error('Failed to load game state:', e);
  }
  return state;
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export function subscribe(fn) {
  subscribers.push(fn);
  return () => {
    const idx = subscribers.indexOf(fn);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}

function notify() {
  subscribers.forEach((fn) => fn(state));
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
      const points = -Math.abs(val);
      changes.push({ playerId: p.id, points });
      winnerSum += Math.abs(val);
    }
  });

  changes.push({ playerId: winnerId, points: winnerSum });
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

export function findWinner(players, settings) {
  if (!settings.targetScore) return null;
  if (settings.scoreDirection === 'lowest') {
    return players.find((p) => p.score <= -Math.abs(settings.targetScore)) || null;
  }
  return players.find((p) => p.score >= settings.targetScore) || null;
}

export function getPlayerStats(player, rounds) {
  const playerRounds = rounds.map((r) => r.changes.find((c) => c.playerId === player.id));
  const scores = playerRounds.filter(Boolean).map((c) => c.points);
  const wins = rounds.filter((r) => {
    const maxPts = Math.max(...r.changes.map((c) => c.points));
    return r.changes.some((c) => c.playerId === player.id && c.points === maxPts && c.points > 0);
  }).length;

  return {
    roundsWon: wins,
    avgPerRound: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    bestRound: scores.length ? Math.max(...scores) : 0,
  };
}

export function getSortedPlayers(players, rounds, sortByScore, scoreDirection) {
  const sorted = [...players];
  if (sortByScore && rounds.length > 0) {
    sorted.sort((a, b) =>
      scoreDirection === 'lowest' ? a.score - b.score : b.score - a.score
    );
  }
  return sorted;
}

// --- Archive ---

export function getArchive() {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function archiveCurrentGame() {
  const archive = getArchive();
  archive.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    players: state.players.map((p) => ({ ...p })),
    rounds: [...state.rounds],
    settings: { ...state.settings },
  });
  // Keep last 20 games
  if (archive.length > 20) archive.length = 20;
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
  } catch (e) {
    console.error('Failed to save archive:', e);
  }
}

export function deleteArchiveEntry(id) {
  const archive = getArchive().filter((g) => g.id !== id);
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
  } catch (e) {
    console.error('Failed to update archive:', e);
  }
}

export function getLastGameConfig() {
  const archive = getArchive();
  if (archive.length === 0) return null;
  const last = archive[0];
  return {
    players: last.players.map((p) => ({ ...p, score: 0 })),
    settings: { ...last.settings },
  };
}

export { PLAYER_COLORS, STATE_VERSION };

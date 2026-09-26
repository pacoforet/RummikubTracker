import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimal in-memory localStorage so state.js can be imported and exercised in Node
class MemoryStorage {
  constructor() {
    this.data = new Map();
  }
  getItem(k) {
    return this.data.has(k) ? this.data.get(k) : null;
  }
  setItem(k, v) {
    this.data.set(k, String(v));
  }
  removeItem(k) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
}
globalThis.localStorage = new MemoryStorage();

const {
  calculateTileTotal,
  calculateTileCount,
  calculateStandardRound,
  calculateSimpleRound,
  recalculateScores,
  getPlayerStats,
  findWinner,
  getRoundWinnerIds,
  getGameSummary,
  getPositions,
  sortPlayersByScore,
  validateGameSetup,
  migrateState,
  loadState,
  getState,
  setState,
  archiveCurrentGame,
  getArchive,
  getLastGameConfig,
  ARCHIVE_LIMIT,
} = await import('../js/state.js');

// --- Tests ---

describe('calculateTileTotal', () => {
  it('calculates correct total for numbered tiles', () => {
    const tiles = { 1: 2, 5: 1, 10: 3 };
    assert.equal(calculateTileTotal(tiles), 2 + 5 + 30); // 37
  });

  it('handles joker (value 30)', () => {
    const tiles = { 30: 2 };
    assert.equal(calculateTileTotal(tiles), 60);
  });

  it('returns 0 for empty tiles', () => {
    assert.equal(calculateTileTotal({}), 0);
  });

  it('handles mixed tiles including joker', () => {
    const tiles = { 1: 1, 13: 1, 30: 1 };
    assert.equal(calculateTileTotal(tiles), 1 + 13 + 30); // 44
  });
});

describe('calculateTileCount', () => {
  it('counts total number of tiles', () => {
    const tiles = { 1: 2, 5: 1, 10: 3 };
    assert.equal(calculateTileCount(tiles), 6);
  });

  it('returns 0 for empty tiles', () => {
    assert.equal(calculateTileCount({}), 0);
  });
});

describe('calculateStandardRound', () => {
  const players = [
    { id: 1, name: 'Alice', score: 0 },
    { id: 2, name: 'Bob', score: 0 },
    { id: 3, name: 'Carol', score: 0 },
  ];

  it('winner gets sum of losers tile totals', () => {
    const tileData = {
      2: { 5: 2, 10: 1 }, // Bob: 20 pts
      3: { 3: 1, 7: 2 }, // Carol: 17 pts
    };
    const changes = calculateStandardRound(players, 1, tileData, {});

    const aliceChange = changes.find((c) => c.playerId === 1);
    const bobChange = changes.find((c) => c.playerId === 2);
    const carolChange = changes.find((c) => c.playerId === 3);

    assert.equal(aliceChange.points, 37); // 20 + 17
    assert.equal(bobChange.points, -20);
    assert.equal(carolChange.points, -17);
  });

  it('handles manual inputs for losers', () => {
    const changes = calculateStandardRound(players, 1, {}, { 2: '25', 3: '15' });

    const aliceChange = changes.find((c) => c.playerId === 1);
    assert.equal(aliceChange.points, 40);

    const bobChange = changes.find((c) => c.playerId === 2);
    assert.equal(bobChange.points, -25);
  });

  it('handles zero-point losers', () => {
    const changes = calculateStandardRound(players, 1, {}, {});

    const aliceChange = changes.find((c) => c.playerId === 1);
    assert.equal(aliceChange.points, 0); // No tiles from losers
  });

  it('handles mixed manual and tile input', () => {
    const tileData = {
      3: { 10: 2 }, // Carol: 20 pts from tiles
    };
    const changes = calculateStandardRound(players, 1, tileData, { 2: '30' });

    const aliceChange = changes.find((c) => c.playerId === 1);
    assert.equal(aliceChange.points, 50); // 30 + 20
  });
});

describe('calculateSimpleRound', () => {
  const players = [
    { id: 1, name: 'Alice', score: 0 },
    { id: 2, name: 'Bob', score: 0 },
  ];

  it('applies positive and negative points', () => {
    const changes = calculateSimpleRound(players, { 1: '50', 2: '-30' });
    assert.equal(changes[0].points, 50);
    assert.equal(changes[1].points, -30);
  });

  it('defaults to 0 for empty input', () => {
    const changes = calculateSimpleRound(players, { 1: '', 2: '' });
    assert.equal(changes[0].points, 0);
    assert.equal(changes[1].points, 0);
  });

  it('handles non-numeric input gracefully', () => {
    const changes = calculateSimpleRound(players, { 1: 'abc', 2: '10' });
    assert.equal(changes[0].points, 0);
    assert.equal(changes[1].points, 10);
  });
});

describe('recalculateScores', () => {
  it('recalculates from scratch across multiple rounds', () => {
    const players = [
      { id: 1, name: 'Alice', score: 999 }, // Old score should be reset
      { id: 2, name: 'Bob', score: 999 },
    ];
    const rounds = [
      {
        id: 1,
        changes: [
          { playerId: 1, points: 50 },
          { playerId: 2, points: -50 },
        ],
      },
      {
        id: 2,
        changes: [
          { playerId: 1, points: -30 },
          { playerId: 2, points: 30 },
        ],
      },
    ];

    recalculateScores(players, rounds);
    assert.equal(players[0].score, 20); // 50 - 30
    assert.equal(players[1].score, -20); // -50 + 30
  });

  it('handles empty rounds', () => {
    const players = [{ id: 1, name: 'Alice', score: 100 }];
    recalculateScores(players, []);
    assert.equal(players[0].score, 0);
  });

  it('handles missing player in changes gracefully', () => {
    const players = [{ id: 1, name: 'Alice', score: 0 }];
    const rounds = [
      {
        id: 1,
        changes: [
          { playerId: 1, points: 10 },
          { playerId: 99, points: -10 },
        ],
      },
    ];
    recalculateScores(players, rounds);
    assert.equal(players[0].score, 10);
  });
});

describe('getPlayerStats', () => {
  const player = { id: 1, name: 'Alice', score: 0 };

  it('calculates rounds won correctly', () => {
    const rounds = [
      {
        id: 1,
        changes: [
          { playerId: 1, points: 50 },
          { playerId: 2, points: -50 },
        ],
      },
      {
        id: 2,
        changes: [
          { playerId: 1, points: -20 },
          { playerId: 2, points: 20 },
        ],
      },
      {
        id: 3,
        changes: [
          { playerId: 1, points: 30 },
          { playerId: 2, points: -30 },
        ],
      },
    ];

    const stats = getPlayerStats(player, rounds);
    assert.equal(stats.roundsWon, 2);
  });

  it('calculates average per round', () => {
    const rounds = [
      { id: 1, changes: [{ playerId: 1, points: 30 }] },
      { id: 2, changes: [{ playerId: 1, points: -10 }] },
      { id: 3, changes: [{ playerId: 1, points: 40 }] },
    ];

    const stats = getPlayerStats(player, rounds);
    assert.equal(stats.avgPerRound, 20); // (30 - 10 + 40) / 3 = 20
  });

  it('finds best round', () => {
    const rounds = [
      { id: 1, changes: [{ playerId: 1, points: 10 }] },
      { id: 2, changes: [{ playerId: 1, points: 75 }] },
      { id: 3, changes: [{ playerId: 1, points: 25 }] },
    ];

    const stats = getPlayerStats(player, rounds);
    assert.equal(stats.bestRound, 75);
  });

  it('handles no rounds', () => {
    const stats = getPlayerStats(player, []);
    assert.equal(stats.roundsWon, 0);
    assert.equal(stats.avgPerRound, 0);
    assert.equal(stats.bestRound, 0);
  });
});

describe('calculateStandardRound without winner', () => {
  it('only returns loser changes (used for live projections)', () => {
    const players = [
      { id: 1, score: 0 },
      { id: 2, score: 0 },
    ];
    const changes = calculateStandardRound(players, null, { 1: { 5: 1 } }, {});
    assert.deepEqual(changes, [
      { playerId: 1, points: -5 },
      { playerId: 2, points: 0 },
    ]);
  });
});

describe('findWinner', () => {
  it('returns null without target', () => {
    assert.equal(findWinner([{ id: 1, score: 500 }], { targetScore: null }), null);
  });

  it('returns the highest scorer when several cross the target', () => {
    const players = [
      { id: 1, score: 210 },
      { id: 2, score: 260 },
      { id: 3, score: 50 },
    ];
    assert.equal(findWinner(players, { targetScore: 200 }).id, 2);
  });

  it('returns null when nobody reached it', () => {
    assert.equal(findWinner([{ id: 1, score: 199 }], { targetScore: 200 }), null);
  });
});

describe('getRoundWinnerIds / stats consistency', () => {
  const tied = {
    changes: [
      { playerId: 1, points: 20 },
      { playerId: 2, points: 20 },
      { playerId: 3, points: -40 },
    ],
  };

  it('counts every tied top scorer as a round winner', () => {
    assert.deepEqual(getRoundWinnerIds(tied), [1, 2]);
    assert.equal(getPlayerStats({ id: 2 }, [tied]).roundsWon, 1);
  });

  it('has no winner when nobody scored positive', () => {
    assert.deepEqual(getRoundWinnerIds({ changes: [{ playerId: 1, points: 0 }] }), []);
  });
});

describe('getGameSummary', () => {
  const players = [
    { id: 1, name: 'Ana', score: 0 },
    { id: 2, name: 'Bea', score: 0 },
  ];

  it('returns best round and most wins', () => {
    const rounds = [
      {
        changes: [
          { playerId: 1, points: 10 },
          { playerId: 2, points: -10 },
        ],
      },
      {
        changes: [
          { playerId: 1, points: 5 },
          { playerId: 2, points: -5 },
        ],
      },
      {
        changes: [
          { playerId: 2, points: 40 },
          { playerId: 1, points: -40 },
        ],
      },
    ];
    const summary = getGameSummary(players, rounds);
    assert.equal(summary.totalRounds, 3);
    assert.equal(summary.bestRound.player.id, 2);
    assert.equal(summary.bestRound.points, 40);
    assert.equal(summary.mostWins.player.id, 1);
    assert.equal(summary.mostWins.count, 2);
  });

  it('omits most wins when nobody won a round', () => {
    const summary = getGameSummary(players, [{ changes: [{ playerId: 1, points: 0 }] }]);
    assert.equal(summary.mostWins, null);
    assert.equal(summary.bestRound, null);
  });
});

describe('getPositions', () => {
  it('shares positions on ties and is 0 before any round', () => {
    const players = [
      { id: 1, score: 10 },
      { id: 2, score: 30 },
      { id: 3, score: 10 },
    ];
    assert.deepEqual(getPositions(players, [{}]), { 1: 2, 2: 1, 3: 2 });
    assert.deepEqual(getPositions(players, []), { 1: 0, 2: 0, 3: 0 });
  });

  it('sortPlayersByScore does not mutate input', () => {
    const players = [{ score: 1 }, { score: 2 }];
    sortPlayersByScore(players);
    assert.equal(players[0].score, 1);
  });
});

describe('validateGameSetup', () => {
  const players = [
    { id: 1, name: ' Ana ' },
    { id: 2, name: 'Bea' },
  ];

  it('accepts an empty target and trims names', () => {
    const r = validateGameSetup(players, '');
    assert.equal(r.ok, true);
    assert.equal(r.targetScore, null);
    assert.equal(r.players[0].name, 'Ana');
  });

  it('parses a positive integer target', () => {
    assert.equal(validateGameSetup(players, '200').targetScore, 200);
  });

  for (const bad of ['0', '-5', '1.5', 'abc']) {
    it(`rejects target "${bad}"`, () => {
      assert.deepEqual(validateGameSetup(players, bad), {
        ok: false,
        error: 'dialog.invalidTarget',
      });
    });
  }

  it('rejects empty names', () => {
    const r = validateGameSetup(
      [
        { id: 1, name: '  ' },
        { id: 2, name: 'B' },
      ],
      ''
    );
    assert.equal(r.error, 'dialog.emptyName');
  });

  it('rejects duplicate names (case-insensitive)', () => {
    const r = validateGameSetup(
      [
        { id: 1, name: 'ana' },
        { id: 2, name: 'ANA ' },
      ],
      ''
    );
    assert.equal(r.error, 'dialog.duplicateName');
  });
});

describe('migrateState', () => {
  it('upgrades v2 state to v3', () => {
    const migrated = migrateState({
      version: 2,
      players: [],
      rounds: [],
      settings: { scoreDirection: 'highest', language: 'en', theme: 'dark', sortByScore: true },
    });
    assert.equal(migrated.version, 3);
    assert.equal('scoreDirection' in migrated.settings, false);
    assert.equal(migrated.winnerAnnounced, null);
    assert.equal(migrated.settings.language, 'en');
  });

  it('upgrades v1 state (adds colors and settings)', () => {
    const migrated = migrateState({ players: [{ id: 1, name: 'A', score: 0 }], rounds: [] });
    assert.equal(migrated.version, 3);
    assert.ok(migrated.players[0].color);
    assert.equal(migrated.settings.theme, 'auto');
  });
});

describe('loadState', () => {
  beforeEach(() => localStorage.clear());

  it('loads a valid saved game', () => {
    const saved = {
      version: 3,
      players: [
        { id: 1, name: 'A', color: '#4A90E2', score: 5 },
        { id: 2, name: 'B', color: '#E25C5C', score: -5 },
      ],
      rounds: [{ id: 1, changes: [] }],
      settings: { rule: 'simple' },
      gameActive: true,
      winnerAnnounced: null,
    };
    localStorage.setItem('rummikub_data', JSON.stringify(saved));
    const { state, recovered } = loadState();
    assert.equal(recovered, false);
    assert.equal(state.players[0].score, 5);
    assert.equal(state.settings.rule, 'simple');
    assert.equal(state.settings.theme, 'auto'); // default filled in
  });

  it('backs up corrupted data instead of discarding it', () => {
    localStorage.setItem('rummikub_data', '{not json');
    const { recovered } = loadState();
    assert.equal(recovered, true);
    assert.equal(localStorage.getItem('rummikub_data_backup'), '{not json');
  });

  it('replaces unsafe player colors', () => {
    localStorage.setItem(
      'rummikub_data',
      JSON.stringify({
        version: 3,
        players: [
          { id: 1, name: 'A', color: 'red;background:url(x)', score: 0 },
          { id: 2, name: 'B', color: '#E25C5C', score: 0 },
        ],
        rounds: [],
        settings: {},
      })
    );
    const { state } = loadState();
    assert.match(state.players[0].color, /^#[0-9a-f]{6}$/i);
  });
});

describe('archive', () => {
  beforeEach(() => localStorage.clear());

  it('getLastGameConfig only carries game rules, not app preferences', () => {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, rule: 'simple', targetScore: 150, language: 'en', theme: 'dark' },
    }));
    archiveCurrentGame();
    const config = getLastGameConfig();
    assert.deepEqual(config.settings, { rule: 'simple', targetScore: 150 });
    assert.ok(config.players.every((p) => p.score === 0));
  });

  it('reports how many games were trimmed past the limit', () => {
    for (let i = 0; i < ARCHIVE_LIMIT; i++) assert.equal(archiveCurrentGame().trimmed, 0);
    assert.equal(archiveCurrentGame().trimmed, 1);
    assert.equal(getArchive().length, ARCHIVE_LIMIT);
  });

  it('ignores malformed archive entries', () => {
    localStorage.setItem('rummikub_archive', JSON.stringify([null, { players: 'x' }]));
    assert.deepEqual(getArchive(), []);
  });

  it('getState reflects setState', () => {
    setState({ gameActive: true });
    assert.equal(getState().gameActive, true);
  });
});

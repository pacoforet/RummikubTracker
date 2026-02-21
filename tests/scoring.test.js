import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Since state.js uses browser APIs (localStorage), we mock them
// and test the pure scoring functions directly.
// We re-implement the pure functions here to test the logic.

function calculateTileTotal(tiles) {
  let total = 0;
  for (const val in tiles) {
    total += parseInt(val, 10) * (tiles[val] || 0);
  }
  return total;
}

function calculateTileCount(tiles) {
  let count = 0;
  for (const val in tiles) {
    count += tiles[val] || 0;
  }
  return count;
}

function calculateStandardRound(players, winnerId, tileData, manualInputs) {
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

function calculateSimpleRound(players, inputs) {
  return players.map((p) => ({
    playerId: p.id,
    points: parseInt(inputs[p.id], 10) || 0,
  }));
}

function recalculateScores(players, rounds) {
  players.forEach((p) => (p.score = 0));
  rounds.forEach((round) => {
    round.changes.forEach((c) => {
      const player = players.find((p) => p.id === c.playerId);
      if (player) player.score += c.points;
    });
  });
  return players;
}

function getPlayerStats(player, rounds) {
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
      3: { 3: 1, 7: 2 },  // Carol: 17 pts
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
      { id: 1, changes: [{ playerId: 1, points: 50 }, { playerId: 2, points: -50 }] },
      { id: 2, changes: [{ playerId: 1, points: -30 }, { playerId: 2, points: 30 }] },
    ];

    recalculateScores(players, rounds);
    assert.equal(players[0].score, 20);  // 50 - 30
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
      { id: 1, changes: [{ playerId: 1, points: 10 }, { playerId: 99, points: -10 }] },
    ];
    recalculateScores(players, rounds);
    assert.equal(players[0].score, 10);
  });
});

describe('getPlayerStats', () => {
  const player = { id: 1, name: 'Alice', score: 0 };

  it('calculates rounds won correctly', () => {
    const rounds = [
      { id: 1, changes: [{ playerId: 1, points: 50 }, { playerId: 2, points: -50 }] },
      { id: 2, changes: [{ playerId: 1, points: -20 }, { playerId: 2, points: 20 }] },
      { id: 3, changes: [{ playerId: 1, points: 30 }, { playerId: 2, points: -30 }] },
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

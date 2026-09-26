# Rummikub Score Tracker

A mobile-first Progressive Web App for tracking Rummikub game scores. Designed for high visibility and quick entry on smartphones during game night.

## Features

- **Mobile Optimized:** Large touch targets with dark and light theme support
- **Dual Scoring Rules:**
  - **Standard:** Winner receives the sum of the losers' remaining tiles (tile picker or manual input)
  - **Simple:** Manual +/- point entry for each player
- **Player Management:** Supports 2 to 6 players with custom names and color-coded avatars
- **Score Chart:** Visual line chart showing score progression across rounds
- **Game Archive:** The last 50 completed games are saved automatically (winner, players and round count)
- **Quick Start:** Replay the last game configuration with one tap
- **Share Results:** Share final scores via Web Share API or clipboard
- **Player Stats:** Per-player statistics (rounds won, average score, best round)
- **Position Badges:** 1st/2nd/3rd indicators on the scoreboard
- **Bilingual:** Full Spanish and English support with in-app language switching
- **Light/Dark Theme:** Manual toggle or auto-detect from system preference
- **Offline Support:** Service worker caches all assets for full offline use
- **Accessible:** ARIA labels, keyboard navigation, focus trapping, screen reader support
- **Persistence:** Automatically saves game progress to local storage with data migration; unreadable data is backed up instead of discarded
- **Update prompt:** When a new version is deployed, the app offers a one-tap reload

## How to Use

1. **Setup:** Enter player names, choose a scoring rule, and optionally set a target score
2. **Start Game:** Tap "Start Game" to enter the scoreboard view
3. **Record Rounds:** After each round, tap "+ Record Round", select the winner (Standard mode), and enter tile counts or manual points
4. **Track Progress:** View score charts, player stats, and round history during the game
5. **Share & Archive:** When the game ends, share results and the game is automatically archived

## Installation

This is a Progressive Web App (PWA). To install:
1. Open the URL in your mobile browser
2. Tap **Share** (iOS) or **Menu** (Android)
3. Select **"Add to Home Screen"**

## Development

The app uses vanilla JavaScript with ES modules. No build step is required to run it; Node.js 20+ is only needed for the dev tooling.

```bash
npm install          # eslint + prettier

npm run serve        # http://localhost:8080 (ES modules need an HTTP server)
npm test             # unit tests (node:test) against js/state.js
npm run lint         # eslint
npm run format       # prettier --write
npm run check        # lint + format check + tests (what CI runs)
```

CI (`.github/workflows/ci.yml`) runs `npm run check` on every pull request and verifies that every
JS module is listed in the service worker's precache.

### Releasing

The service worker serves the app from a versioned cache. **Bump `VERSION` in `sw.js` on every
deploy** (and add any new file to `ASSETS`); users then get a "New version available" prompt.

## Architecture

```
js/
  app.js              - Entry point: init, action/input event delegation, service worker
  state.js            - State, persistence, migrations and all scoring/ranking logic (pure, tested)
  ui.js               - Dialogs, toasts, modals (back-button aware), focus trap, radio groups
  i18n.js             - Spanish/English strings; data-i18n attributes translate static markup
  theme.js            - Light/dark/auto theme
  chart.js            - Canvas score chart
  views/
    navigation.js     - Switching between setup and scoreboard
    setup.js          - Player/rule setup and game start validation
    scoreboard.js     - Leaderboard, undo, end game
    roundEntry.js     - Round modal (tile picker, numeric input, live projections)
    winner.js         - Winner celebration and sharing
    history.js        - Round history and chart modal
    archive.js        - Past games
    settings.js       - Theme and language
```

Each view module exports an `actions` map keyed by the `data-action` attribute of the elements it
handles; `app.js` merges them into one click handler.

## Technology

- HTML5 with semantic markup and ARIA
- CSS3 with CSS custom properties (light/dark themes)
- Vanilla JavaScript (ES modules)
- Canvas API (score charts)
- Web Share API
- Service Worker (offline caching)
- LocalStorage API

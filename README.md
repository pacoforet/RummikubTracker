# Rummikub Score Tracker

A mobile-first Progressive Web App for tracking Rummikub game scores. Designed for high visibility and quick entry on smartphones during game night.

## Features

- **Mobile Optimized:** Large touch targets with dark and light theme support
- **Dual Scoring Rules:**
  - **Standard:** Winner receives the sum of the losers' remaining tiles (tile picker or manual input)
  - **Simple:** Manual +/- point entry for each player
- **Player Management:** Supports 2 to 6 players with custom names and color-coded avatars
- **Score Chart:** Visual line chart showing score progression across rounds
- **Game Archive:** Completed games are automatically saved and reviewable
- **Quick Start:** Replay the last game configuration with one tap
- **Share Results:** Share final scores via Web Share API or clipboard
- **Player Stats:** Per-player statistics (rounds won, average score, best round)
- **Position Badges:** 1st/2nd/3rd indicators on the scoreboard
- **Bilingual:** Full Spanish and English support with in-app language switching
- **Light/Dark Theme:** Manual toggle or auto-detect from system preference
- **Offline Support:** Service worker caches all assets for full offline use
- **Accessible:** ARIA labels, keyboard navigation, focus trapping, screen reader support
- **Persistence:** Automatically saves game progress to local storage with data migration

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

The app uses vanilla JavaScript with ES modules. No build step required.

```bash
# Serve locally (ES modules require HTTP server)
python3 -m http.server 8080

# Run tests
node --test tests/

# Lint (requires eslint installed)
npx eslint js/
```

## Architecture

```
js/
  app.js      - Main application logic and event delegation
  state.js    - State management, persistence, scoring calculations
  ui.js       - Custom dialogs, toasts, modal management
  chart.js    - Canvas-based score chart
  i18n.js     - Internationalization (Spanish/English)
```

## Technology

- HTML5 with semantic markup and ARIA
- CSS3 with CSS custom properties (light/dark themes)
- Vanilla JavaScript (ES modules)
- Canvas API (score charts)
- Web Share API
- Service Worker (offline caching)
- LocalStorage API

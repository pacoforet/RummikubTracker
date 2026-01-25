# Rummikub Score Tracker

A mobile-first web application to track Rummikub game scores with ease. Designed for high visibility and quick entry on smartphones.

## Features

- **Mobile Optimized:** Large touch targets and high-contrast dark mode for use during game night.
- **Dual Scoring Rules:**
  - **Standard:** Follows official rules where the winner receives the sum of the losers' remaining tiles, and losers receive negative points.
  - **Simple:** Manual addition or subtraction of points for each player.
- **Player Management:** Supports 2 to 4 players with custom names.
- **Target Scores:** Optional goal setting to track when a player reaches a specific limit.
- **Game History:** Review round-by-round results within the current session.
- **Persistence:** Automatically saves your game progress to your browser's local storage.

## How to Use

1. **Setup:** Enter player names and choose your scoring rule.
2. **Start Game:** Hit start to enter the scoreboard view.
3. **Record Rounds:** After each round, tap "Record Round", select the winner (in Standard mode), and enter the tile counts.
4. **End Game:** Use the "End" button to clear the current session and start fresh.

## Installation

This is a Progressive Web App (PWA). To use it like a native app:
1. Open the URL on your mobile browser.
2. Tap the **Share** button (iOS) or **Menu** (Android).
3. Select **"Add to Home Screen"**.

## Technology

- HTML5
- CSS3 (Material Design inspired)
- Vanilla JavaScript
- LocalStorage API

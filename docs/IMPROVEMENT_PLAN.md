# Rummikub Tracker - Comprehensive Improvement Plan

## Current State Summary

Rummikub Tracker is a vanilla JS Progressive Web App for tracking Rummikub game scores. It has a dark-mode-first, mobile-optimized UI with two scoring modes (Standard and Simple), support for 2-4 players, tile grid picking, round history, undo, and localStorage persistence. The entire app is ~570 lines of JS, ~700 lines of CSS, and ~160 lines of HTML with zero dependencies.

---

## 1. Feature Improvements

### 1.1 Player Management Enhancements

- **Raise player limit to 6**: Rummikub supports up to 4 players officially but many groups play team variants or just want more seats. Raise from 4 to at least 6, and make the leaderboard grid adapt (2-col for 2-4, 3-col for 5-6).
- **Player avatars with color selection**: Let each player pick an avatar color from a predefined palette instead of the generic gray circle. Store the color in player state.
- **Reorder players**: Add drag-to-reorder on the setup screen so players can arrange their seating order.
- **Player statistics**: Track per-player stats across the current game: rounds won, average score per round, best single round, current streak.

### 1.2 Game Flow Improvements

- **Multi-game session / tournament mode**: Allow playing a series of games (e.g., best of 5) with cumulative tracking. Show an overall tournament scoreboard alongside the current game.
- **Configurable target score direction**: Some variants play to the *lowest* score. Add a toggle: "Highest score wins" vs "Lowest score wins".
- **Timer per round**: Optional round timer with configurable duration. Helpful for keeping game pace.
- **Quick-start with presets**: Remember the last game configuration (players, rule, target) and offer a "Play Again" button that recreates the same setup instantly.
- **Pause/resume game**: Explicit pause state with a timestamp so players know when they stopped.

### 1.3 Scoring Enhancements

- **Tile color tracking (optional)**: In standard Rummikub, tiles come in 4 colors. Offer an advanced mode that lets players track tile colors for more detailed history.
- **Score validation**: In standard mode, warn if a loser's tile total seems unreasonably high (e.g., >100 points from a single player).
- **Running totals in round entry**: Show each player's projected new total while entering the round, so players can see the impact before saving.
- **Batch round entry**: Allow entering multiple rounds at once (useful when catching up after several rounds played without the app).

### 1.4 History & Analytics

- **Score chart/graph**: Show a line chart of each player's score progression across rounds. Use a lightweight charting approach (CSS or canvas-based, no heavy library).
- **Game summary at end**: When a game ends, show a detailed summary: total rounds, biggest comeback, highest single-round score, most rounds won, etc.
- **Export game data**: Allow exporting the current game as JSON or a shareable text summary (for pasting into group chats).
- **Game archive**: Save completed games to a history archive (separate localStorage key) so players can review past games.

### 1.5 Social & Sharing

- **Share results**: Generate a shareable text or image summary of the final scores that can be sent via the Web Share API.
- **Screenshot mode**: A clean, minimal view of the final standings designed for taking screenshots.

---

## 2. UI/UX Improvements

### 2.1 Navigation & Flow

- **Onboarding / first-use experience**: Show a brief 2-3 step tutorial overlay on first launch explaining setup, scoring, and the tile picker.
- **Swipe gestures**: Support swiping up on the scoreboard to open round entry, and swiping down on modals to dismiss them (bottom-sheet pattern).
- **Back button / escape key handling**: Pressing the browser back button or Escape should close open modals instead of navigating away. Use the History API or `popstate` event.
- **Breadcrumb awareness**: Show the current game state in the header (e.g., "Game in progress - Round 5") so users always know where they are.

### 2.2 Scoreboard Improvements

- **Sort players by score**: Add a toggle to sort the leaderboard by score (descending) vs. by seating order. Default to score-sorted.
- **Score delta indicators**: After each round, briefly show the +/- change on each player's score card with an animation (e.g., "+45" floating up and fading).
- **Position indicators**: Show 1st, 2nd, 3rd, 4th badges on score cards.
- **Mini score chart per player**: A tiny sparkline under each player's score showing their trajectory.
- **Highlight negative scores**: Use a distinct color (red tint) for players in negative territory.

### 2.3 Round Entry Improvements

- **Tile picker UX**: The current right-click-to-remove pattern is not discoverable on mobile (no right-click). Add a visible "-" button or support long-press to decrement. Current mobile users have no way to remove individual tiles.
- **Tile picker summary**: Show a breakdown of selected tiles (e.g., "3x 10, 2x 7, 1x Joker = 74 pts") above the grid for verification.
- **Pre-select losers' tiles from previous round**: Option to copy tile selections from the previous round as a starting point.
- **Keyboard optimization**: When manual input mode is active, auto-focus the input field and show the numeric keyboard.
- **Undo within round entry**: Allow removing the last tile tap without clearing everything.

### 2.4 Modal Improvements

- **Backdrop click to close**: Clicking/tapping the dark overlay behind a modal should close it.
- **Modal transition on close**: Currently modals disappear instantly. Add a slide-down animation for closing.
- **Scroll indicator**: When modal content is scrollable, show a subtle shadow or indicator at the bottom.
- **Fullscreen modals on mobile**: On very small screens (<375px), modals should take the full screen instead of bottom-sheet style.

### 2.5 Confirmation Dialogs

- **Replace native `alert()` and `confirm()` with custom modals**: The native browser dialogs break the visual experience. Build custom confirmation/alert components that match the app theme.
- **Toast notifications**: For non-critical feedback (round saved, game saved), use in-app toast notifications instead of blocking dialogs.

### 2.6 Empty & Error States

- **Better empty states**: The scoreboard before any rounds and the history with no rounds should have illustrated empty states with helpful text (e.g., "No rounds yet. Tap the button below to record your first round!").
- **Error recovery UI**: If localStorage is corrupted, show a friendly error screen with a "Reset App" option instead of silently failing.
- **Offline indicator**: Show a subtle banner when the app is offline (relevant for PWA usage).

---

## 3. Design Improvements

### 3.1 Visual Polish

- **Light mode support**: Add a light theme and a toggle (or auto-detect from system preference via `prefers-color-scheme`). Many users play during daytime.
- **Refined color palette**: The current palette is functional but could be more cohesive. Consider a slightly warmer dark background (`#1a1a2e` or `#16213e`) to feel less stark.
- **Consistent spacing system**: Define a spacing scale (4, 8, 12, 16, 24, 32, 48px) and use it consistently. Currently spacing is ad-hoc (10, 15, 20px mixed).
- **Better typography scale**: Define a modular type scale (e.g., 12, 14, 16, 20, 24, 32, 48) and apply consistently. Currently sizes are close but not systematic.
- **Card elevation hierarchy**: Use subtle box-shadows to create depth. Currently all cards are flat; adding shadow differentiates interactive elements from static surfaces.
- **Micro-interactions**: Add subtle scale/color animations on button presses, score changes, and player card selections. The tile `:active` scale is good; extend this pattern.

### 3.2 Layout

- **Max-width container**: The app should have a max-width (~480px) on larger screens so it doesn't stretch to fill wide tablets or desktop browsers. Center the content.
- **Responsive grid for 3 players**: With 3 players, the current 2-column grid creates an awkward 2+1 layout. Use a 3-column grid for 3 players, 2x2 for 4.
- **Sticky header refinement**: The header should have a subtle blur backdrop effect (`backdrop-filter: blur(10px)`) for a modern glass-morphism feel.
- **Bottom navigation bar**: Consider a proper bottom tab bar (Setup, Scoreboard, History, Stats) instead of hiding views behind buttons. This is more standard for mobile apps.

### 3.3 Animations & Transitions

- **Page transitions**: Add directional slide transitions between Setup and Scoreboard views (slide left to enter game, slide right to go back).
- **Score counting animation**: When scores update, animate the number counting up/down instead of instant changes.
- **Confetti improvements**: The current confetti is basic CSS. Use randomized sizes, rotation speeds, and more particles for a richer celebration. Consider a brief haptic feedback via `navigator.vibrate()`.
- **Staggered list animations**: When rendering the scoreboard or history, stagger each card's entrance by ~50ms for a cascading effect.

### 3.4 Iconography

- **Consistent icon set**: Currently only one SVG icon is used (clock for history). Add icons for: undo, end game, settings, add player, remove player, share, chart. Use a consistent icon style (outlined, 24px, 2px stroke).
- **App icon set**: The manifest only has one 192x192 icon. Provide multiple sizes (48, 72, 96, 128, 144, 192, 256, 384, 512) for proper PWA support across devices. Separate `any` and `maskable` purposes.

### 3.5 Branding

- **Custom splash screen**: Add a proper PWA splash screen with the app logo and name for the loading transition.
- **Themed scrollbar**: Style the scrollbar to match the dark theme on desktop browsers.
- **Favicon**: Add a proper favicon for browser tab display.

---

## 4. Technical / Code Quality Improvements

### 4.1 Architecture

- **Modular code structure**: Split `app.js` into logical modules:
  - `state.js` - State management and persistence
  - `setup.js` - Setup view logic
  - `scoreboard.js` - Scoreboard rendering
  - `round-entry.js` - Round entry modal logic
  - `history.js` - History tracking and display
  - `utils.js` - Shared utilities
  - `app.js` - Main entry point and initialization
- **Event delegation**: Replace all inline `onclick` handlers with event delegation. Attach listeners to parent containers and use `data-*` attributes for action routing. This is more maintainable and performant.
- **Template engine**: Extract HTML generation from JS into template functions or a simple template system. The current `innerHTML` string concatenation is fragile and hard to maintain.
- **Reactive rendering**: Implement a simple reactive pattern where state changes automatically trigger re-renders of affected components, instead of manual `renderScoreboard()` calls scattered throughout.

### 4.2 Data & State

- **State validation on load**: Validate the shape and types of loaded localStorage data. Currently `{ ...this.state, ...parsed }` could merge incompatible structures silently.
- **Data migration system**: Add a version number to the saved state. When the schema changes, migrate old data forward instead of relying on spread merge.
- **IndexedDB for game archive**: For storing historical games, use IndexedDB (more storage, structured queries) while keeping current-game state in localStorage for simplicity.
- **Immutable state updates**: Avoid direct mutation of `this.state`. Use a pattern that creates new state objects for each change, making undo/redo and debugging easier.

### 4.3 PWA Enhancements

- **Service Worker**: The manifest references PWA capabilities but there is no service worker. Add one for:
  - Offline caching (the app should work fully offline)
  - App install prompts
  - Cache versioning for updates
- **Multiple icon sizes**: Provide 48, 72, 96, 128, 144, 192, 256, 384, 512px icons.
- **Screenshots in manifest**: Add screenshot entries so the install prompt shows preview images.
- **Proper install flow**: Intercept the `beforeinstallprompt` event and show a custom in-app install banner.

### 4.4 Accessibility (a11y)

- **ARIA labels**: Add `aria-label` to all icon buttons, close buttons, and interactive elements that lack visible text.
- **Role attributes**: Add `role="dialog"` and `aria-modal="true"` to modals. Add `role="alert"` to error messages.
- **Focus trapping**: When a modal is open, trap focus within it. Return focus to the trigger element when closed.
- **Keyboard navigation**: Ensure all interactive elements are focusable and operable via keyboard (Tab, Enter, Escape).
- **Screen reader announcements**: Use `aria-live` regions to announce score changes, round completions, and winner celebrations.
- **Color contrast audit**: Verify all text/background combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text). The `--text-sec` (#B0B3B8) on `--bg-color` (#121212) should be checked.
- **Remove `user-scalable=no`**: This prevents zoom and hurts accessibility. Use `user-scalable=yes` instead.

### 4.5 Performance

- **DOM update batching**: Currently, `renderScoreboard()` clears and rebuilds the entire leaderboard on every update. Diff and patch only changed elements.
- **Debounce saves**: `saveGame()` is called on every keystroke in player name inputs. Debounce with ~300ms delay.
- **Lazy modal rendering**: Don't render modal content until the modal is opened. Currently the DOM contains all modal structures even when unused.

### 4.6 Error Handling

- **Try-catch around all localStorage operations**: Writes can fail if storage is full. Handle gracefully with a user-facing message.
- **Input sanitization**: Validate all numeric inputs (`parseInt` can produce `NaN`). The current `|| 0` fallback is good but should be more explicit.
- **Corrupted state recovery**: If the loaded state is structurally invalid, show a recovery dialog rather than silently merging bad data.

### 4.7 Testing

- **Add a test framework**: Set up a minimal test configuration (e.g., Vitest or plain Node.js test runner) for unit tests.
- **Core logic tests**: Test scoring calculations (standard mode, simple mode), undo logic, round deletion with recalculation, and state persistence.
- **UI smoke tests**: Use Playwright or similar for basic end-to-end tests (start game, enter round, check scores, undo).

### 4.8 Build & Tooling

- **Add `.gitignore`**: Currently missing. Should ignore `.DS_Store`, `node_modules/`, editor files, etc.
- **Add a `package.json`**: Even without npm dependencies, it provides metadata, scripts for linting/testing, and is needed if any tooling is added.
- **Linting**: Add ESLint with a reasonable config for code consistency.
- **Formatting**: Add Prettier for consistent code formatting.
- **CSS organization**: Consider splitting `styles.css` into component-scoped files or at minimum add clear section headers with a table of contents comment at the top.

### 4.9 Internationalization (i18n)

- **Extract all strings**: Currently all UI text is hardcoded in Spanish across HTML and JS. Extract to a translations object so adding languages is straightforward.
- **Language switcher**: Allow users to toggle between Spanish and English (at minimum).
- **RTL support**: If future languages require it, ensure the layout doesn't break with right-to-left text direction.

### 4.10 Security

- **Content Security Policy**: Add CSP headers or meta tag to prevent XSS. The `escapeHtml()` function is good but a CSP adds defense-in-depth.
- **Subresource Integrity**: If any CDN resources are added in the future, use SRI hashes.

---

## 5. Priority Roadmap

### Phase 1 - Foundation (High Impact, Fixes Critical Gaps)
1. Add service worker for offline support
2. Fix tile removal UX on mobile (long-press or visible "-" button)
3. Replace native `alert()`/`confirm()` with themed custom dialogs
4. Add `.gitignore` and `package.json`
5. Add ARIA labels and keyboard accessibility
6. Remove `user-scalable=no` from viewport meta
7. Add backdrop-click-to-close on modals
8. Extract hardcoded strings for i18n readiness
9. Add state validation on localStorage load

### Phase 2 - Polish (UX & Design Refinement)
1. Light mode / system theme preference support
2. Score delta animations on the scoreboard
3. Modal close animations (slide-down)
4. Player position indicators (1st, 2nd, etc.)
5. Better empty states with helpful text
6. Toast notification system
7. Running totals during round entry
8. Max-width container for tablet/desktop
9. Multiple PWA icon sizes and screenshots

### Phase 3 - Features (New Capabilities)
1. Score progression chart
2. Game summary at end
3. Game archive (save completed games)
4. Quick-start / play again from last configuration
5. Player stats (rounds won, averages)
6. Share results via Web Share API
7. Sort leaderboard by score toggle
8. Responsive grid for 3-player layout

### Phase 4 - Architecture (Long-term Maintainability)
1. Modularize JS into separate files
2. Replace inline onclick handlers with event delegation
3. Add unit tests for scoring logic
4. Add end-to-end tests
5. Set up ESLint + Prettier
6. Implement data migration system
7. Reactive state management pattern
8. CSS organization and spacing system

---

## 6. Quick Wins (Can Be Done Immediately)

These require minimal code changes and deliver noticeable improvement:

| Change | Impact | Effort |
|--------|--------|--------|
| Add `role="dialog"` and `aria-modal` to modals | Accessibility | ~5 min |
| Add `aria-label` to icon/close buttons | Accessibility | ~10 min |
| Remove `user-scalable=no` | Accessibility | ~1 min |
| Add `.gitignore` | Hygiene | ~2 min |
| Backdrop click to close modals | UX | ~15 min |
| Debounce `saveGame` on name input | Performance | ~10 min |
| Add `max-width: 480px` + `margin: auto` to views | Design | ~5 min |
| Show position badges (1st, 2nd) on score cards | UX | ~20 min |
| Add Escape key to close modals | UX | ~10 min |
| Add `try-catch` around `localStorage.setItem` | Reliability | ~5 min |

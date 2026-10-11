# Fairy's Arcade — Version 3.6

A multi-page, retro arcade-inspired portfolio for Seth Eulice T. Semilla. The original mini-games and six added games are preserved, with Fairy's logo and the existing site features intact.

## Run locally in VS Code

1. Extract the ZIP to a folder.
2. Open that folder in VS Code.
3. Open **Terminal → New Terminal** in the project root.
4. Run `npm install` (the current project has no external runtime dependencies, but this keeps the setup step familiar).
5. Run `npm start`.
6. Visit `http://localhost:3000`.

`npm test` checks the shared JavaScript and server syntax. The small built-in Node server serves the static pages and game directories without requiring Express.

## Pages

- `index.html` — Press Start, Fairy's guided intro, and destination hub
- `about.html` — About Me
- `skills.html` — Skills / Experience context and the original education cards
- `projects.html` — project reference for the supplied EnerhAIa capstone prototype
- `arcade.html` — the original mini-games plus Galaga, 2048, Frogger, Whack-a-Mole, Dinosaur Run, and Doodle Jumper
- `contact.html` — existing Facebook contact link

## Fairy and audio

Fairy's tutorial appears after Press Start on Home. Skip Tutorial and Escape lead into her floating assistant. Fairy currently uses local scripted responses and does **not** call a live AI service. The compact Arcade Radio stays available on the page; activate its title or track name to open the full library popup. The popup supports searching the playlist, choosing tracks, play/pause, previous/next, and volume control. The ZIP currently contains `Level-Up-Theme.mp3` at the project root and a separate Tetris soundtrack under `projects/tetris/music/`; several other playlist entries in `script.js` refer to MP3 files that are not present in this supplied archive and will not play until those files are restored. Music begins after a user interaction to respect browser autoplay policies.

Background music begins after user interaction to comply with browser autoplay policies. Music is paused while a game modal is open to reduce overlapping audio.

## Deployment notes

The pages use relative local paths and can be hosted as static files. The included `server.js` is for local preview; GitHub Pages does not run Node servers. For GitHub Pages deployment, commit the HTML, CSS, JS, images, MP3, and `projects/` directory to the configured publishing branch.


## V3.2 updates
- Interactive audio seek bar with elapsed/total timestamps and keyboard/touch-friendly range control.
- Shuffle and repeat-all / repeat-one / repeat-off playback modes.
- Improved next/previous track behavior and playback status/error feedback.
- Atmosphere settings panel for music, CRT effect, static, and sparkle preferences (stored locally).
- Lightweight local achievement feedback for first playback, opening the Arcade, and completing Fairy's tour.
- More compact home destination cards.

Run `npm test` to check JavaScript syntax. Browser playback still depends on browser audio policies and local MP3 availability.

## V3.5 visual integration pass
- Added `projects/arcade-game-theme.css`, shared by the six added games for consistent launcher frames, headings, buttons, HUD panels, game-over panels, and responsive layouts.
- Updated the six arcade thumbnails to use compact board-inspired previews with accessible labels, consistent crop behavior, and Fairy's navy / indigo / cyan / purple palette.
- Aligned Arcade card titles and Play Game buttons without removing the original card art or hover-tip behavior.
- Preserved individual game scripts and controls. `npm test` checks shared/server syntax; every JavaScript file was also checked during this integration pass.
- Browser-based visual testing could not be completed in this environment; test desktop and mobile sizes with the local server before deployment.


V3.5 polish includes full-bleed original cabinet previews, upgraded previews for all six added games, Galaga hit bursts/double-shot drops/swooping enemies, a two-river/two-road Frogger layout, varied Dinosaur Run hazards, larger Whack-a-Mole targets, smoother 2048 tile transitions, and Doodle Jumper with a bunny, spring boosts, moving platforms, and breakable platforms.


## V3.6 preview and bug-fix pass
- The six added-game cards now embed each game's own board/page in preview mode instead of using separate hand-drawn mockups. Preview mode hides gameplay controls and UI while retaining the game's real board rendering. The 2048 preview is seeded with a 2048 tile, and Whack-a-Mole shows rendered mole faces.
- Centered Hangman, Tetris, and Brick Breaker artwork; restored visible Tic-Tac-Toe grid dividers.
- Frogger traffic and river objects are distributed in lane slots to prevent initial overlap from random offsets wrapping around the board.
- Dinosaur birds now spawn in the upper sky, well above the ground-level cactus/rock hazards.
- Improved Whack-a-Mole mole faces and updated the test command/version to 3.6.0.

`npm test` validates the arcade's core and six added game scripts. The previews and gameplay should still be checked in a normal browser at the target viewport sizes.


## V3.8 — Restored previews and classic arcade updates
- Restored the original nine game cards and their preview markup from the V3.6 baseline.
- Replaced the Whack-a-Mole slot with Pac-Man, using the supplied JavaScript game source and assets.
- Rebuilt Galaga with classic formation waves, diving enemies, player fire, enemy fire, score/lives, pause, and keyboard/touch controls.
- Changed the Dinosaur Run character to blue and redesigned the six added preview cards as compact illustrations consistent with the original card layout.
- Doodle Jumper preview uses a grey bunny and the in-game platform palette, without a height number; Dinosaur preview has no high-score label.


## V3.9 — Original previews and local arcade rebuilds

- Restored the original nine preview card markup and preview CSS from `Semilla_Portfolio.github.io-main`.
- Rebuilt Galaga as a self-contained canvas game with formation waves, diving enemies, player/enemy fire, score, lives, pause, and touch controls.
- Rebuilt Pac-Man as an original Fairy's Arcade maze-chase game, using classic maze/ghost-chase mechanics as inspiration and no external runtime dependencies.
- Simplified the Pac-Man preview to a Pac-Man sprite being chased by four ghosts.
- Kept the Dinosaur Run preview score-free and its dinosaur blue; kept Doodle Jumper preview number-free with a grey bunny.


## V3.10
- Restored the original nine game preview card structures from the supplied GitHub main ZIP and removed later preview-box overrides that had changed their appearance.
- Replaced the broken Pac-Man slot with a self-contained Road Fighter-inspired traffic dodging racer built for Fairy's Arcade.


## V3.11 updates
- Galaga pause/game-over panel now overlays and centers on the game canvas.
- 2048 preview board resized to match the original Minesweeper preview board footprint.
- Galaga preview shot is static (no preview-card animation).
- Road Fighter now accelerates more strongly, has faster traffic and denser spawns, and ends the run on a high-speed collision; low-speed collisions cause a temporary speed penalty.

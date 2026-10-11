const boardElement = document.getElementById("minesweeper-board");

const mineCountDisplay =
    document.getElementById("mine-count");

const timerDisplay =
    document.getElementById("timer");

const restartButton =
    document.getElementById("restart-button");

const statusText =
    document.getElementById("status-text");

const revealModeButton =
    document.getElementById("reveal-mode");

const flagModeButton =
    document.getElementById("flag-mode");

const gameOverScreen =
    document.getElementById("game-over-screen");

const resultTitle =
    document.getElementById("result-title");

const resultText =
    document.getElementById("result-text");

const newGameButton =
    document.getElementById("new-game-button");


/* =========================================================
   GAME SETTINGS
========================================================= */

const ROWS = 9;
const COLS = 9;
const MINE_COUNT = 10;


/* =========================================================
   GAME STATE
========================================================= */

let board = [];

let minesPlaced = false;
let gameRunning = false;
let gameEnded = false;

let flagsUsed = 0;

let elapsedTime = 0;
let timerInterval = null;

let inputMode = "reveal";


/* =========================================================
   SOUND EFFECTS
========================================================= */

let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            return null;
        }

        audioContext =
            new AudioContext();
    }

    return audioContext;
}

function playTone(
    frequency,
    duration = 0.06,
    type = "square",
    volume = 0.045,
    delay = 0
) {
    const audio =
        getAudioContext();

    if (!audio) {
        return;
    }

    if (audio.state === "suspended") {
        audio.resume().catch(() => {});
    }

    const oscillator =
        audio.createOscillator();

    const gain =
        audio.createGain();

    const startTime =
        audio.currentTime + delay;

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
        frequency,
        startTime
    );

    gain.gain.setValueAtTime(
        volume,
        startTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start(startTime);

    oscillator.stop(
        startTime + duration
    );
}

function playRevealSound() {
    playTone(
        520,
        0.045,
        "square",
        0.03
    );
}

function playFlagSound() {
    playTone(
        720,
        0.055,
        "square",
        0.035
    );
}

function playMineSound() {
    playTone(
        150,
        0.18,
        "sawtooth",
        0.07
    );

    playTone(
        80,
        0.25,
        "square",
        0.06,
        0.10
    );
}

function playWinSound() {
    playTone(
        520,
        0.08,
        "square",
        0.04
    );

    playTone(
        660,
        0.08,
        "square",
        0.04,
        0.09
    );

    playTone(
        780,
        0.08,
        "square",
        0.045,
        0.18
    );

    playTone(
        1040,
        0.18,
        "square",
        0.05,
        0.27
    );
}


/* =========================================================
   CELL FACTORY
========================================================= */

function createCell(row, col) {
    return {
        row,
        col,

        mine: false,
        revealed: false,
        flagged: false,

        adjacentMines: 0,

        element: null
    };
}


/* =========================================================
   BOARD CREATION
========================================================= */

function createBoard() {
    board = [];

    for (let row = 0; row < ROWS; row++) {
        const boardRow = [];

        for (let col = 0; col < COLS; col++) {
            boardRow.push(
                createCell(row, col)
            );
        }

        board.push(boardRow);
    }
}


/* =========================================================
   MINE PLACEMENT
========================================================= */

function placeMines(firstRow, firstCol) {

    const availableCells = [];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {

            /*
                Keep the first clicked cell
                and its surrounding cells safe.
            */

            const rowDistance =
                Math.abs(row - firstRow);

            const colDistance =
                Math.abs(col - firstCol);

            if (
                rowDistance <= 1 &&
                colDistance <= 1
            ) {
                continue;
            }

            availableCells.push(
                [row, col]
            );
        }
    }

    /*
        Shuffle possible mine positions.
    */

    for (
        let i = availableCells.length - 1;
        i > 0;
        i--
    ) {
        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            availableCells[i],
            availableCells[j]
        ] = [
            availableCells[j],
            availableCells[i]
        ];
    }

    for (
        let i = 0;
        i < MINE_COUNT;
        i++
    ) {
        const [row, col] =
            availableCells[i];

        board[row][col].mine = true;
    }

    calculateNumbers();

    minesPlaced = true;
}


/* =========================================================
   ADJACENT CELLS
========================================================= */

function getNeighbors(row, col) {
    const neighbors = [];

    for (
        let rowOffset = -1;
        rowOffset <= 1;
        rowOffset++
    ) {
        for (
            let colOffset = -1;
            colOffset <= 1;
            colOffset++
        ) {
            if (
                rowOffset === 0 &&
                colOffset === 0
            ) {
                continue;
            }

            const neighborRow =
                row + rowOffset;

            const neighborCol =
                col + colOffset;

            if (
                neighborRow >= 0 &&
                neighborRow < ROWS &&
                neighborCol >= 0 &&
                neighborCol < COLS
            ) {
                neighbors.push(
                    board[
                        neighborRow
                    ][
                        neighborCol
                    ]
                );
            }
        }
    }

    return neighbors;
}


/* =========================================================
   NUMBER CALCULATION
========================================================= */

function calculateNumbers() {

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {

            const cell =
                board[row][col];

            if (cell.mine) {
                continue;
            }

            cell.adjacentMines =
                getNeighbors(
                    row,
                    col
                ).filter(
                    neighbor =>
                        neighbor.mine
                ).length;
        }
    }
}


/* =========================================================
   BOARD RENDER
========================================================= */

function renderBoard() {
    boardElement.innerHTML = "";

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {

            const cell =
                board[row][col];

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "mine-cell";

            button.dataset.row =
                row;

            button.dataset.col =
                col;

            /*
                Desktop:
                Left click = reveal
                Right click = flag
            */

            button.addEventListener(
                "click",
                () => {
                    handleCellClick(
                        cell
                    );
                }
            );

            button.addEventListener(
                "contextmenu",
                event => {
                    event.preventDefault();

                    if (
                        window.innerWidth <= 520
                    ) {
                        return;
                    }

                    toggleFlag(cell);
                }
            );

            cell.element =
                button;

            boardElement.appendChild(
                button
            );
        }
    }

    updateBoardVisuals();
}


/* =========================================================
   CELL CLICK
========================================================= */

function handleCellClick(cell) {

    if (gameEnded) {
        return;
    }

    /*
        First click starts the game
        and guarantees a safe area.
    */

    if (!minesPlaced) {

        placeMines(
            cell.row,
            cell.col
        );

        gameRunning = true;

        startTimer();

        updateMineCounter();
    }

    /*
        Mobile flag mode.
    */

    if (
        inputMode === "flag"
    ) {
        toggleFlag(cell);
        return;
    }

    revealCell(cell);
}


/* =========================================================
   REVEAL
========================================================= */

function revealCell(cell) {

    if (
        gameEnded ||
        cell.revealed ||
        cell.flagged
    ) {
        return;
    }

    cell.revealed = true;

    if (cell.mine) {

        cell.element.classList.add(
            "exploded"
        );

        revealAllMines();

        endGame(false);

        return;
    }

    playRevealSound();

    updateCellVisual(cell);

    /*
        Empty cell:
        reveal connected empty area.
    */

    if (
        cell.adjacentMines === 0
    ) {
        floodReveal(cell);
    }

    if (checkWin()) {
        endGame(true);
    }
}


/* =========================================================
   FLOOD REVEAL
========================================================= */

function floodReveal(startCell) {

    const queue = [
        startCell
    ];

    const visited =
        new Set();

    while (
        queue.length > 0
    ) {

        const cell =
            queue.shift();

        const key =
            `${cell.row},${cell.col}`;

        if (visited.has(key)) {
            continue;
        }

        visited.add(key);

        const neighbors =
            getNeighbors(
                cell.row,
                cell.col
            );

        for (
            const neighbor
            of neighbors
        ) {

            if (
                neighbor.mine ||
                neighbor.flagged ||
                neighbor.revealed
            ) {
                continue;
            }

            neighbor.revealed = true;

            updateCellVisual(
                neighbor
            );

            if (
                neighbor.adjacentMines === 0
            ) {
                queue.push(
                    neighbor
                );
            }
        }
    }
}


/* =========================================================
   FLAG
========================================================= */

function toggleFlag(cell) {

    if (
        gameEnded ||
        cell.revealed
    ) {
        return;
    }

    /*
        Don't allow more flags than mines.
    */

    if (
        !cell.flagged &&
        flagsUsed >= MINE_COUNT
    ) {
        return;
    }

    cell.flagged =
        !cell.flagged;

    flagsUsed +=
        cell.flagged
            ? 1
            : -1;

    playFlagSound();

    updateCellVisual(
        cell
    );

    updateMineCounter();

    if (checkWin()) {
        endGame(true);
    }
}


/* =========================================================
   VISUAL CELL UPDATE
========================================================= */

function updateCellVisual(cell) {

    const element =
        cell.element;

    if (!element) {
        return;
    }

    element.className =
        "mine-cell";

    element.textContent =
        "";

    if (cell.flagged) {

        element.classList.add(
            "flagged"
        );

        element.textContent =
            "⚑";

        return;
    }

    if (!cell.revealed) {
        return;
    }

    element.classList.add(
        "revealed"
    );

    if (cell.mine) {

        element.classList.add(
            "mine"
        );

        element.textContent =
            "💣";

        return;
    }

    if (
        cell.adjacentMines > 0
    ) {

        element.classList.add(
            `number-${cell.adjacentMines}`
        );

        element.textContent =
            cell.adjacentMines;
    }
}


/* =========================================================
   REVEAL ALL MINES
========================================================= */

function revealAllMines() {

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {

            const cell =
                board[row][col];

            if (!cell.mine) {
                continue;
            }

            cell.revealed = true;

            updateCellVisual(
                cell
            );
        }
    }
}


/* =========================================================
   WIN CHECK
========================================================= */

function checkWin() {

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {

            const cell =
                board[row][col];

            if (
                !cell.mine &&
                !cell.revealed
            ) {
                return false;
            }
        }
    }

    return true;
}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    stopTimer();

    elapsedTime = 0;

    updateTimer();

    timerInterval =
        setInterval(
            () => {

                if (!gameRunning) {
                    return;
                }

                elapsedTime++;

                updateTimer();

            },
            1000
        );
}

function stopTimer() {

    if (
        timerInterval !== null
    ) {
        clearInterval(
            timerInterval
        );

        timerInterval = null;
    }
}

function updateTimer() {
    timerDisplay.textContent =
        elapsedTime;
}


/* =========================================================
   MINE COUNTER
========================================================= */

function updateMineCounter() {

    const remaining =
        MINE_COUNT -
        flagsUsed;

    mineCountDisplay.textContent =
        remaining;
}


/* =========================================================
   END GAME
========================================================= */

function endGame(won) {

    if (gameEnded) {
        return;
    }

    gameEnded = true;
    gameRunning = false;

    stopTimer();

    if (won) {

        statusText.textContent =
            "You found all the mines!";

        resultTitle.textContent =
            "YOU WIN!";

        resultText.textContent =
            `Completed in ${elapsedTime} seconds.`;

        playWinSound();

    } else {

        statusText.textContent =
            "You hit a mine.";

        resultTitle.textContent =
            "GAME OVER";

        resultText.textContent =
            `You found ${flagsUsed} of ${MINE_COUNT} flags.`;

        playMineSound();
    }

    gameOverScreen.hidden =
        false;

    /*
        Make all mines visible
        after losing.
    */

    if (!won) {
        revealAllMines();
    }
}


/* =========================================================
   RESET GAME
========================================================= */

function resetGame() {

    stopTimer();

    board = [];

    minesPlaced = false;
    gameRunning = false;
    gameEnded = false;

    flagsUsed = 0;
    elapsedTime = 0;

    inputMode = "reveal";

    updateTimer();
    updateMineCounter();

    statusText.textContent =
        "Find all the mines.";

    gameOverScreen.hidden =
        true;

    updateModeButtons();

    createBoard();

    renderBoard();

    const audio =
        getAudioContext();

    if (
        audio &&
        audio.state === "suspended"
    ) {
        audio.resume().catch(() => {});
    }
}


/* =========================================================
   MOBILE MODE
========================================================= */

function updateModeButtons() {

    revealModeButton.classList.toggle(
        "active",
        inputMode === "reveal"
    );

    flagModeButton.classList.toggle(
        "active",
        inputMode === "flag"
    );
}

revealModeButton.addEventListener(
    "click",
    () => {

        inputMode =
            "reveal";

        updateModeButtons();
    }
);

flagModeButton.addEventListener(
    "click",
    () => {

        inputMode =
            "flag";

        updateModeButtons();
    }
);


/* =========================================================
   BUTTONS
========================================================= */

restartButton.addEventListener(
    "click",
    resetGame
);

newGameButton.addEventListener(
    "click",
    resetGame
);


/* =========================================================
   INITIAL GAME
========================================================= */

resetGame();
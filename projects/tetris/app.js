const canvas = document.getElementById("tetris-board");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("next-piece");
const nextCtx = nextCanvas.getContext("2d");

const holdCanvas = document.getElementById("hold-piece-preview");
const holdCtx = holdCanvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const linesDisplay = document.getElementById("lines");
const levelDisplay = document.getElementById("level");

const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreDisplay = document.getElementById("final-score");

const musicToggle = document.getElementById("music-toggle");
const music = document.getElementById("tetris-music");

const moveLeftButton = document.getElementById("move-left");
const moveRightButton = document.getElementById("move-right");
const rotateCcwButton = document.getElementById("rotate-ccw");
const rotateCwButton = document.getElementById("rotate-cw");
const softDropButton = document.getElementById("soft-drop");
const hardDropButton = document.getElementById("hard-drop");
const holdButton = document.getElementById("hold-piece");

/* =========================================================
   CONSTANTS
========================================================= */

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const COLORS = {
    I: "#38BDF8",
    O: "#FACC15",
    T: "#A855F7",
    S: "#22C55E",
    Z: "#EF4444",
    J: "#3B82F6",
    L: "#F97316"
};

const SHAPES = {
    I: [
        [1, 1, 1, 1]
    ],

    O: [
        [1, 1],
        [1, 1]
    ],

    T: [
        [0, 1, 0],
        [1, 1, 1]
    ],

    S: [
        [0, 1, 1],
        [1, 1, 0]
    ],

    Z: [
        [1, 1, 0],
        [0, 1, 1]
    ],

    J: [
        [1, 0, 0],
        [1, 1, 1]
    ],

    L: [
        [0, 0, 1],
        [1, 1, 1]
    ]
};

const PIECE_TYPES = Object.keys(SHAPES);

/* =========================================================
   GAME STATE
========================================================= */

let board = createBoard();

let currentPiece = null;
let nextPiece = null;
let heldPiece = null;

let bag = [];

let canHold = true;

let score = 0;
let lines = 0;
let level = 1;

let gameRunning = false;
let gameEnded = false;

let dropTimer = 0;
let lastFrameTime = 0;
let animationFrame = null;

let musicEnabled = true;

/* =========================================================
   BOARD
========================================================= */

function createBoard() {
    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(null)
    );
}

/* =========================================================
   BAG RANDOMIZER
========================================================= */

function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function refillBag() {
    bag = shuffle(PIECE_TYPES);
}

function getNextPieceType() {
    if (bag.length === 0) {
        refillBag();
    }

    return bag.shift();
}

/* =========================================================
   PIECES
========================================================= */

function copyMatrix(matrix) {
    return matrix.map(row => [...row]);
}

function createPiece(type) {
    const shape = copyMatrix(SHAPES[type]);

    return {
        type,
        shape,
        color: COLORS[type],
        x: Math.floor((COLS - shape[0].length) / 2),
        y: -1
    };
}

/* =========================================================
   COLLISION
========================================================= */

function pieceCollides(piece, offsetX = 0, offsetY = 0, shape = piece.shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (!shape[row][col]) {
                continue;
            }

            const x = piece.x + col + offsetX;
            const y = piece.y + row + offsetY;

            if (x < 0 || x >= COLS) {
                return true;
            }

            if (y >= ROWS) {
                return true;
            }

            if (y >= 0 && board[y][x]) {
                return true;
            }
        }
    }

    return false;
}

/* =========================================================
   ROTATION
========================================================= */

function rotateMatrixClockwise(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;

    const rotated = Array.from(
        { length: cols },
        () => Array(rows).fill(0)
    );

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            rotated[col][rows - 1 - row] = matrix[row][col];
        }
    }

    return rotated;
}

function rotateMatrixCounterClockwise(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;

    const rotated = Array.from(
        { length: cols },
        () => Array(rows).fill(0)
    );

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            rotated[cols - 1 - col][row] = matrix[row][col];
        }
    }

    return rotated;
}

function rotatePiece(direction) {
    if (!gameRunning || !currentPiece) {
        return;
    }

    // O piece doesn't visually rotate.
    if (currentPiece.type === "O") {
        return;
    }

    const rotatedShape =
        direction === 1
            ? rotateMatrixClockwise(currentPiece.shape)
            : rotateMatrixCounterClockwise(currentPiece.shape);

    /*
        Basic wall/floor kicks.
        Try the normal position first, then small offsets.
    */
    const kicks = [
        [0, 0],
        [-1, 0],
        [1, 0],
        [-2, 0],
        [2, 0],
        [0, -1],
        [0, -2]
    ];

    for (const [offsetX, offsetY] of kicks) {
        if (
            !pieceCollides(
                currentPiece,
                offsetX,
                offsetY,
                rotatedShape
            )
        ) {
            currentPiece.shape = rotatedShape;
            currentPiece.x += offsetX;
            currentPiece.y += offsetY;
            return;
        }
    }
}

/* =========================================================
   MOVEMENT
========================================================= */

function movePiece(direction) {
    if (!gameRunning || !currentPiece) {
        return;
    }

    if (!pieceCollides(currentPiece, direction, 0)) {
        currentPiece.x += direction;
    }
}

function softDrop() {
    if (!gameRunning || !currentPiece) {
        return;
    }

    if (!pieceCollides(currentPiece, 0, 1)) {
        currentPiece.y += 1;

        score += 1;
        updateHUD();
    } else {
        lockPiece();
    }
}

function hardDrop() {
    if (!gameRunning || !currentPiece) {
        return;
    }

    let distance = 0;

    while (!pieceCollides(currentPiece, 0, 1)) {
        currentPiece.y += 1;
        distance++;
    }

    score += distance * 2;

    lockPiece();
}

/* =========================================================
   SPAWNING
========================================================= */

function spawnPiece() {
    currentPiece = createPiece(nextPiece);

    nextPiece = getNextPieceType();

    /*
        Game over if the new piece cannot spawn.
    */
    if (pieceCollides(currentPiece)) {
        endGame();
        return;
    }

    canHold = true;

    drawNextPreview();
}

function prepareFirstPiece() {
    if (!nextPiece) {
        nextPiece = getNextPieceType();
    }

    spawnPiece();
}

/* =========================================================
   HOLD
========================================================= */

function holdCurrentPiece() {
    if (!gameRunning || !currentPiece || !canHold) {
        return;
    }

    canHold = false;

    const currentType = currentPiece.type;

    if (heldPiece === null) {
        heldPiece = currentType;

        spawnPiece();
    } else {
        const swapType = heldPiece;

        heldPiece = currentType;

        currentPiece = createPiece(swapType);

        if (pieceCollides(currentPiece)) {
            endGame();
            return;
        }
    }

    drawHoldPreview();
}

/* =========================================================
   LOCK PIECE
========================================================= */

function lockPiece() {
    if (!currentPiece) {
        return;
    }

    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (!currentPiece.shape[row][col]) {
                continue;
            }

            const x = currentPiece.x + col;
            const y = currentPiece.y + row;

            if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                board[y][x] = currentPiece.color;
            }
        }
    }

    clearCompletedLines();

    spawnPiece();

    dropTimer = 0;
}

/* =========================================================
   LINE CLEARING
========================================================= */

function clearCompletedLines() {
    let cleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        const fullRow = board[row].every(cell => cell !== null);

        if (!fullRow) {
            continue;
        }

        board.splice(row, 1);
        board.unshift(Array(COLS).fill(null));

        cleared++;
        row++;
    }

    if (cleared === 0) {
        return;
    }

    const points = {
        1: 100,
        2: 300,
        3: 500,
        4: 800
    };

    score += (points[cleared] || 0) * level;

    lines += cleared;

    level = Math.floor(lines / 10) + 1;

    updateHUD();
}

/* =========================================================
   GRAVITY
========================================================= */

function getDropInterval() {
    /*
        Level 1 = 900ms
        Each level becomes faster.
        Minimum = 70ms.
    */
    return Math.max(
        70,
        900 - (level - 1) * 80
    );
}

function update(deltaTime) {
    if (!gameRunning || !currentPiece) {
        return;
    }

    dropTimer += deltaTime;

    if (dropTimer < getDropInterval()) {
        return;
    }

    dropTimer = 0;

    if (!pieceCollides(currentPiece, 0, 1)) {
        currentPiece.y += 1;
    } else {
        lockPiece();
    }
}

/* =========================================================
   GHOST PIECE
========================================================= */

function getGhostPiece() {
    if (!currentPiece) {
        return null;
    }

    const ghost = {
        type: currentPiece.type,
        shape: copyMatrix(currentPiece.shape),
        color: currentPiece.color,
        x: currentPiece.x,
        y: currentPiece.y
    };

    while (!pieceCollides(ghost, 0, 1, ghost.shape)) {
        ghost.y++;
    }

    return ghost;
}

/* =========================================================
   DRAWING
========================================================= */

function clearCanvas(context, width, height) {
    context.clearRect(0, 0, width, height);

    context.fillStyle = "#0B1026";
    context.fillRect(0, 0, width, height);
}

function drawBlock(context, x, y, color, size, alpha = 1) {
    if (y < 0) {
        return;
    }

    context.globalAlpha = alpha;

    context.fillStyle = color;

    context.fillRect(
        x * size + 1,
        y * size + 1,
        size - 2,
        size - 2
    );

    context.globalAlpha = 1;

    context.strokeStyle = "rgba(255,255,255,0.18)";
    context.lineWidth = 1;

    context.strokeRect(
        x * size + 1.5,
        y * size + 1.5,
        size - 3,
        size - 3
    );
}

function drawPiece(context, piece, size, alpha = 1) {
    if (!piece) {
        return;
    }

    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (!piece.shape[row][col]) {
                continue;
            }

            drawBlock(
                context,
                piece.x + col,
                piece.y + row,
                piece.color,
                size,
                alpha
            );
        }
    }
}

function drawBoardGrid() {
    ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }

    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

function drawBoard() {
    clearCanvas(
        ctx,
        canvas.width,
        canvas.height
    );

    drawBoardGrid();

    // Locked blocks
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(
                    ctx,
                    col,
                    row,
                    board[row][col],
                    BLOCK_SIZE
                );
            }
        }
    }

    if (!currentPiece) {
        return;
    }

    // Ghost piece
    const ghost = getGhostPiece();

    if (ghost) {
        drawPiece(
            ctx,
            ghost,
            BLOCK_SIZE,
            0.18
        );
    }

    // Active piece
    drawPiece(
        ctx,
        currentPiece,
        BLOCK_SIZE,
        1
    );
}

/* =========================================================
   PREVIEWS
========================================================= */

function drawPreviewCanvas(context, type) {
    clearCanvas(
        context,
        context.canvas.width,
        context.canvas.height
    );

    if (!type) {
        return;
    }

    const definition = SHAPES[type];
    const color = COLORS[type];

    const previewBlockSize = 24;

    const width =
        definition[0].length *
        previewBlockSize;

    const height =
        definition.length *
        previewBlockSize;

    const offsetX =
        (context.canvas.width - width) / 2;

    const offsetY =
        (context.canvas.height - height) / 2;

    for (let row = 0; row < definition.length; row++) {
        for (let col = 0; col < definition[row].length; col++) {
            if (!definition[row][col]) {
                continue;
            }

            context.fillStyle = color;

            context.fillRect(
                offsetX +
                    col * previewBlockSize +
                    1,
                offsetY +
                    row * previewBlockSize +
                    1,
                previewBlockSize - 2,
                previewBlockSize - 2
            );
        }
    }
}

function drawNextPreview() {
    drawPreviewCanvas(
        nextCtx,
        nextPiece
    );
}

function drawHoldPreview() {
    drawPreviewCanvas(
        holdCtx,
        heldPiece
    );
}

/* =========================================================
   HUD
========================================================= */

function updateHUD() {
    scoreDisplay.textContent = score;
    linesDisplay.textContent = lines;
    levelDisplay.textContent = level;
}

/* =========================================================
   MUSIC
========================================================= */

function updateMusicButton() {
    musicToggle.textContent =
        musicEnabled ? "🔊" : "🔇";

    musicToggle.setAttribute(
        "aria-label",
        musicEnabled
            ? "Mute music"
            : "Enable music"
    );
}

async function startMusic() {
    if (!musicEnabled) {
        return;
    }

    try {
        music.currentTime = 0;
        await music.play();
    } catch (error) {
        console.warn(
            "Music could not start:",
            error
        );
    }
}

function stopMusic() {
    music.pause();
    music.currentTime = 0;
}

musicToggle.addEventListener(
    "click",
    async () => {
        musicEnabled = !musicEnabled;

        if (musicEnabled) {
            if (gameRunning) {
                await startMusic();
            }
        } else {
            music.pause();
        }

        updateMusicButton();
    }
);

/* =========================================================
   START / RESTART
========================================================= */

function resetGame() {
    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    board = createBoard();

    currentPiece = null;
    nextPiece = null;
    heldPiece = null;

    bag = [];

    canHold = true;

    score = 0;
    lines = 0;
    level = 1;

    dropTimer = 0;

    gameRunning = true;
    gameEnded = false;

    gameOverScreen.hidden = true;

    startButton.disabled = true;
    startButton.textContent = "Playing...";

    updateHUD();

    drawHoldPreview();

    refillBag();

    /*
        Prepare the current and next pieces.
    */
    nextPiece = getNextPieceType();

    spawnPiece();

    drawBoard();

    lastFrameTime = performance.now();

    startMusic();

    animationFrame =
        requestAnimationFrame(gameLoop);
}

function endGame() {
    if (gameEnded) {
        return;
    }

    gameEnded = true;
    gameRunning = false;

    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    stopMusic();

    finalScoreDisplay.textContent = score;

    gameOverScreen.hidden = false;

    startButton.disabled = false;
    startButton.textContent = "Start Game";

    drawBoard();
}

startButton.addEventListener(
    "click",
    resetGame
);

restartButton.addEventListener(
    "click",
    resetGame
);

/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(currentTime) {
    if (!gameRunning) {
        return;
    }

    const deltaTime =
        currentTime - lastFrameTime;

    lastFrameTime = currentTime;

    update(deltaTime);

    drawBoard();

    animationFrame =
        requestAnimationFrame(gameLoop);
}

/* =========================================================
   KEYBOARD CONTROLS
========================================================= */

document.addEventListener(
    "keydown",
    event => {
        if (!gameRunning) {
            return;
        }

        const key =
            event.key.toLowerCase();

        /*
            Prevent browser scrolling from
            the Tetris keyboard controls.
        */
        if (
            key === "w" ||
            key === "a" ||
            key === "s" ||
            key === "d" ||
            key === "q" ||
            event.code === "Space"
        ) {
            event.preventDefault();
        }

        switch (key) {
            case "a":
                movePiece(-1);
                break;

            case "d":
                movePiece(1);
                break;

            case "s":
                softDrop();
                break;

            case "w":
                rotatePiece(1);
                break;

            case "q":
                rotatePiece(-1);
                break;
        }

        if (event.code === "Space") {
            hardDrop();
        }
    }
);

/* =========================================================
   MOBILE CONTROLS
========================================================= */

function bindControl(button, action) {
    button.addEventListener(
        "pointerdown",
        event => {
            event.preventDefault();

            action();
        }
    );
}

bindControl(
    moveLeftButton,
    () => movePiece(-1)
);

bindControl(
    moveRightButton,
    () => movePiece(1)
);

bindControl(
    rotateCcwButton,
    () => rotatePiece(-1)
);

bindControl(
    rotateCwButton,
    () => rotatePiece(1)
);

bindControl(
    softDropButton,
    () => softDrop()
);

bindControl(
    hardDropButton,
    () => hardDrop()
);

bindControl(
    holdButton,
    () => holdCurrentPiece()
);

/* =========================================================
   INITIAL STATE
========================================================= */

updateHUD();
updateMusicButton();

drawBoard();
drawNextPreview();
drawHoldPreview();
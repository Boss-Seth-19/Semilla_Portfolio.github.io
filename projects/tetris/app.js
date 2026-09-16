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

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const PIECES = {
    I: {
        color: "#38BDF8",
        shape: [
            [1, 1, 1, 1]
        ]
    },

    O: {
        color: "#FACC15",
        shape: [
            [1, 1],
            [1, 1]
        ]
    },

    T: {
        color: "#A855F7",
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ]
    },

    S: {
        color: "#22C55E",
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ]
    },

    Z: {
        color: "#EF4444",
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ]
    },

    J: {
        color: "#3B82F6",
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ]
    },

    L: {
        color: "#F97316",
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ]
    }
};

const TYPES = Object.keys(PIECES);

let board = [];
let current = null;
let nextType = null;
let holdType = null;

let bag = [];

let score = 0;
let lines = 0;
let level = 1;

let running = false;
let gameOver = false;
let canHold = true;

let lastTime = 0;
let fallTimer = 0;
let frameId = null;

let musicEnabled = true;


/* =========================
   BOARD
========================= */

function createBoard() {
    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(null)
    );
}


/* =========================
   RANDOMIZER
========================= */

function shuffledBag() {
    const result = [...TYPES];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function getRandomType() {
    if (bag.length === 0) {
        bag = shuffledBag();
    }

    return bag.shift();
}


/* =========================
   PIECE
========================= */

function createPiece(type) {
    const source = PIECES[type];

    return {
        type,
        color: source.color,
        shape: source.shape.map(row => [...row]),
        x: Math.floor(
            (COLS - source.shape[0].length) / 2
        ),
        y: 0
    };
}


/* =========================
   COLLISION
========================= */

function collision(piece, offsetX = 0, offsetY = 0, shape = piece.shape) {
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

            if (y >= 0 && board[y][x] !== null) {
                return true;
            }
        }
    }

    return false;
}


/* =========================
   MOVEMENT
========================= */

function moveLeft() {
    if (!running || !current) {
        return;
    }

    if (!collision(current, -1, 0)) {
        current.x--;
        draw();
    }
}

function moveRight() {
    if (!running || !current) {
        return;
    }

    if (!collision(current, 1, 0)) {
        current.x++;
        draw();
    }
}

function softDrop() {
    if (!running || !current) {
        return;
    }

    if (!collision(current, 0, 1)) {
        current.y++;
        score++;
        updateHUD();
        draw();
    } else {
        lockCurrent();
    }
}

function hardDrop() {
    if (!running || !current) {
        return;
    }

    let distance = 0;

    while (!collision(current, 0, 1)) {
        current.y++;
        distance++;
    }

    score += distance * 2;

    lockCurrent();
}


/* =========================
   ROTATION
========================= */

function rotateClockwise(matrix) {
    return matrix[0].map(
        (_, col) =>
            matrix
                .slice()
                .reverse()
                .map(row => row[col])
    );
}

function rotateCounterClockwise(matrix) {
    return matrix[0]
        .map((_, col) =>
            matrix.map(row => row[row.length - 1 - col])
        )
        .reverse();
}

function rotate(direction) {
    if (!running || !current) {
        return;
    }

    if (current.type === "O") {
        return;
    }

    const rotated =
        direction === 1
            ? rotateClockwise(current.shape)
            : rotateCounterClockwise(current.shape);

    const tests = [
        [0, 0],
        [-1, 0],
        [1, 0],
        [-2, 0],
        [2, 0],
        [0, -1]
    ];

    for (const [offsetX, offsetY] of tests) {
        if (
            !collision(
                current,
                offsetX,
                offsetY,
                rotated
            )
        ) {
            current.shape = rotated;
            current.x += offsetX;
            current.y += offsetY;

            draw();
            return;
        }
    }
}


/* =========================
   HOLD
========================= */

function holdCurrent() {
    if (!running || !current || !canHold) {
        return;
    }

    canHold = false;

    const oldType = current.type;

    if (holdType === null) {
        holdType = oldType;
        spawnNext();
    } else {
        const swapType = holdType;
        holdType = oldType;

        current = createPiece(swapType);

        if (collision(current)) {
            endGame();
            return;
        }
    }

    drawHold();
    draw();
}


/* =========================
   SPAWN
========================= */

function spawnNext() {
    if (nextType === null) {
        nextType = getRandomType();
    }

    current = createPiece(nextType);
    nextType = getRandomType();

    canHold = true;

    drawNext();

    if (collision(current)) {
        endGame();
    }
}


/* =========================
   LOCK
========================= */

function lockCurrent() {
    if (!current) {
        return;
    }

    for (let row = 0; row < current.shape.length; row++) {
        for (let col = 0; col < current.shape[row].length; col++) {

            if (!current.shape[row][col]) {
                continue;
            }

            const x = current.x + col;
            const y = current.y + row;

            if (
                y >= 0 &&
                y < ROWS &&
                x >= 0 &&
                x < COLS
            ) {
                board[y][x] = current.color;
            }
        }
    }

    clearLines();

    spawnNext();

    fallTimer = 0;

    updateHUD();
    draw();
}


/* =========================
   LINES
========================= */

function clearLines() {
    let cleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {

        if (
            board[row].every(
                cell => cell !== null
            )
        ) {
            board.splice(row, 1);
            board.unshift(
                Array(COLS).fill(null)
            );

            cleared++;
            row++;
        }
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

    score +=
        (points[cleared] || 0) * level;

    lines += cleared;

    level =
        Math.floor(lines / 10) + 1;

    updateHUD();
}


/* =========================
   GRAVITY
========================= */

function getFallDelay() {
    return Math.max(
        80,
        900 - (level - 1) * 80
    );
}

function update(deltaTime) {
    if (!running || !current) {
        return;
    }

    fallTimer += deltaTime;

    if (fallTimer < getFallDelay()) {
        return;
    }

    fallTimer = 0;

    if (!collision(current, 0, 1)) {
        current.y++;
    } else {
        lockCurrent();
    }
}


/* =========================
   DRAWING
========================= */

function drawBlock(
    context,
    x,
    y,
    color,
    alpha = 1
) {
    if (y < 0) {
        return;
    }

    context.globalAlpha = alpha;

    context.fillStyle = color;

    context.fillRect(
        x * BLOCK + 1,
        y * BLOCK + 1,
        BLOCK - 2,
        BLOCK - 2
    );

    context.globalAlpha = 1;

    context.strokeStyle =
        "rgba(255,255,255,0.18)";

    context.strokeRect(
        x * BLOCK + 1.5,
        y * BLOCK + 1.5,
        BLOCK - 3,
        BLOCK - 3
    );
}

function drawPiece(
    context,
    piece,
    alpha = 1
) {
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
                alpha
            );
        }
    }
}

function getGhost() {
    if (!current) {
        return null;
    }

    const ghost = {
        type: current.type,
        color: current.color,
        shape: current.shape.map(row => [...row]),
        x: current.x,
        y: current.y
    };

    while (!collision(ghost, 0, 1, ghost.shape)) {
        ghost.y++;
    }

    return ghost;
}

function drawGrid() {
    ctx.strokeStyle =
        "rgba(148,163,184,0.08)";

    ctx.lineWidth = 1;

    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK, 0);
        ctx.lineTo(
            x * BLOCK,
            ROWS * BLOCK
        );
        ctx.stroke();
    }

    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK);
        ctx.lineTo(
            COLS * BLOCK,
            y * BLOCK
        );
        ctx.stroke();
    }
}

function draw() {
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#0B1026";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawGrid();

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {

            if (board[row][col]) {
                drawBlock(
                    ctx,
                    col,
                    row,
                    board[row][col]
                );
            }
        }
    }

    if (current) {
        const ghost = getGhost();

        if (ghost) {
            drawPiece(
                ctx,
                ghost,
                0.15
            );
        }

        drawPiece(
            ctx,
            current,
            1
        );
    }
}


/* =========================
   PREVIEW
========================= */

function clearPreview(context) {
    context.clearRect(
        0,
        0,
        context.canvas.width,
        context.canvas.height
    );

    context.fillStyle = "#0B1026";

    context.fillRect(
        0,
        0,
        context.canvas.width,
        context.canvas.height
    );
}

function drawPreview(
    context,
    type
) {
    clearPreview(context);

    if (!type) {
        return;
    }

    const shape =
        PIECES[type].shape;

    const size = 24;

    const width =
        shape[0].length * size;

    const height =
        shape.length * size;

    const offsetX =
        (context.canvas.width - width) / 2;

    const offsetY =
        (context.canvas.height - height) / 2;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {

            if (!shape[row][col]) {
                continue;
            }

            context.fillStyle =
                PIECES[type].color;

            context.fillRect(
                offsetX + col * size + 1,
                offsetY + row * size + 1,
                size - 2,
                size - 2
            );
        }
    }
}

function drawNext() {
    drawPreview(
        nextCtx,
        nextType
    );
}

function drawHold() {
    drawPreview(
        holdCtx,
        holdType
    );
}


/* =========================
   HUD
========================= */

function updateHUD() {
    scoreDisplay.textContent = score;
    linesDisplay.textContent = lines;
    levelDisplay.textContent = level;
}


/* =========================
   MUSIC
========================= */

function updateMusicButton() {
    musicToggle.textContent =
        musicEnabled
            ? "🔊"
            : "🔇";
}

musicToggle.addEventListener(
    "click",
    () => {
        musicEnabled = !musicEnabled;

        if (!musicEnabled) {
            music.pause();
        } else if (running) {
            music.play().catch(() => {});
        }

        updateMusicButton();
    }
);

function startMusic() {
    if (!musicEnabled) {
        return;
    }

    music.currentTime = 0;

    music.play().catch(error => {
        console.warn(
            "Music playback blocked:",
            error
        );
    });
}

function stopMusic() {
    music.pause();
    music.currentTime = 0;
}


/* =========================
   GAME START
========================= */

function startGame() {
    if (frameId !== null) {
        cancelAnimationFrame(frameId);
    }

    board = createBoard();

    current = null;
    nextType = null;
    holdType = null;

    bag = [];

    score = 0;
    lines = 0;
    level = 1;

    canHold = true;

    fallTimer = 0;

    running = true;
    gameOver = false;

    gameOverScreen.hidden = true;

    startButton.disabled = true;
    startButton.textContent = "Playing...";

    updateHUD();

    refillForStart();

    drawHold();

    spawnNext();

    draw();

    lastTime = performance.now();

    startMusic();

    frameId =
        requestAnimationFrame(gameLoop);
}

function refillForStart() {
    bag = shuffledBag();

    nextType = bag.shift();
}


/* =========================
   GAME OVER
========================= */

function endGame() {
    if (gameOver) {
        return;
    }

    gameOver = true;
    running = false;

    if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
    }

    stopMusic();

    finalScoreDisplay.textContent = score;

    gameOverScreen.hidden = false;

    startButton.disabled = false;
    startButton.textContent = "Start Game";

    draw();
}


/* =========================
   GAME LOOP
========================= */

function gameLoop(time) {
    if (!running) {
        return;
    }

    const delta =
        time - lastTime;

    lastTime = time;

    update(delta);

    draw();

    frameId =
        requestAnimationFrame(gameLoop);
}


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
    "keydown",
    event => {
        if (!running) {
            return;
        }

        const key =
            event.key.toLowerCase();

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

        if (key === "a") {
            moveLeft();
        }

        if (key === "d") {
            moveRight();
        }

        if (key === "s") {
            softDrop();
        }

        if (key === "w") {
            rotate(1);
        }

        if (key === "q") {
            rotate(-1);
        }

        if (event.code === "Space") {
            hardDrop();
        }
    }
);


/* =========================
   MOBILE BUTTONS
========================= */

function bindButton(button, action) {
    button.addEventListener(
        "pointerdown",
        event => {
            event.preventDefault();
            action();
        }
    );
}

bindButton(
    moveLeftButton,
    moveLeft
);

bindButton(
    moveRightButton,
    moveRight
);

bindButton(
    rotateCcwButton,
    () => rotate(-1)
);

bindButton(
    rotateCwButton,
    () => rotate(1)
);

bindButton(
    softDropButton,
    softDrop
);

bindButton(
    hardDropButton,
    hardDrop
);

bindButton(
    holdButton,
    holdCurrent
);


/* =========================
   START / RESTART
========================= */

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);


/* =========================
   INITIAL STATE
========================= */

updateHUD();
updateMusicButton();

drawNext();
drawHold();
draw();
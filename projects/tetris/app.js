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
const BLOCK_SIZE = 30;

/*
==========================================================
SRS PIECES

JLSTZ use 3x3 matrices.
I uses 4x4.
O stays unchanged visually.
==========================================================
*/

const PIECES = {
    J: {
        color: "#3B82F6",
        size: 3,
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },

    L: {
        color: "#F97316",
        size: 3,
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },

    S: {
        color: "#22C55E",
        size: 3,
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ]
    },

    Z: {
        color: "#EF4444",
        size: 3,
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ]
    },

    T: {
        color: "#A855F7",
        size: 3,
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ]
    },

    O: {
        color: "#FACC15",
        size: 2,
        shape: [
            [1, 1],
            [1, 1]
        ]
    },

    I: {
        color: "#38BDF8",
        size: 4,
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    }
};

const TYPES = Object.keys(PIECES);

/*
==========================================================
SRS KICK TABLES

Coordinates are stored as [x, y] where positive y means
DOWN on our canvas.

The standard SRS tables are converted from the usual
mathematical coordinate system into screen coordinates.
==========================================================
*/

/*
JLSTZ / T / S / Z
*/
const JLSTZ_KICKS = {
    "0->1": [
        [0, 0],
        [-1, 0],
        [-1, -1],
        [0, 2],
        [-1, 2]
    ],

    "1->0": [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, -2],
        [1, -2]
    ],

    "1->2": [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, -2],
        [1, -2]
    ],

    "2->1": [
        [0, 0],
        [-1, 0],
        [-1, -1],
        [0, 2],
        [-1, 2]
    ],

    "2->3": [
        [0, 0],
        [1, 0],
        [1, -1],
        [0, 2],
        [1, 2]
    ],

    "3->2": [
        [0, 0],
        [-1, 0],
        [-1, 1],
        [0, -2],
        [-1, -2]
    ],

    "3->0": [
        [0, 0],
        [-1, 0],
        [-1, 1],
        [0, -2],
        [-1, -2]
    ],

    "0->3": [
        [0, 0],
        [1, 0],
        [1, -1],
        [0, 2],
        [1, 2]
    ]
};

/*
I PIECE
*/
const I_KICKS = {
    "0->1": [
        [0, 0],
        [-2, 0],
        [1, 0],
        [-2, 1],
        [1, -2]
    ],

    "1->0": [
        [0, 0],
        [2, 0],
        [-1, 0],
        [2, -1],
        [-1, 2]
    ],

    "1->2": [
        [0, 0],
        [-1, 0],
        [2, 0],
        [-1, -2],
        [2, 1]
    ],

    "2->1": [
        [0, 0],
        [1, 0],
        [-2, 0],
        [1, 2],
        [-2, -1]
    ],

    "2->3": [
        [0, 0],
        [2, 0],
        [-1, 0],
        [2, -1],
        [-1, 2]
    ],

    "3->2": [
        [0, 0],
        [-2, 0],
        [1, 0],
        [-2, 1],
        [1, -2]
    ],

    "3->0": [
        [0, 0],
        [1, 0],
        [-2, 0],
        [1, 2],
        [-2, -1]
    ],

    "0->3": [
        [0, 0],
        [-1, 0],
        [2, 0],
        [-1, -2],
        [2, 1]
    ]
};

/*
==========================================================
GAME STATE
==========================================================
*/

let board = createBoard();

let currentPiece = null;
let nextType = null;
let holdType = null;

let bag = [];
let canHold = true;

let score = 0;
let lines = 0;
let level = 1;

let running = false;
let gameOver = false;

let fallTimer = 0;
let lastTime = 0;
let animationId = null;

let musicEnabled = true;

/*
==========================================================
BOARD
==========================================================
*/

function createBoard() {
    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(null)
    );
}

/*
==========================================================
7-BAG
==========================================================
*/

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] =
            [result[j], result[i]];
    }

    return result;
}

function getPieceType() {
    if (bag.length === 0) {
        bag = shuffle(TYPES);
    }

    return bag.shift();
}

/*
==========================================================
PIECE
==========================================================
*/

function createPiece(type) {
    const definition = PIECES[type];

    let x;

    /*
        SRS-style spawn positions.
    */
    if (type === "I") {
        x = Math.floor(COLS / 2) - 2;
    } else if (type === "O") {
        x = Math.floor(COLS / 2) - 1;
    } else {
        x = Math.floor(COLS / 2) - 1;
    }

    return {
        type,
        color: definition.color,
        shape: definition.shape.map(row => [...row]),
        rotation: 0,
        x,
        y: 0
    };
}

/*
==========================================================
COLLISION
==========================================================
*/

function isCollision(
    piece,
    offsetX = 0,
    offsetY = 0,
    shape = piece.shape
) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {

            if (!shape[row][col]) {
                continue;
            }

            const x =
                piece.x +
                col +
                offsetX;

            const y =
                piece.y +
                row +
                offsetY;

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

/*
==========================================================
ROTATION MATRICES
==========================================================
*/

function rotateClockwise(matrix) {
    return matrix[0].map(
        (_, column) =>
            matrix
                .slice()
                .reverse()
                .map(row => row[column])
    );
}

function rotateCounterClockwise(matrix) {
    return matrix[0]
        .map(
            (_, column) =>
                matrix.map(
                    row =>
                        row[row.length - 1 - column]
                )
        )
        .reverse();
}

/*
==========================================================
SRS ROTATION
==========================================================
*/

function rotatePiece(direction) {
    if (!running || !currentPiece) {
        return;
    }

    /*
        O does not visibly rotate.
    */
    if (currentPiece.type === "O") {
        return;
    }

    const oldRotation =
        currentPiece.rotation;

    let newRotation;

    if (direction === 1) {
        newRotation =
            (oldRotation + 1) % 4;
    } else {
        newRotation =
            (oldRotation + 3) % 4;
    }

    const newShape =
        direction === 1
            ? rotateClockwise(currentPiece.shape)
            : rotateCounterClockwise(currentPiece.shape);

    const key =
        `${oldRotation}->${newRotation}`;

    const kicks =
        currentPiece.type === "I"
            ? I_KICKS[key]
            : JLSTZ_KICKS[key];

    for (const [offsetX, offsetY] of kicks) {

        if (
            !isCollision(
                currentPiece,
                offsetX,
                offsetY,
                newShape
            )
        ) {
            currentPiece.shape =
                newShape;

            currentPiece.x +=
                offsetX;

            currentPiece.y +=
                offsetY;

            currentPiece.rotation =
                newRotation;

            draw();

            return;
        }
    }
}

/*
==========================================================
MOVEMENT
==========================================================
*/

function moveLeft() {
    if (!running || !currentPiece) {
        return;
    }

    if (!isCollision(currentPiece, -1, 0)) {
        currentPiece.x--;
        draw();
    }
}

function moveRight() {
    if (!running || !currentPiece) {
        return;
    }

    if (!isCollision(currentPiece, 1, 0)) {
        currentPiece.x++;
        draw();
    }
}

function softDrop() {
    if (!running || !currentPiece) {
        return;
    }

    if (!isCollision(currentPiece, 0, 1)) {
        currentPiece.y++;

        score++;

        updateHUD();
        draw();
    } else {
        lockPiece();
    }
}

function hardDrop() {
    if (!running || !currentPiece) {
        return;
    }

    let distance = 0;

    while (!isCollision(currentPiece, 0, 1)) {
        currentPiece.y++;
        distance++;
    }

    score += distance * 2;

    lockPiece();
}

/*
==========================================================
HOLD
==========================================================
*/

function holdCurrentPiece() {
    if (
        !running ||
        !currentPiece ||
        !canHold
    ) {
        return;
    }

    canHold = false;

    const currentType =
        currentPiece.type;

    if (holdType === null) {

        holdType =
            currentType;

        spawnPiece();

    } else {

        const swapType =
            holdType;

        holdType =
            currentType;

        currentPiece =
            createPiece(swapType);

        if (isCollision(currentPiece)) {
            endGame();
            return;
        }
    }

    drawHoldPreview();
    draw();
}

/*
==========================================================
SPAWN
==========================================================
*/

function spawnPiece() {
    currentPiece =
        createPiece(nextType);

    nextType =
        getPieceType();

    canHold = true;

    drawNextPreview();

    if (isCollision(currentPiece)) {
        endGame();
    }
}

/*
==========================================================
LOCK
==========================================================
*/

function lockPiece() {
    if (!currentPiece) {
        return;
    }

    for (
        let row = 0;
        row < currentPiece.shape.length;
        row++
    ) {
        for (
            let col = 0;
            col < currentPiece.shape[row].length;
            col++
        ) {
            if (!currentPiece.shape[row][col]) {
                continue;
            }

            const x =
                currentPiece.x + col;

            const y =
                currentPiece.y + row;

            if (
                y >= 0 &&
                y < ROWS &&
                x >= 0 &&
                x < COLS
            ) {
                board[y][x] =
                    currentPiece.color;
            }
        }
    }

    clearLines();

    spawnPiece();

    fallTimer = 0;

    updateHUD();
    draw();
}

/*
==========================================================
LINES
==========================================================
*/

function clearLines() {
    let cleared = 0;

    for (
        let row = ROWS - 1;
        row >= 0;
        row--
    ) {
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
        (points[cleared] || 0) *
        level;

    lines += cleared;

    level =
        Math.floor(lines / 10) + 1;

    updateHUD();
}

/*
==========================================================
GRAVITY
==========================================================
*/

function getFallDelay() {
    const gravityFrames = [
        48, // level 0
        43, // level 1
        38, // level 2
        33, // level 3
        28, // level 4
        23, // level 5
        18, // level 6
        13, // level 7
        8,  // level 8
        6,  // level 9
        5,  // level 10
        5,  // level 11
        5,  // level 12
        4,  // level 13
        4,  // level 14
        4,  // level 15
        3,  // level 16
        3,  // level 17
        3,  // level 18
        2,  // level 19
        2,  // level 20
        2,  // level 21
        2,  // level 22
        2,  // level 23
        2,  // level 24
        2,  // level 25
        2,  // level 26
        2,  // level 27
        2,  // level 28
        1   // level 29
    ];

    const index =
        Math.min(level, gravityFrames.length - 1);

    const framesPerCell =
        gravityFrames[index];

    return framesPerCell * (1000 / 60);
}

function update(deltaTime) {
    if (!running || !currentPiece) {
        return;
    }

    fallTimer += deltaTime;

    if (
        fallTimer <
        getFallDelay()
    ) {
        return;
    }

    fallTimer = 0;

    if (
        !isCollision(
            currentPiece,
            0,
            1
        )
    ) {
        currentPiece.y++;
    } else {
        lockPiece();
    }
}

/*
==========================================================
GHOST
==========================================================
*/

function getGhostPiece() {
    if (!currentPiece) {
        return null;
    }

    const ghost = {
        type: currentPiece.type,
        color: currentPiece.color,

        shape:
            currentPiece.shape.map(
                row => [...row]
            ),

        rotation:
            currentPiece.rotation,

        x: currentPiece.x,
        y: currentPiece.y
    };

    while (
        !isCollision(
            ghost,
            0,
            1,
            ghost.shape
        )
    ) {
        ghost.y++;
    }

    return ghost;
}

/*
==========================================================
DRAWING
==========================================================
*/

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

    context.globalAlpha =
        alpha;

    context.fillStyle =
        color;

    context.fillRect(
        x * BLOCK_SIZE + 1,
        y * BLOCK_SIZE + 1,
        BLOCK_SIZE - 2,
        BLOCK_SIZE - 2
    );

    context.globalAlpha = 1;

    context.strokeStyle =
        "rgba(255,255,255,0.20)";

    context.strokeRect(
        x * BLOCK_SIZE + 1.5,
        y * BLOCK_SIZE + 1.5,
        BLOCK_SIZE - 3,
        BLOCK_SIZE - 3
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

    for (
        let row = 0;
        row < piece.shape.length;
        row++
    ) {
        for (
            let col = 0;
            col < piece.shape[row].length;
            col++
        ) {
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

function drawGrid() {
    ctx.strokeStyle =
        "rgba(148,163,184,0.08)";

    ctx.lineWidth = 1;

    for (
        let x = 0;
        x <= COLS;
        x++
    ) {
        ctx.beginPath();

        ctx.moveTo(
            x * BLOCK_SIZE,
            0
        );

        ctx.lineTo(
            x * BLOCK_SIZE,
            ROWS * BLOCK_SIZE
        );

        ctx.stroke();
    }

    for (
        let y = 0;
        y <= ROWS;
        y++
    ) {
        ctx.beginPath();

        ctx.moveTo(
            0,
            y * BLOCK_SIZE
        );

        ctx.lineTo(
            COLS * BLOCK_SIZE,
            y * BLOCK_SIZE
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

    ctx.fillStyle =
        "#0B1026";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawGrid();

    for (
        let row = 0;
        row < ROWS;
        row++
    ) {
        for (
            let col = 0;
            col < COLS;
            col++
        ) {
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

    if (!currentPiece) {
        return;
    }

    const ghost =
        getGhostPiece();

    if (ghost) {
        drawPiece(
            ctx,
            ghost,
            0.15
        );
    }

    drawPiece(
        ctx,
        currentPiece,
        1
    );
}

/*
==========================================================
PREVIEWS
==========================================================
*/

function clearPreview(context) {
    context.clearRect(
        0,
        0,
        context.canvas.width,
        context.canvas.height
    );

    context.fillStyle =
        "#0B1026";

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
        shape[0].length *
        size;

    const height =
        shape.length *
        size;

    const offsetX =
        (
            context.canvas.width -
            width
        ) / 2;

    const offsetY =
        (
            context.canvas.height -
            height
        ) / 2;

    for (
        let row = 0;
        row < shape.length;
        row++
    ) {
        for (
            let col = 0;
            col < shape[row].length;
            col++
        ) {
            if (!shape[row][col]) {
                continue;
            }

            context.fillStyle =
                PIECES[type].color;

            context.fillRect(
                offsetX +
                    col * size +
                    1,

                offsetY +
                    row * size +
                    1,

                size - 2,
                size - 2
            );
        }
    }
}

function drawNextPreview() {
    drawPreview(
        nextCtx,
        nextType
    );
}

function drawHoldPreview() {
    drawPreview(
        holdCtx,
        holdType
    );
}

/*
==========================================================
HUD
==========================================================
*/

function updateHUD() {
    scoreDisplay.textContent =
        score;

    linesDisplay.textContent =
        lines;

    levelDisplay.textContent =
        level;
}

/*
==========================================================
MUSIC
==========================================================
*/

function updateMusicButton() {
    musicToggle.textContent =
        musicEnabled
            ? "🔊"
            : "🔇";

    musicToggle.setAttribute(
        "aria-label",
        musicEnabled
            ? "Mute music"
            : "Enable music"
    );
}

musicToggle.addEventListener(
    "click",
    () => {
        musicEnabled =
            !musicEnabled;

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

/*
==========================================================
START
==========================================================
*/

function startGame() {
    if (animationId !== null) {
        cancelAnimationFrame(
            animationId
        );

        animationId = null;
    }

    board =
        createBoard();

    currentPiece = null;
    nextType = null;
    holdType = null;

    bag = [];

    canHold = true;

    score = 0;
    lines = 0;
    level = 1;

    fallTimer = 0;

    running = true;
    gameOver = false;

    gameOverScreen.hidden =
        true;

    startButton.disabled = true;
    startButton.textContent =
        "Playing...";

    updateHUD();

    drawHoldPreview();

    /*
        First piece.
    */
    nextType =
        getPieceType();

    spawnPiece();

    drawNextPreview();
    draw();

    lastTime =
        performance.now();

    startMusic();

    animationId =
        requestAnimationFrame(
            gameLoop
        );
}

/*
==========================================================
GAME OVER
==========================================================
*/

function endGame() {
    if (gameOver) {
        return;
    }

    gameOver = true;
    running = false;

    if (animationId !== null) {
        cancelAnimationFrame(
            animationId
        );

        animationId = null;
    }

    stopMusic();

    finalScoreDisplay.textContent =
        score;

    gameOverScreen.hidden =
        false;

    startButton.disabled = false;
    startButton.textContent =
        "Start Game";
}

/*
==========================================================
GAME LOOP
==========================================================
*/

function gameLoop(timestamp) {
    if (!running) {
        return;
    }

    const deltaTime =
        timestamp -
        lastTime;

    lastTime =
        timestamp;

    update(deltaTime);

    draw();

    animationId =
        requestAnimationFrame(
            gameLoop
        );
}

/*
==========================================================
KEYBOARD
==========================================================
*/

document.addEventListener(
    "keydown",
    event => {
        if (!running) {
            return;
        }

        const key =
            event.key.toLowerCase();

        /*
            Prevent scrolling.
        */
        if (
            key === "w" ||
            key === "a" ||
            key === "s" ||
            key === "d" ||
            key === "q" ||
            key === "shift" ||
            event.code === "Space"
        ) {
            event.preventDefault();
        }

        switch (key) {

            case "a":
                moveLeft();
                break;

            case "d":
                moveRight();
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

            case "shift":
                holdCurrentPiece();
                break;
        }

        if (event.code === "Space") {
            hardDrop();
        }
    }
);

/*
==========================================================
MOBILE
==========================================================
*/

function bindControl(
    button,
    action
) {
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
    moveLeft
);

bindControl(
    moveRightButton,
    moveRight
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
    softDrop
);

bindControl(
    hardDropButton,
    hardDrop
);

bindControl(
    holdButton,
    holdCurrentPiece
);

/*
==========================================================
BUTTONS
==========================================================
*/

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);

/*
==========================================================
INITIAL
==========================================================
*/

updateHUD();
updateMusicButton();

drawNextPreview();
drawHoldPreview();
draw();
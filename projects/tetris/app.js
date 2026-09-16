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


/*
    --------------------------------------------------
    BOARD
    --------------------------------------------------
*/

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

let board = createBoard();


function createBoard() {
    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(0)
    );
}


/*
    --------------------------------------------------
    TETROMINOES
    --------------------------------------------------
*/

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

const PIECE_TYPES = Object.keys(PIECES);


/*
    --------------------------------------------------
    GAME STATE
    --------------------------------------------------
*/

let currentPiece = null;
let nextPiece = null;
let holdPiece = null;

let bag = [];

let canHold = true;

let score = 0;
let lines = 0;
let level = 1;

let gameRunning = false;
let gameOver = false;

let dropTimer = 0;
let lastTime = 0;
let animationFrame = null;


/*
    --------------------------------------------------
    7-BAG GENERATOR
    --------------------------------------------------
*/

function createBag() {
    const newBag = [...PIECE_TYPES];

    for (let i = newBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [newBag[i], newBag[j]] =
            [newBag[j], newBag[i]];
    }

    return newBag;
}


function getNextType() {
    if (bag.length === 0) {
        bag = createBag();
    }

    return bag.shift();
}


/*
    --------------------------------------------------
    PIECE HELPERS
    --------------------------------------------------
*/

function cloneMatrix(matrix) {
    return matrix.map(row => [...row]);
}


function createPiece(type) {
    const definition = PIECES[type];

    const shape = cloneMatrix(definition.shape);

    const width = shape[0].length;

    return {
        type,
        shape,
        color: definition.color,

        x: Math.floor(
            (COLS - width) / 2
        ),

        y: 0,

        rotation: 0
    };
}


function rotateMatrix(matrix, direction) {
    const size = matrix.length;

    const result =
        Array.from(
            { length: size },
            () => Array(size).fill(0)
        );

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {

            if (direction === 1) {
                result[col][size - 1 - row] =
                    matrix[row][col];
            }
            else {
                result[size - 1 - col][row] =
                    matrix[row][col];
            }
        }
    }

    return result;
}


/*
    --------------------------------------------------
    COLLISION
    --------------------------------------------------
*/

function collides(piece, offsetX = 0, offsetY = 0, testShape = piece.shape) {

    for (let row = 0; row < testShape.length; row++) {
        for (let col = 0; col < testShape[row].length; col++) {

            if (!testShape[row][col]) {
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

            if (y >= 0 && board[y][x]) {
                return true;
            }
        }
    }

    return false;
}


/*
    --------------------------------------------------
    MOVEMENT
    --------------------------------------------------
*/

function movePiece(direction) {
    if (!gameRunning) {
        return;
    }

    if (
        !collides(
            currentPiece,
            direction,
            0
        )
    ) {
        currentPiece.x += direction;
    }
}


function softDrop() {
    if (!gameRunning) {
        return;
    }

    if (
        !collides(
            currentPiece,
            0,
            1
        )
    ) {
        currentPiece.y += 1;

        score += 1;

        updateDisplays();
    }
    else {
        lockPiece();
    }
}


/*
    --------------------------------------------------
    ROTATION
    --------------------------------------------------
*/

function rotatePiece(direction) {
    if (!gameRunning) {
        return;
    }

    if (currentPiece.type === "O") {
        return;
    }

    const rotatedShape =
        rotateMatrix(
            makeSquareMatrix(currentPiece.shape),
            direction
        );

    /*
        Simple wall/floor kicks.
        These cover the common situations
        around edges and the floor.
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
            !collides(
                currentPiece,
                offsetX,
                offsetY,
                rotatedShape
            )
        ) {
            currentPiece.shape = rotatedShape;

            currentPiece.x += offsetX;
            currentPiece.y += offsetY;

            currentPiece.rotation =
                (
                    currentPiece.rotation +
                    direction +
                    4
                ) % 4;

            return;
        }
    }
}


function makeSquareMatrix(matrix) {
    const size =
        Math.max(
            matrix.length,
            matrix[0].length
        );

    const result =
        Array.from(
            { length: size },
            () => Array(size).fill(0)
        );

    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            result[row][col] =
                matrix[row][col];
        }
    }

    return result;
}


/*
    --------------------------------------------------
    HOLD
    --------------------------------------------------
*/

function holdCurrentPiece() {
    if (!gameRunning || !canHold) {
        return;
    }

    canHold = false;

    const currentType =
        currentPiece.type;

    if (holdPiece === null) {

        holdPiece = currentType;

        spawnNextPiece();
    }
    else {

        const swapType =
            holdPiece;

        holdPiece = currentType;

        currentPiece =
            createPiece(swapType);

        if (collides(currentPiece)) {
            endGame();
        }
    }

    drawHoldPiece();
}


/*
    --------------------------------------------------
    SPAWNING
    --------------------------------------------------
*/

function spawnNextPiece() {

    if (nextPiece === null) {
        nextPiece =
            getNextType();
    }

    currentPiece =
        createPiece(nextPiece);

    nextPiece =
        getNextType();

    canHold = true;

    drawNextPiece();

    if (collides(currentPiece)) {
        endGame();
    }
}


/*
    --------------------------------------------------
    HARD DROP
    --------------------------------------------------
*/

function hardDrop() {
    if (!gameRunning) {
        return;
    }

    let distance = 0;

    while (
        !collides(
            currentPiece,
            0,
            1
        )
    ) {
        currentPiece.y += 1;
        distance++;
    }

    score += distance * 2;

    lockPiece();
}


/*
    --------------------------------------------------
    LOCKING
    --------------------------------------------------
*/

function lockPiece() {

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

    spawnNextPiece();

    dropTimer = 0;

    updateDisplays();
}


/*
    --------------------------------------------------
    LINE CLEARING
    --------------------------------------------------
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
                cell => cell !== 0
            )
        ) {

            board.splice(row, 1);

            board.unshift(
                Array(COLS).fill(0)
            );

            cleared++;

            row++;
        }
    }

    if (cleared === 0) {
        return;
    }

    lines += cleared;

    const lineScores = {
        1: 100,
        2: 300,
        3: 500,
        4: 800
    };

    score +=
        (lineScores[cleared] || 0) *
        level;

    level =
        Math.floor(lines / 10) + 1;

    updateDisplays();
}


/*
    --------------------------------------------------
    GHOST PIECE
    --------------------------------------------------
*/

function getGhostPiece() {

    const ghost = {
        ...currentPiece,
        shape: cloneMatrix(
            currentPiece.shape
        )
    };

    while (
        !collides(
            ghost,
            0,
            1,
            ghost.shape
        )
    ) {
        ghost.y += 1;
    }

    return ghost;
}


/*
    --------------------------------------------------
    GRAVITY
    --------------------------------------------------
*/

function getDropInterval() {

    /*
        Starts comfortably slow and becomes
        faster every level.
    */
    return Math.max(
        70,
        900 -
        (level - 1) * 80
    );
}


function update(delta) {

    dropTimer += delta;

    if (
        dropTimer >=
        getDropInterval()
    ) {

        dropTimer = 0;

        if (
            !collides(
                currentPiece,
                0,
                1
            )
        ) {
            currentPiece.y += 1;
        }
        else {
            lockPiece();
        }
    }
}


/*
    --------------------------------------------------
    DRAW BOARD
    --------------------------------------------------
*/

function drawBoard() {

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

    /*
        Grid
    */
    ctx.strokeStyle =
        "rgba(148, 163, 184, 0.08)";

    ctx.lineWidth = 1;

    for (let x = 0; x <= COLS; x++) {

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

    for (let y = 0; y <= ROWS; y++) {

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

    /*
        Locked blocks
    */
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

    /*
        Ghost
    */
    const ghost =
        getGhostPiece();

    drawPiece(
        ctx,
        ghost,
        true
    );

    /*
        Current piece
    */
    drawPiece(
        ctx,
        currentPiece,
        false
    );
}


function drawBlock(
    context,
    x,
    y,
    color,
    size,
    ghost = false
) {

    context.fillStyle =
        ghost
            ? "rgba(255,255,255,0.12)"
            : color;

    context.fillRect(
        x * size + 1,
        y * size + 1,
        size - 2,
        size - 2
    );

    if (!ghost) {

        context.strokeStyle =
            "rgba(255,255,255,0.22)";

        context.lineWidth = 1;

        context.strokeRect(
            x * size + 1.5,
            y * size + 1.5,
            size - 3,
            size - 3
        );
    }
}


function drawPiece(
    context,
    piece,
    ghost
) {

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

            const x =
                piece.x + col;

            const y =
                piece.y + row;

            if (y < 0) {
                continue;
            }

            drawBlock(
                context,
                x,
                y,
                piece.color,
                BLOCK_SIZE,
                ghost
            );
        }
    }
}


/*
    --------------------------------------------------
    NEXT / HOLD PREVIEWS
    --------------------------------------------------
*/

function drawPreview(
    context,
    type
) {

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

    if (!type) {
        return;
    }

    const definition =
        PIECES[type];

    const shape =
        definition.shape;

    const size = 24;

    const width =
        shape[0].length * size;

    const height =
        shape.length * size;

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
                definition.color;

            context.fillRect(
                offsetX +
                col * size + 1,
                offsetY +
                row * size + 1,
                size - 2,
                size - 2
            );
        }
    }
}


function drawNextPiece() {
    drawPreview(
        nextCtx,
        nextPiece
    );
}


function drawHoldPiece() {
    drawPreview(
        holdCtx,
        holdPiece
    );
}


/*
    --------------------------------------------------
    UI
    --------------------------------------------------
*/

function updateDisplays() {

    scoreDisplay.textContent =
        score;

    linesDisplay.textContent =
        lines;

    levelDisplay.textContent =
        level;
}


/*
    --------------------------------------------------
    MUSIC
    --------------------------------------------------
*/

let musicEnabled = true;

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

        if (musicEnabled) {

            if (gameRunning) {
                music.play().catch(() => {});
            }
        }
        else {
            music.pause();
        }

        updateMusicButton();
    }
);


/*
    --------------------------------------------------
    GAME START / RESTART
    --------------------------------------------------
*/

function resetGame() {

    board =
        createBoard();

    score = 0;
    lines = 0;
    level = 1;

    holdPiece = null;
    currentPiece = null;
    nextPiece = null;

    bag = [];

    canHold = true;

    dropTimer = 0;
    lastTime = 0;

    gameOver = false;
    gameRunning = true;

    gameOverScreen.hidden = true;

    startButton.disabled = true;
    startButton.textContent = "Playing...";

    updateDisplays();

    drawHoldPiece();

    nextPiece =
        getNextType();

    spawnNextPiece();

    if (musicEnabled) {
        music.currentTime = 0;

        music.play().catch(() => {});
    }
}


startButton.addEventListener(
    "click",
    () => {
        resetGame();
    }
);


restartButton.addEventListener(
    "click",
    () => {
        resetGame();
    }
);


/*
    --------------------------------------------------
    GAME OVER
    --------------------------------------------------
*/

function endGame() {

    if (gameOver) {
        return;
    }

    gameOver = true;
    gameRunning = false;

    cancelAnimationFrame(
        animationFrame
    );

    music.pause();

    finalScoreDisplay.textContent =
        score;

    gameOverScreen.hidden = false;

    startButton.disabled = false;
    startButton.textContent =
        "Start Game";
}


/*
    --------------------------------------------------
    MAIN LOOP
    --------------------------------------------------
*/

function gameLoop(time = 0) {

    if (!gameRunning) {
        return;
    }

    const delta =
        time - lastTime;

    lastTime = time;

    update(delta);

    drawBoard();

    animationFrame =
        requestAnimationFrame(
            gameLoop
        );
}


/*
    --------------------------------------------------
    KEYBOARD CONTROLS
    --------------------------------------------------
*/

document.addEventListener(
    "keydown",
    (event) => {

        if (!gameRunning) {
            return;
        }

        const key =
            event.key.toLowerCase();

        /*
            Prevent these controls from
            scrolling or interacting with
            the page.
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


/*
    --------------------------------------------------
    MOBILE / BUTTON CONTROLS
    --------------------------------------------------
*/

function bindButton(
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


bindButton(
    moveLeftButton,
    () => movePiece(-1)
);

bindButton(
    moveRightButton,
    () => movePiece(1)
);

bindButton(
    rotateCcwButton,
    () => rotatePiece(-1)
);

bindButton(
    rotateCwButton,
    () => rotatePiece(1)
);

bindButton(
    softDropButton,
    () => softDrop()
);

bindButton(
    hardDropButton,
    () => hardDrop()
);

bindButton(
    holdButton,
    () => holdCurrentPiece()
);


/*
    --------------------------------------------------
    INITIAL DISPLAY
    --------------------------------------------------
*/

updateMusicButton();
updateDisplays();

drawBoard();
drawNextPiece();
drawHoldPiece();
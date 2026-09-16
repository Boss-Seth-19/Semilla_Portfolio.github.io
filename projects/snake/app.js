const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");

const status = document.getElementById("status");
const restartButton = document.getElementById("restart-button");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake;
let food;
let direction;
let nextDirection;
let score;
let gameLoop;
let gameActive = false;


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

        audioContext = new AudioContext();
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
    const audio = getAudioContext();

    if (!audio) {
        return;
    }

    if (audio.state === "suspended") {
        audio.resume().catch(() => {});
    }

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

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

function playFoodSound() {
    playTone(
        520,
        0.06,
        "square",
        0.04
    );

    playTone(
        700,
        0.08,
        "square",
        0.05,
        0.06
    );
}

function playGameOverSound() {
    playTone(
        440,
        0.10,
        "square",
        0.045
    );

    playTone(
        330,
        0.10,
        "square",
        0.045,
        0.11
    );

    playTone(
        220,
        0.18,
        "square",
        0.055,
        0.22
    );
}

function playRestartSound() {
    playTone(
        380,
        0.05,
        "square",
        0.03
    );
}


/* =========================================================
   GAME SETUP
========================================================= */

function prepareGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    direction = { x: 0, y: 0 };
    nextDirection = { x: 0, y: 0 };

    score = 0;
    gameActive = false;

    clearInterval(gameLoop);

    status.textContent =
        "Press W, A, S, or D to start";

    playRestartSound();

    drawGame();
}

function startGame() {
    gameActive = true;

    status.textContent =
        `Score: ${score}`;

    clearInterval(gameLoop);

    gameLoop =
        setInterval(
            updateGame,
            100
        );
}


/* =========================================================
   GAME UPDATE
========================================================= */

function updateGame() {
    direction = nextDirection;

    const head = {
        x:
            snake[0].x +
            direction.x,

        y:
            snake[0].y +
            direction.y
    };

    if (checkCollision(head)) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (
        head.x === food.x &&
        head.y === food.y
    ) {
        score++;

        status.textContent =
            `Score: ${score}`;

        playFoodSound();

        placeFood();
    } else {
        snake.pop();
    }

    drawGame();
}


/* =========================================================
   DRAWING
========================================================= */

function drawGame() {
    ctx.fillStyle = "#0B1026";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Food
    ctx.fillStyle = "#7C3AED";

    ctx.fillRect(
        food.x * gridSize,
        food.y * gridSize,
        gridSize,
        gridSize
    );

    // Snake
    snake.forEach(
        (segment, index) => {

            ctx.fillStyle =
                index === 0
                    ? "#38BDF8"
                    : "#4F46E5";

            ctx.fillRect(
                segment.x * gridSize,
                segment.y * gridSize,
                gridSize - 1,
                gridSize - 1
            );
        }
    );
}


/* =========================================================
   COLLISION
========================================================= */

function checkCollision(head) {

    // Wall collision
    if (
        head.x < 0 ||
        head.x >= tileCount ||
        head.y < 0 ||
        head.y >= tileCount
    ) {
        return true;
    }

    // Snake collision
    return snake.some(
        segment =>
            segment.x === head.x &&
            segment.y === head.y
    );
}


/* =========================================================
   FOOD
========================================================= */

function placeFood() {

    do {
        food = {
            x:
                Math.floor(
                    Math.random() *
                    tileCount
                ),

            y:
                Math.floor(
                    Math.random() *
                    tileCount
                )
        };

    } while (
        snake.some(
            segment =>
                segment.x === food.x &&
                segment.y === food.y
        )
    );
}


/* =========================================================
   GAME OVER
========================================================= */

function endGame() {
    gameActive = false;

    clearInterval(gameLoop);

    status.textContent =
        `Game Over! Score: ${score}`;

    playGameOverSound();
}


/* =========================================================
   KEYBOARD CONTROLS
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();

        if (
            !["w", "a", "s", "d"].includes(key)
        ) {
            return;
        }

        event.preventDefault();

        /*
            Start game on first valid
            movement key.
        */
        if (!gameActive) {
            startGame();
        }

        /*
            Prevent immediate 180-degree turns.
        */

        if (key === "w") {
            if (direction.y !== 1) {
                nextDirection =
                    { x: 0, y: -1 };
            }
        }

        if (key === "s") {
            if (direction.y !== -1) {
                nextDirection =
                    { x: 0, y: 1 };
            }
        }

        if (key === "a") {
            if (direction.x !== 1) {
                nextDirection =
                    { x: -1, y: 0 };
            }
        }

        if (key === "d") {
            if (direction.x !== -1) {
                nextDirection =
                    { x: 1, y: 0 };
            }
        }
    }
);


/* =========================================================
   RESTART
========================================================= */

restartButton.addEventListener(
    "click",
    prepareGame
);


/* =========================================================
   INITIAL
========================================================= */

prepareGame();
const canvas = document.getElementById("pong-board");
const ctx = canvas.getContext("2d");

const playerScoreDisplay =
    document.getElementById("player-score");

const cpuScoreDisplay =
    document.getElementById("cpu-score");

const startButton =
    document.getElementById("start-button");

const restartButton =
    document.getElementById("restart-button");

const statusText =
    document.getElementById("status-text");

const gameOverScreen =
    document.getElementById("game-over-screen");

const gameResult =
    document.getElementById("game-result");

const finalScore =
    document.getElementById("final-score");

const moveUpButton =
    document.getElementById("move-up");

const moveDownButton =
    document.getElementById("move-down");


/* =========================================================
   GAME SETTINGS
========================================================= */

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const PLAYER_WIDTH = 12;
const PLAYER_HEIGHT = 90;

const CPU_WIDTH = 12;
const CPU_HEIGHT = 90;

const PADDLE_SPEED = 7;

const WINNING_SCORE = 7;

const START_BALL_SPEED = 5;
const MAX_BALL_SPEED = 12;


/* =========================================================
   GAME OBJECTS
========================================================= */

const player = {
    x: 25,
    y: HEIGHT / 2 - PLAYER_HEIGHT / 2,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PADDLE_SPEED
};

const cpu = {
    x: WIDTH - 25 - CPU_WIDTH,
    y: HEIGHT / 2 - CPU_HEIGHT / 2,
    width: CPU_WIDTH,
    height: CPU_HEIGHT,
    speed: 4.5
};

const ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    size: 10,
    speedX: START_BALL_SPEED,
    speedY: 0
};


/* =========================================================
   GAME STATE
========================================================= */

let playerScore = 0;
let cpuScore = 0;

let gameRunning = false;
let gameEnded = false;

let animationId = null;

let keys = {
    w: false,
    s: false
};


/* =========================================================
   SOUND EFFECTS
========================================================= */

let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }

    return audioContext;
}

function playSound(
    frequency,
    duration = 0.05
) {
    try {
        const audio =
            getAudioContext();

        if (audio.state === "suspended") {
            audio.resume();
        }

        const oscillator =
            audio.createOscillator();

        const gain =
            audio.createGain();

        oscillator.type = "square";

        oscillator.frequency.setValueAtTime(
            frequency,
            audio.currentTime
        );

        gain.gain.setValueAtTime(
            0.08,
            audio.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.start();

        oscillator.stop(
            audio.currentTime + duration
        );
    } catch (error) {
        console.warn(
            "Sound could not play:",
            error
        );
    }
}


/* =========================================================
   RESET BALL
========================================================= */

function resetBall(direction) {

    ball.x =
        WIDTH / 2 -
        ball.size / 2;

    ball.y =
        HEIGHT / 2 -
        ball.size / 2;

    /*
        Small random angle so the ball
        doesn't always travel perfectly
        horizontally.
    */

    const angle =
        (
            Math.random() * 0.8
        ) - 0.4;

    const speed =
        START_BALL_SPEED;

    ball.speedX =
        speed * direction;

    ball.speedY =
        speed * Math.sin(angle);

    player.y =
        HEIGHT / 2 -
        PLAYER_HEIGHT / 2;

    cpu.y =
        HEIGHT / 2 -
        CPU_HEIGHT / 2;
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    if (animationId !== null) {
        cancelAnimationFrame(
            animationId
        );

        animationId = null;
    }

    playerScore = 0;
    cpuScore = 0;

    gameRunning = true;
    gameEnded = false;

    player.y =
        HEIGHT / 2 -
        PLAYER_HEIGHT / 2;

    cpu.y =
        HEIGHT / 2 -
        CPU_HEIGHT / 2;

    resetBall(
        Math.random() < 0.5
            ? -1
            : 1
    );

    updateScore();

    gameOverScreen.hidden = true;

    startButton.disabled = true;
    startButton.textContent =
        "Playing...";

    statusText.textContent =
        "First to 7 wins";

    /*
        Resume audio after the user's
        Start button interaction.
    */
    try {
        getAudioContext().resume();
    } catch (error) {
        console.warn(error);
    }

    animationId =
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================================================
   END GAME
========================================================= */

function endGame() {

    gameRunning = false;
    gameEnded = true;

    if (animationId !== null) {
        cancelAnimationFrame(
            animationId
        );

        animationId = null;
    }

    if (playerScore >= WINNING_SCORE) {
        gameResult.textContent =
            "YOU WIN!";
    } else {
        gameResult.textContent =
            "CPU WINS!";
    }

    finalScore.textContent =
        `${playerScore} - ${cpuScore}`;

    statusText.textContent =
        "Game Over";

    startButton.disabled = false;
    startButton.textContent =
        "Start Game";

    gameOverScreen.hidden = false;

    playSound(
        playerScore >= WINNING_SCORE
            ? 880
            : 220,
        0.3
    );

    draw();
}


/* =========================================================
   SCORE
========================================================= */

function updateScore() {
    playerScoreDisplay.textContent =
        playerScore;

    cpuScoreDisplay.textContent =
        cpuScore;
}


/* =========================================================
   PLAYER INPUT
========================================================= */

function updatePlayer() {

    if (keys.w) {
        player.y -= player.speed;
    }

    if (keys.s) {
        player.y += player.speed;
    }

    clampPaddle(player);
}


/* =========================================================
   CPU
========================================================= */

function updateCPU() {

    /*
        Simple CPU:
        follows the ball with a limited speed
        so the player can still beat it.
    */

    const playerCenter =
        cpu.y +
        cpu.height / 2;

    const ballCenter =
        ball.y +
        ball.size / 2;

    const difference =
        ballCenter -
        playerCenter;

    if (Math.abs(difference) > 8) {

        const movement =
            Math.sign(difference) *
            cpu.speed;

        cpu.y += movement;
    }

    clampPaddle(cpu);
}


/* =========================================================
   CLAMP PADDLES
========================================================= */

function clampPaddle(paddle) {

    if (paddle.y < 0) {
        paddle.y = 0;
    }

    if (
        paddle.y +
        paddle.height >
        HEIGHT
    ) {
        paddle.y =
            HEIGHT -
            paddle.height;
    }
}


/* =========================================================
   BALL
========================================================= */

function updateBall() {

    ball.x += ball.speedX;
    ball.y += ball.speedY;

    /*
        Top / bottom walls
    */

    if (ball.y <= 0) {

        ball.y = 0;

        ball.speedY =
            Math.abs(ball.speedY);

        playSound(
            520,
            0.04
        );
    }

    if (
        ball.y +
        ball.size >=
        HEIGHT
    ) {

        ball.y =
            HEIGHT -
            ball.size;

        ball.speedY =
            -Math.abs(ball.speedY);

        playSound(
            520,
            0.04
        );
    }

    /*
        Player paddle
    */

    if (
        ball.speedX < 0 &&
        checkPaddleCollision(
            ball,
            player
        )
    ) {
        hitPaddle(player);
    }

    /*
        CPU paddle
    */

    if (
        ball.speedX > 0 &&
        checkPaddleCollision(
            ball,
            cpu
        )
    ) {
        hitPaddle(cpu);
    }

    /*
        Player missed
    */

    if (
        ball.x +
        ball.size <
        0
    ) {
        cpuScore++;

        updateScore();

        playSound(
            180,
            0.12
        );

        if (
            cpuScore >=
            WINNING_SCORE
        ) {
            endGame();
            return;
        }

        resetBall(1);
    }

    /*
        CPU missed
    */

    if (
        ball.x >
        WIDTH
    ) {
        playerScore++;

        updateScore();

        playSound(
            760,
            0.12
        );

        if (
            playerScore >=
            WINNING_SCORE
        ) {
            endGame();
            return;
        }

        resetBall(-1);
    }
}


/* =========================================================
   PADDLE COLLISION
========================================================= */

function checkPaddleCollision(
    ballObject,
    paddle
) {

    return (
        ballObject.x <
            paddle.x +
            paddle.width &&

        ballObject.x +
            ballObject.size >
            paddle.x &&

        ballObject.y <
            paddle.y +
            paddle.height &&

        ballObject.y +
            ballObject.size >
            paddle.y
    );
}


/* =========================================================
   PADDLE HIT
========================================================= */

function hitPaddle(paddle) {

    /*
        Find where the ball struck the paddle.

        -1 = top
         0 = center
         1 = bottom
    */

    const paddleCenter =
        paddle.y +
        paddle.height / 2;

    const ballCenter =
        ball.y +
        ball.size / 2;

    const relativeHit =
        (
            ballCenter -
            paddleCenter
        ) /
        (paddle.height / 2);

    /*
        Convert the hit position into
        a vertical launch angle.
    */

    const maxAngle =
        Math.PI / 3;

    const angle =
        relativeHit *
        maxAngle;

    /*
        Increase ball speed
        slightly after every hit.
    */

    const currentSpeed =
        Math.sqrt(
            ball.speedX * ball.speedX +
            ball.speedY * ball.speedY
        );

    const newSpeed =
        Math.min(
            currentSpeed + 0.35,
            MAX_BALL_SPEED
        );

    const direction =
        ball.speedX > 0
            ? 1
            : -1;

    ball.speedX =
        Math.cos(angle) *
        newSpeed *
        -direction;

    ball.speedY =
        Math.sin(angle) *
        newSpeed;

    /*
        Move the ball outside the paddle
        so it cannot immediately collide
        again.
    */

    if (direction < 0) {
        ball.x =
            paddle.x +
            paddle.width;
    } else {
        ball.x =
            paddle.x -
            ball.size;
    }

    playSound(
        direction < 0
            ? 440
            : 660,
        0.05
    );
}


/* =========================================================
   DRAW
========================================================= */

function drawBackground() {

    ctx.fillStyle =
        "#071331";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    /*
        Center dashed line
    */

    ctx.strokeStyle =
        "rgba(248,250,252,0.20)";

    ctx.lineWidth = 3;

    ctx.setLineDash([
        12,
        12
    ]);

    ctx.beginPath();

    ctx.moveTo(
        WIDTH / 2,
        0
    );

    ctx.lineTo(
        WIDTH / 2,
        HEIGHT
    );

    ctx.stroke();

    ctx.setLineDash([]);
}


/* =========================================================
   DRAW PADDLE
========================================================= */

function drawPaddle(paddle) {

    ctx.fillStyle =
        "#F8FAFC";

    ctx.fillRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );
}


/* =========================================================
   DRAW BALL
========================================================= */

function drawBall() {

    ctx.fillStyle =
        "#38BDF8";

    ctx.beginPath();

    ctx.arc(
        ball.x +
            ball.size / 2,

        ball.y +
            ball.size / 2,

        ball.size / 2,

        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================================================
   DRAW EVERYTHING
========================================================= */

function draw() {

    drawBackground();

    drawPaddle(player);

    drawPaddle(cpu);

    drawBall();
}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop() {

    if (!gameRunning) {
        return;
    }

    updatePlayer();

    updateCPU();

    updateBall();

    draw();

    animationId =
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();

        if (
            key === "w" ||
            key === "s"
        ) {
            event.preventDefault();
        }

        if (key === "w") {
            keys.w = true;
        }

        if (key === "s") {
            keys.s = true;
        }
    }
);

document.addEventListener(
    "keyup",
    event => {

        const key =
            event.key.toLowerCase();

        if (key === "w") {
            keys.w = false;
        }

        if (key === "s") {
            keys.s = false;
        }
    }
);


/* =========================================================
   MOBILE CONTROLS
========================================================= */

function bindHoldButton(
    button,
    key
) {

    function press(event) {
        event.preventDefault();
        keys[key] = true;
    }

    function release(event) {
        event.preventDefault();
        keys[key] = false;
    }

    button.addEventListener(
        "pointerdown",
        press
    );

    button.addEventListener(
        "pointerup",
        release
    );

    button.addEventListener(
        "pointercancel",
        release
    );

    button.addEventListener(
        "pointerleave",
        release
    );
}

bindHoldButton(
    moveUpButton,
    "w"
);

bindHoldButton(
    moveDownButton,
    "s"
);


/* =========================================================
   BUTTONS
========================================================= */

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);


/* =========================================================
   INITIAL
========================================================= */

updateScore();

draw();
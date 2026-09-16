const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const restartButton = document.getElementById("restart-button");

const BALL_SPEED = 5.5;

const NORMAL_PADDLE_WIDTH = 100;
const LONG_PADDLE_WIDTH = 150;
const PADDLE_POWERUP_DURATION = 7000;

const FIRST_POWERUP_BRICK = 10;
const POWERUP_INTERVAL = 5;
const POWERUP_SPAWN_CHANCE = 0.55;

const POWERUP_SPEED = 1.5;
const POWERUP_SIZE = 18;

const paddle = {
    width: NORMAL_PADDLE_WIDTH,
    height: 12,
    x: 250,
    y: 470,
    speed: 7,
    dx: 0
};

const brickSettings = {
    rows: 5,
    columns: 10,
    width: 50,
    height: 20,
    padding: 8,
    offsetTop: 45
};

let bricks = [];
let balls = [];
let powerups = [];

let score = 0;
let lives = 3;

let gameActive = true;
let waitingForLaunch = true;

let bricksDestroyedSincePowerup = 0;

let paddlePowerupTimer = null;
let animationFrame;

/*
    --------------------------------------------------
    BRICKS
    --------------------------------------------------
*/

function getBrickOffsetLeft() {
    const totalWidth =
        brickSettings.columns * brickSettings.width +
        (brickSettings.columns - 1) * brickSettings.padding;

    return (canvas.width - totalWidth) / 2;
}

function createBricks() {
    bricks = [];

    const offsetLeft = getBrickOffsetLeft();

    for (let row = 0; row < brickSettings.rows; row++) {
        for (let column = 0; column < brickSettings.columns; column++) {
            bricks.push({
                x:
                    offsetLeft +
                    column * (brickSettings.width + brickSettings.padding),

                y:
                    brickSettings.offsetTop +
                    row * (brickSettings.height + brickSettings.padding),

                width: brickSettings.width,
                height: brickSettings.height,

                active: true
            });
        }
    }
}

/*
    --------------------------------------------------
    BALL
    --------------------------------------------------
*/

function normalizeBallSpeed(ball) {
    const currentSpeed = Math.sqrt(
        ball.dx * ball.dx +
        ball.dy * ball.dy
    );

    if (currentSpeed === 0) {
        return;
    }

    ball.dx = (ball.dx / currentSpeed) * BALL_SPEED;
    ball.dy = (ball.dy / currentSpeed) * BALL_SPEED;
}

function resetBallsToPaddle() {
    balls = [
        {
            x: paddle.x + paddle.width / 2,
            y: paddle.y - 10,
            radius: 8,
            dx: 0,
            dy: 0,
            launched: false
        }
    ];

    waitingForLaunch = true;
}

function updateWaitingBall() {
    if (!waitingForLaunch || balls.length !== 1) {
        return;
    }

    balls[0].x = paddle.x + paddle.width / 2;
    balls[0].y = paddle.y - balls[0].radius - 2;
}

function launchBall() {
    if (!gameActive || !waitingForLaunch) {
        return;
    }

    waitingForLaunch = false;

    const ball = balls[0];

    ball.launched = true;

    ball.dx = BALL_SPEED * 0.55;
    ball.dy = -BALL_SPEED;

    normalizeBallSpeed(ball);
}

/*
    --------------------------------------------------
    PADDLE POWERUP
    --------------------------------------------------
*/

function activateLongPaddle() {
    paddle.width = LONG_PADDLE_WIDTH;

    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }

    clearTimeout(paddlePowerupTimer);

    paddlePowerupTimer = setTimeout(() => {
        paddle.width = NORMAL_PADDLE_WIDTH;

        if (paddle.x + paddle.width > canvas.width) {
            paddle.x = canvas.width - paddle.width;
        }
    }, PADDLE_POWERUP_DURATION);
}

/*
    --------------------------------------------------
    POWERUPS
    --------------------------------------------------
*/

function createPowerup(x, y) {
    const type =
        Math.random() < 0.5
            ? "long-paddle"
            : "duplicate-ball";

    powerups.push({
        x,
        y,
        size: POWERUP_SIZE,
        speed: POWERUP_SPEED,
        type
    });
}

function checkPowerupSpawn(brick) {
    bricksDestroyedSincePowerup++;

    let canSpawn = false;

    /*
        First chance after 10 bricks.
    */
    if (score >= FIRST_POWERUP_BRICK) {
        if (
            bricksDestroyedSincePowerup >=
            FIRST_POWERUP_BRICK
        ) {
            canSpawn = true;
        }
        else if (
            bricksDestroyedSincePowerup >=
            POWERUP_INTERVAL
        ) {
            canSpawn = true;
        }
    }

    /*
        Never stack multiple falling powerups.
    */
    if (!canSpawn || powerups.length > 0) {
        return;
    }

    if (Math.random() <= POWERUP_SPAWN_CHANCE) {
        createPowerup(
            brick.x + brick.width / 2,
            brick.y + brick.height / 2
        );

        bricksDestroyedSincePowerup = 0;
    }
}

function duplicateBall() {
    if (balls.length === 0) {
        return;
    }

    const sourceBall =
        balls[Math.floor(Math.random() * balls.length)];

    const angle =
        Math.atan2(sourceBall.dy, sourceBall.dx);

    const newAngle =
        angle + Math.PI / 5;

    const newBall = {
        x: sourceBall.x,
        y: sourceBall.y,
        radius: sourceBall.radius,
        dx: Math.cos(newAngle) * BALL_SPEED,
        dy: Math.sin(newAngle) * BALL_SPEED,
        launched: true
    };

    normalizeBallSpeed(newBall);

    balls.push(newBall);
}

function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];

        powerup.y += powerup.speed;

        /*
            Collect only when the powerup actually
            overlaps the paddle.
        */
        if (
            powerup.y + powerup.size / 2 >= paddle.y &&
            powerup.y - powerup.size / 2 <=
                paddle.y + paddle.height &&
            powerup.x + powerup.size / 2 >= paddle.x &&
            powerup.x - powerup.size / 2 <=
                paddle.x + paddle.width
        ) {
            if (powerup.type === "long-paddle") {
                activateLongPaddle();
            }

            if (powerup.type === "duplicate-ball") {
                duplicateBall();
            }

            powerups.splice(i, 1);
            continue;
        }

        /*
            Remove when it falls below the screen.
        */
        if (
            powerup.y - powerup.size >
            canvas.height
        ) {
            powerups.splice(i, 1);
        }
    }
}

/*
    --------------------------------------------------
    DRAWING
    --------------------------------------------------
*/

function drawBackground() {
    ctx.fillStyle = "#0B1026";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBricks() {
    bricks.forEach((brick) => {
        if (!brick.active) {
            return;
        }

        ctx.fillStyle = "#7C3AED";

        ctx.fillRect(
            brick.x,
            brick.y,
            brick.width,
            brick.height
        );
    });
}

function drawPaddle() {
    ctx.fillStyle = "#38BDF8";

    ctx.fillRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );
}

function drawBalls() {
    balls.forEach((ball) => {
        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            ball.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#F8FAFC";
        ctx.fill();

        ctx.closePath();
    });
}

function drawPowerups() {
    powerups.forEach((powerup) => {
        ctx.beginPath();

        ctx.arc(
            powerup.x,
            powerup.y,
            powerup.size / 2,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            powerup.type === "long-paddle"
                ? "#38BDF8"
                : "#7C3AED";

        ctx.fill();

        ctx.closePath();

        ctx.fillStyle = "#0B1026";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            powerup.type === "long-paddle"
                ? "P"
                : "2",
            powerup.x,
            powerup.y
        );
    });
}

/*
    --------------------------------------------------
    PADDLE
    --------------------------------------------------
*/

function updatePaddle() {
    paddle.x += paddle.dx;

    if (paddle.x < 0) {
        paddle.x = 0;
    }

    if (
        paddle.x + paddle.width >
        canvas.width
    ) {
        paddle.x =
            canvas.width - paddle.width;
    }
}

/*
    --------------------------------------------------
    BALL MOVEMENT
    --------------------------------------------------
*/

function updateBalls() {
    if (waitingForLaunch) {
        return;
    }

    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];

        const previousX = ball.x;
        const previousY = ball.y;

        ball.x += ball.dx;
        ball.y += ball.dy;

        /*
            Left wall
        */
        if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.dx = Math.abs(ball.dx);
        }

        /*
            Right wall
        */
        if (
            ball.x + ball.radius >=
            canvas.width
        ) {
            ball.x =
                canvas.width - ball.radius;

            ball.dx =
                -Math.abs(ball.dx);
        }

        /*
            Top wall
        */
        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.dy = Math.abs(ball.dy);
        }

        /*
            Paddle collision.

            Important:
            The ball must cross the TOP of the paddle
            while moving downward. Simply touching
            the side is not enough.
        */
        const previousBottom =
            previousY + ball.radius;

        const currentBottom =
            ball.y + ball.radius;

        const crossedPaddleTop =
            previousBottom <= paddle.y &&
            currentBottom >= paddle.y;

        const overlapsPaddle =
            ball.x + ball.radius >= paddle.x &&
            ball.x - ball.radius <=
                paddle.x + paddle.width;

        if (
            ball.dy > 0 &&
            crossedPaddleTop &&
            overlapsPaddle
        ) {
            ball.y =
                paddle.y -
                ball.radius;

            const paddleCenter =
                paddle.x +
                paddle.width / 2;

            const hitPosition =
                (ball.x - paddleCenter) /
                (paddle.width / 2);

            ball.dx =
                hitPosition *
                BALL_SPEED *
                0.85;

            const horizontalSpeed =
                Math.abs(ball.dx);

            ball.dy =
                -Math.sqrt(
                    Math.max(
                        BALL_SPEED *
                            BALL_SPEED -
                            horizontalSpeed *
                                horizontalSpeed,
                        1
                    )
                );

            normalizeBallSpeed(ball);
        }

        checkBrickCollisions(
            ball,
            previousX,
            previousY
        );

        /*
            Remove ball if it goes below
            the bottom of the canvas.
        */
        if (
            ball.y - ball.radius >
            canvas.height
        ) {
            balls.splice(i, 1);
        }
    }

    /*
        Only lose a life when every ball
        has disappeared.
    */
    if (
        !waitingForLaunch &&
        balls.length === 0
    ) {
        loseLife();
    }
}

/*
    --------------------------------------------------
    BRICK COLLISION
    --------------------------------------------------
*/

function checkBrickCollisions(
    ball,
    previousX,
    previousY
) {
    for (const brick of bricks) {
        if (!brick.active) {
            continue;
        }

        const ballLeft =
            ball.x - ball.radius;

        const ballRight =
            ball.x + ball.radius;

        const ballTop =
            ball.y - ball.radius;

        const ballBottom =
            ball.y + ball.radius;

        const brickLeft = brick.x;
        const brickRight =
            brick.x + brick.width;

        const brickTop = brick.y;
        const brickBottom =
            brick.y + brick.height;

        const collision =
            ballRight >= brickLeft &&
            ballLeft <= brickRight &&
            ballBottom >= brickTop &&
            ballTop <= brickBottom;

        if (!collision) {
            continue;
        }

        const wasAbove =
            previousY + ball.radius <= brickTop;

        const wasBelow =
            previousY - ball.radius >=
            brickBottom;

        const wasLeft =
            previousX + ball.radius <=
            brickLeft;

        const wasRight =
            previousX - ball.radius >=
            brickRight;

        brick.active = false;

        score++;
        scoreDisplay.textContent = score;

        checkPowerupSpawn(brick);

        if (wasAbove) {
            ball.y =
                brickTop -
                ball.radius;

            ball.dy =
                -Math.abs(ball.dy);
        }
        else if (wasBelow) {
            ball.y =
                brickBottom +
                ball.radius;

            ball.dy =
                Math.abs(ball.dy);
        }
        else if (wasLeft) {
            ball.x =
                brickLeft -
                ball.radius;

            ball.dx =
                -Math.abs(ball.dx);
        }
        else if (wasRight) {
            ball.x =
                brickRight +
                ball.radius;

            ball.dx =
                Math.abs(ball.dx);
        }
        else {
            ball.dy *= -1;
        }

        normalizeBallSpeed(ball);

        /*
            Only one brick per ball per frame.
        */
        if (
            bricks.every(
                (brick) => !brick.active
            )
        ) {
            endGame(true);
        }

        return;
    }
}

/*
    --------------------------------------------------
    LIVES / GAME STATE
    --------------------------------------------------
*/

function loseLife() {
    lives--;

    livesDisplay.textContent = lives;

    if (lives <= 0) {
        endGame(false);
        return;
    }

    resetBallsToPaddle();
}

function endGame(won) {
    gameActive = false;
    waitingForLaunch = false;

    cancelAnimationFrame(animationFrame);

    paddle.dx = 0;
    balls = [];
    powerups = [];

    if (won) {
        drawWinScreen();
    } else {
        drawGameOverScreen();
    }
}

function drawWinScreen() {
    ctx.fillStyle = "#0B1026";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#F8FAFC";
    ctx.font = "bold 46px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "YOU WIN!",
        canvas.width / 2,
        canvas.height / 2
    );
}

function drawGameOverScreen() {
    ctx.fillStyle = "#0B1026";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#F8FAFC";
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "GAME OVER",
        canvas.width / 2,
        canvas.height / 2
    );
}

/*
    --------------------------------------------------
    GAME LOOP
    --------------------------------------------------
*/

function gameLoop() {
    if (!gameActive) {
        return;
    }

    drawBackground();
    drawBricks();
    drawPowerups();
    drawPaddle();
    drawBalls();

    updatePaddle();
    updateWaitingBall();
    updateBalls();
    updatePowerups();

    animationFrame =
        requestAnimationFrame(gameLoop);
}

/*
    --------------------------------------------------
    NEW GAME
    --------------------------------------------------
*/

function startGame() {
    cancelAnimationFrame(animationFrame);

    score = 0;
    lives = 3;

    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;

    paddle.width =
        NORMAL_PADDLE_WIDTH;

    paddle.x =
        canvas.width / 2 -
        paddle.width / 2;

    paddle.dx = 0;

    clearTimeout(paddlePowerupTimer);

    bricksDestroyedSincePowerup = 0;

    powerups = [];

    createBricks();

    gameActive = true;

    resetBallsToPaddle();

    gameLoop();
}

/*
    --------------------------------------------------
    KEYBOARD
    --------------------------------------------------
*/

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    /*
        A / Left = move only
    */
    if (
        event.key === "ArrowLeft" ||
        key === "a"
    ) {
        paddle.dx = -paddle.speed;
    }

    /*
        D / Right = move only
    */
    if (
        event.key === "ArrowRight" ||
        key === "d"
    ) {
        paddle.dx = paddle.speed;
    }

    /*
        Space = ONLY launch
    */
    if (
        event.code === "Space" &&
        !event.repeat
    ) {
        event.preventDefault();

        launchBall();
    }
});

document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();

    if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        key === "a" ||
        key === "d"
    ) {
        paddle.dx = 0;
    }
});

restartButton.addEventListener(
    "click",
    startGame
);

startGame();
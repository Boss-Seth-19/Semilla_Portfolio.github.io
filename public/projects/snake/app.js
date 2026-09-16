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

    status.textContent = "Press W, A, S, or D to start";

    drawGame();
}

function startGame() {
    gameActive = true;

    status.textContent = `Score: ${score}`;

    clearInterval(gameLoop);
    gameLoop = setInterval(updateGame, 100);
}

function updateGame() {
    direction = nextDirection;

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    if (checkCollision(head)) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        status.textContent = `Score: ${score}`;
        placeFood();
    } else {
        snake.pop();
    }

    drawGame();
}

function drawGame() {
    ctx.fillStyle = "#0B1026";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Food
    ctx.fillStyle = "#7C3AED";
    ctx.fillRect(
        food.x * gridSize,
        food.y * gridSize,
        gridSize,
        gridSize
    );

    // Snake
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? "#38BDF8" : "#4F46E5";

        ctx.fillRect(
            segment.x * gridSize,
            segment.y * gridSize,
            gridSize - 1,
            gridSize - 1
        );
    });
}

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
    return snake.some(segment =>
        segment.x === head.x &&
        segment.y === head.y
    );
}

function placeFood() {
    do {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (
        snake.some(segment =>
            segment.x === food.x &&
            segment.y === food.y
        )
    );
}

function endGame() {
    gameActive = false;
    clearInterval(gameLoop);

    status.textContent = `Game Over! Score: ${score}`;
}

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    // WASD controls
    if (key === "w") {
        if (direction.y !== 1) {
            nextDirection = { x: 0, y: -1 };
        }
    }

    if (key === "s") {
        if (direction.y !== -1) {
            nextDirection = { x: 0, y: 1 };
        }
    }

    if (key === "a") {
        if (direction.x !== 1) {
            nextDirection = { x: -1, y: 0 };
        }
    }

    if (key === "d") {
        if (direction.x !== -1) {
            nextDirection = { x: 1, y: 0 };
        }
    }

    // Start the game when the first valid key is pressed
    if (!gameActive && ["w", "a", "s", "d"].includes(key)) {
        startGame();
    }
});

restartButton.addEventListener("click", prepareGame);

prepareGame();
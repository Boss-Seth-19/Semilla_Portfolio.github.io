const connectFourButton = document.getElementById("connect-four-button");
const gameModal = document.getElementById("game-modal");
const closeGameModal = document.getElementById("close-game-modal");
const connectFourFrame = document.getElementById("connect-four-frame");
const ticTacToeButton = document.getElementById("tic-tac-toe-button");
const snakeButton = document.getElementById("snake-button");
const rockPaperScissorsButton = document.getElementById("rock-paper-scissors-button");
const hangmanButton = document.getElementById("hangman-button");
const brickBreakerButton = document.getElementById("brick-breaker-button");
const tetrisButton = document.getElementById("tetris-button");
const pongButton = document.getElementById("pong-button");
const minesweeperButton = document.getElementById("minesweeper-button");

connectFourButton.addEventListener("click", function () {
    connectFourFrame.src = "projects/connect-four/index.html";
    gameModal.style.display = "flex";
});

ticTacToeButton.addEventListener("click", function () {
    connectFourFrame.src = "projects/tic-tac-toe/index.html";
    gameModal.style.display = "flex";
});

snakeButton.addEventListener("click", function () {
    connectFourFrame.src = "projects/snake/index.html";
    gameModal.style.display = "flex";
});

rockPaperScissorsButton.addEventListener("click", function () {
    connectFourFrame.src = "projects/rock-paper-scissors/index.html";
    gameModal.style.display = "flex";
});

hangmanButton.addEventListener("click", function () {
    connectFourFrame.src = "projects/hangman/index.html";
    gameModal.style.display = "flex";
});

brickBreakerButton.addEventListener("click", function () {
    connectFourFrame.src = "projects/brick-breaker/index.html";
    gameModal.style.display = "flex";
});

tetrisButton.addEventListener("click", function () {
    connectFourFrame.src = "./projects/tetris/";
    gameModal.style.display = "flex";

});

pongButton.addEventListener("click", function () {
    connectFourFrame.src = "./projects/pong/";
    gameModal.style.display = "flex";
});

minesweeperButton.addEventListener("click", function () {
    connectFourFrame.src = "./projects/minesweeper/";
    gameModal.style.display = "flex";
});

closeGameModal.addEventListener("click", function () {
    gameModal.style.display = "none";
    connectFourFrame.src = "";
});
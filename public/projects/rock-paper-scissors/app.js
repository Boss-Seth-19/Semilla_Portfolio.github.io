const choiceButtons = document.querySelectorAll(".choice");

const status = document.getElementById("status");
const playerChoiceDisplay = document.getElementById("player-choice");
const computerChoiceDisplay = document.getElementById("computer-choice");
const scoreDisplay = document.getElementById("score");
const resetButton = document.getElementById("reset-button");

let playerScore = 0;
let computerScore = 0;

const choices = ["rock", "paper", "scissors"];

function getComputerChoice() {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
}

function determineWinner(playerChoice, computerChoice) {
    if (playerChoice === computerChoice) {
        return "draw";
    }

    if (
        (playerChoice === "rock" && computerChoice === "scissors") ||
        (playerChoice === "paper" && computerChoice === "rock") ||
        (playerChoice === "scissors" && computerChoice === "paper")
    ) {
        return "player";
    }

    return "computer";
}

function formatChoice(choice) {
    return choice.charAt(0).toUpperCase() + choice.slice(1);
}

function playRound(playerChoice) {
    const computerChoice = getComputerChoice();
    const winner = determineWinner(playerChoice, computerChoice);

    playerChoiceDisplay.textContent = formatChoice(playerChoice);
    computerChoiceDisplay.textContent = formatChoice(computerChoice);

    if (winner === "player") {
        playerScore++;
        status.textContent = "You win!";
    } else if (winner === "computer") {
        computerScore++;
        status.textContent = "Computer wins!";
    } else {
        status.textContent = "It's a draw!";
    }

    scoreDisplay.textContent = `${playerScore} - ${computerScore}`;
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;

    playerChoiceDisplay.textContent = "-";
    computerChoiceDisplay.textContent = "-";
    scoreDisplay.textContent = "0 - 0";
    status.textContent = "Choose your move";
}

choiceButtons.forEach((button) => {
    button.addEventListener("click", () => {
        playRound(button.dataset.choice);
    });
});

resetButton.addEventListener("click", resetGame);
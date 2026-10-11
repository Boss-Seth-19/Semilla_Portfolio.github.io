const choiceButtons = document.querySelectorAll(".choice");

const status = document.getElementById("status");
const playerChoiceDisplay = document.getElementById("player-choice");
const computerChoiceDisplay = document.getElementById("computer-choice");
const scoreDisplay = document.getElementById("score");
const resetButton = document.getElementById("reset-button");

let playerScore = 0;
let computerScore = 0;

const choices = ["rock", "paper", "scissors"];


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
    duration = 0.08,
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

function playChoiceSound() {
    playTone(
        540,
        0.06,
        "square",
        0.035
    );
}

function playWinSound() {
    playTone(
        523,
        0.09,
        "square",
        0.045
    );

    playTone(
        659,
        0.09,
        "square",
        0.045,
        0.10
    );

    playTone(
        784,
        0.16,
        "square",
        0.05,
        0.20
    );
}

function playLoseSound() {
    playTone(
        440,
        0.10,
        "square",
        0.04
    );

    playTone(
        330,
        0.10,
        "square",
        0.04,
        0.11
    );

    playTone(
        220,
        0.16,
        "square",
        0.05,
        0.22
    );
}

function playDrawSound() {
    playTone(
        400,
        0.09,
        "square",
        0.035
    );

    playTone(
        400,
        0.12,
        "square",
        0.035,
        0.11
    );
}

function playResetSound() {
    playTone(
        380,
        0.05,
        "square",
        0.03
    );
}


/* =========================================================
   GAME LOGIC
========================================================= */

function getComputerChoice() {
    const randomIndex =
        Math.floor(
            Math.random() * choices.length
        );

    return choices[randomIndex];
}

function determineWinner(
    playerChoice,
    computerChoice
) {
    if (
        playerChoice === computerChoice
    ) {
        return "draw";
    }

    if (
        (playerChoice === "rock" &&
            computerChoice === "scissors") ||

        (playerChoice === "paper" &&
            computerChoice === "rock") ||

        (playerChoice === "scissors" &&
            computerChoice === "paper")
    ) {
        return "player";
    }

    return "computer";
}

function formatChoice(choice) {
    return (
        choice.charAt(0).toUpperCase() +
        choice.slice(1)
    );
}

function playRound(playerChoice) {
    const computerChoice =
        getComputerChoice();

    const winner =
        determineWinner(
            playerChoice,
            computerChoice
        );

    playerChoiceDisplay.textContent =
        formatChoice(playerChoice);

    computerChoiceDisplay.textContent =
        formatChoice(computerChoice);

    playChoiceSound();

    if (winner === "player") {
        playerScore++;

        status.textContent =
            "You win!";

        playWinSound();

    } else if (winner === "computer") {
        computerScore++;

        status.textContent =
            "Computer wins!";

        playLoseSound();

    } else {
        status.textContent =
            "It's a draw!";

        playDrawSound();
    }

    scoreDisplay.textContent =
        `${playerScore} - ${computerScore}`;
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;

    playerChoiceDisplay.textContent =
        "-";

    computerChoiceDisplay.textContent =
        "-";

    scoreDisplay.textContent =
        "0 - 0";

    status.textContent =
        "Choose your move";

    playResetSound();
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

choiceButtons.forEach((button) => {
    button.addEventListener(
        "click",
        () => {
            playRound(
                button.dataset.choice
            );
        }
    );
});

resetButton.addEventListener(
    "click",
    resetGame
);
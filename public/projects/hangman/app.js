const status = document.getElementById("status");
const wordDisplay = document.getElementById("word");
const lettersContainer = document.getElementById("letters");
const wrongCount = document.getElementById("wrong-count");
const restartButton = document.getElementById("restart-button");

const figureParts = [
    document.querySelector(".head"),
    document.querySelector(".body"),
    document.querySelector(".left-arm"),
    document.querySelector(".right-arm"),
    document.querySelector(".left-leg"),
    document.querySelector(".right-leg")
];

const words = [
    "computer",
    "javascript",
    "website",
    "keyboard",
    "software",
    "hardware",
    "developer",
    "internet",
    "portfolio",
    "programming",
    "database",
    "monitor",
    "processor",
    "browser",
    "technology"
];

let selectedWord = "";
let guessedLetters = [];
let wrongGuesses = 0;
let gameActive = true;

function chooseRandomWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}

function startGame() {
    selectedWord = chooseRandomWord();
    guessedLetters = [];
    wrongGuesses = 0;
    gameActive = true;

    status.textContent = "Guess the word!";
    wrongCount.textContent = "0";

    figureParts.forEach((part) => {
        part.style.display = "none";
    });

    createLetterButtons();
    updateWordDisplay();
}

function createLetterButtons() {
    lettersContainer.innerHTML = "";

    for (let code = 65; code <= 90; code++) {
        const letter = String.fromCharCode(code);

        const button = document.createElement("button");

        button.textContent = letter;
        button.className = "letter-button";

        button.addEventListener("click", () => {
            guessLetter(letter.toLowerCase());
        });

        lettersContainer.appendChild(button);
    }
}

function updateWordDisplay() {
    wordDisplay.textContent = selectedWord
        .split("")
        .map((letter) =>
            guessedLetters.includes(letter)
                ? letter.toUpperCase()
                : "_"
        )
        .join(" ");

    checkWin();
}

function guessLetter(letter) {
    if (!gameActive || guessedLetters.includes(letter)) {
        return;
    }

    guessedLetters.push(letter);

    const buttons = document.querySelectorAll(".letter-button");

    buttons.forEach((button) => {
        if (button.textContent.toLowerCase() === letter) {
            button.disabled = true;
        }
    });

    if (!selectedWord.includes(letter)) {
        wrongGuesses++;
        wrongCount.textContent = wrongGuesses;

        if (wrongGuesses <= figureParts.length) {
            figureParts[wrongGuesses - 1].style.display = "block";
        }
    }

    updateWordDisplay();
}

function checkWin() {
    const wordGuessed = selectedWord
        .split("")
        .every((letter) => guessedLetters.includes(letter));

    if (wordGuessed) {
        status.textContent = `You won! The word was "${selectedWord}".`;
        gameActive = false;
        disableLetters();
        return;
    }

    if (wrongGuesses >= 6) {
        status.textContent = `Game over! The word was "${selectedWord}".`;

        wordDisplay.textContent = selectedWord
            .split("")
            .map((letter) => letter.toUpperCase())
            .join(" ");

        gameActive = false;
        disableLetters();
    }
}

function disableLetters() {
    const buttons = document.querySelectorAll(".letter-button");

    buttons.forEach((button) => {
        button.disabled = true;
    });
}

restartButton.addEventListener("click", startGame);

startGame();
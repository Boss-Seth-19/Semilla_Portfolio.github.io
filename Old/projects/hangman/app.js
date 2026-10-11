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

function playCorrectSound() {
    playTone(
        620,
        0.06,
        "square",
        0.035
    );

    playTone(
        820,
        0.08,
        "square",
        0.04,
        0.06
    );
}

function playWrongSound() {
    playTone(
        180,
        0.10,
        "sawtooth",
        0.045
    );

    playTone(
        120,
        0.12,
        "sawtooth",
        0.04,
        0.08
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
        0.09,
        "square",
        0.045,
        0.20
    );

    playTone(
        1046,
        0.18,
        "square",
        0.05,
        0.30
    );
}

function playGameOverSound() {
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
        0.10,
        "square",
        0.045,
        0.22
    );

    playTone(
        150,
        0.18,
        "square",
        0.05,
        0.33
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
   GAME SETUP
========================================================= */

function chooseRandomWord() {
    const randomIndex =
        Math.floor(
            Math.random() * words.length
        );

    return words[randomIndex];
}

function startGame() {
    selectedWord = chooseRandomWord();

    guessedLetters = [];
    wrongGuesses = 0;
    gameActive = true;

    status.textContent =
        "Guess the word!";

    wrongCount.textContent =
        "0";

    figureParts.forEach((part) => {
        part.style.display = "none";
    });

    createLetterButtons();
    updateWordDisplay();

    playResetSound();
}


/* =========================================================
   LETTER BUTTONS
========================================================= */

function createLetterButtons() {
    lettersContainer.innerHTML = "";

    for (
        let code = 65;
        code <= 90;
        code++
    ) {
        const letter =
            String.fromCharCode(code);

        const button =
            document.createElement("button");

        button.textContent =
            letter;

        button.className =
            "letter-button";

        button.addEventListener(
            "click",
            () => {
                guessLetter(
                    letter.toLowerCase()
                );
            }
        );

        lettersContainer.appendChild(
            button
        );
    }
}


/* =========================================================
   WORD DISPLAY
========================================================= */

function updateWordDisplay() {
    wordDisplay.textContent =
        selectedWord
            .split("")
            .map((letter) =>
                guessedLetters.includes(letter)
                    ? letter.toUpperCase()
                    : "_"
            )
            .join(" ");

    checkWin();
}


/* =========================================================
   GUESS LOGIC
========================================================= */

function guessLetter(letter) {
    if (
        !gameActive ||
        guessedLetters.includes(letter)
    ) {
        return;
    }

    guessedLetters.push(letter);

    const buttons =
        document.querySelectorAll(
            ".letter-button"
        );

    buttons.forEach((button) => {
        if (
            button.textContent.toLowerCase() ===
            letter
        ) {
            button.disabled = true;
        }
    });

    if (!selectedWord.includes(letter)) {
        wrongGuesses++;

        wrongCount.textContent =
            wrongGuesses;

        if (
            wrongGuesses <=
            figureParts.length
        ) {
            figureParts[
                wrongGuesses - 1
            ].style.display = "block";
        }

        playWrongSound();

    } else {
        playCorrectSound();
    }

    updateWordDisplay();
}


/* =========================================================
   WIN / LOSS
========================================================= */

function checkWin() {
    const wordGuessed =
        selectedWord
            .split("")
            .every((letter) =>
                guessedLetters.includes(letter)
            );

    if (wordGuessed) {
        status.textContent =
            `You won! The word was "${selectedWord}".`;

        gameActive = false;

        disableLetters();

        playWinSound();

        return;
    }

    if (wrongGuesses >= 6) {
        status.textContent =
            `Game over! The word was "${selectedWord}".`;

        wordDisplay.textContent =
            selectedWord
                .split("")
                .map(
                    (letter) =>
                        letter.toUpperCase()
                )
                .join(" ");

        gameActive = false;

        disableLetters();

        playGameOverSound();
    }
}


/* =========================================================
   DISABLE LETTERS
========================================================= */

function disableLetters() {
    const buttons =
        document.querySelectorAll(
            ".letter-button"
        );

    buttons.forEach((button) => {
        button.disabled = true;
    });
}


/* =========================================================
   RESTART
========================================================= */

restartButton.addEventListener(
    "click",
    startGame
);


/* =========================================================
   INITIAL START
========================================================= */

startGame();
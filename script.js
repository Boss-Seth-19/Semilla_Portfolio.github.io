/* =========================================================
   ARCADE INTRO / AUDIO SYSTEM
========================================================= */

const introScreen = document.getElementById("intro-screen");
const pressStart = document.getElementById("press-start");
const backgroundMusic = document.getElementById("background-music");
const audioToggle = document.getElementById("audio-toggle");

let audioMuted = false;
let audioContext = null;


/* ---------------------------------------------------------
   STARTUP SOUND
--------------------------------------------------------- */

function playStartSound() {

    if (audioMuted) {
        return;
    }

    try {

        if (!audioContext) {
            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "square";

        oscillator.frequency.setValueAtTime(
            220,
            audioContext.currentTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            880,
            audioContext.currentTime + 0.18
        );

        gainNode.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        gainNode.gain.exponentialRampToValueAtTime(
            0.18,
            audioContext.currentTime + 0.02
        );

        gainNode.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.25
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.25
        );

    } catch (error) {

        console.log(
            "Startup sound could not play:",
            error
        );

    }
}


/* ---------------------------------------------------------
   START PORTFOLIO
--------------------------------------------------------- */

function startPortfolio() {

    if (!introScreen) {
        return;
    }

    playStartSound();


    /* Start music only after user interaction */

    if (!audioMuted && backgroundMusic) {

        backgroundMusic.volume = 0.35;

        backgroundMusic.currentTime = 0;

        backgroundMusic.play().catch(function (error) {

            console.log(
                "Background music could not start:",
                error
            );

        });

    }


    /* Disable repeated clicking */

    if (pressStart) {
        pressStart.style.pointerEvents = "none";
    }


    /* Begin intro fade */

    introScreen.classList.add("intro-hide");


    /* Remove intro after animation */

    setTimeout(function () {

        introScreen.style.display = "none";

    }, 900);

}


/* ---------------------------------------------------------
   PRESS START
--------------------------------------------------------- */

if (pressStart) {

    pressStart.addEventListener(
        "click",
        startPortfolio
    );

}


/* ---------------------------------------------------------
   AUDIO TOGGLE
--------------------------------------------------------- */

if (audioToggle) {

    audioToggle.addEventListener(
        "click",
        function () {

            audioMuted = !audioMuted;


            if (backgroundMusic) {

                if (audioMuted) {

                    backgroundMusic.pause();

                    audioToggle.textContent = "🔇";

                } else {

                    backgroundMusic.play().catch(function () {

                        console.log(
                            "Music could not resume."
                        );

                    });

                    audioToggle.textContent = "🔊";

                }

            }

        }
    );

}


/* =========================================================
   GAME MODAL SYSTEM
========================================================= */

const connectFourButton =
    document.getElementById("connect-four-button");

const gameModal =
    document.getElementById("game-modal");

const closeGameModal =
    document.getElementById("close-game-modal");

const connectFourFrame =
    document.getElementById("connect-four-frame");

const ticTacToeButton =
    document.getElementById("tic-tac-toe-button");

const snakeButton =
    document.getElementById("snake-button");

const rockPaperScissorsButton =
    document.getElementById(
        "rock-paper-scissors-button"
    );

const hangmanButton =
    document.getElementById("hangman-button");

const brickBreakerButton =
    document.getElementById("brick-breaker-button");

const tetrisButton =
    document.getElementById("tetris-button");

const pongButton =
    document.getElementById("pong-button");

const minesweeperButton =
    document.getElementById("minesweeper-button");


/* ---------------------------------------------------------
   CONNECT FOUR
--------------------------------------------------------- */

connectFourButton.addEventListener(
    "click",
    function () {

        connectFourFrame.src =
            "projects/connect-four/index.html";

        gameModal.style.display = "flex";

    }
);


/* ---------------------------------------------------------
   TIC TAC TOE
--------------------------------------------------------- */

ticTacToeButton.addEventListener(
    "click",
    function () {

        connectFourFrame.src =
            "projects/tic-tac-toe/index.html";

        gameModal.style.display = "flex";

    }
);


/* ---------------------------------------------------------
   SNAKE
--------------------------------------------------------- */

snakeButton.addEventListener(
    "click",
    function () {

        connectFourFrame.src =
            "projects/snake/index.html";

        gameModal.style.display = "flex";

    }
);


/* ---------------------------------------------------------
   ROCK PAPER SCISSORS
--------------------------------------------------------- */

rockPaperScissorsButton.addEventListener(
    "click",
    function () {

        connectFourFrame.src =
            "projects/rock-paper-scissors/index.html";

        gameModal.style.display = "flex";

    }
);


/* ---------------------------------------------------------
   HANGMAN
--------------------------------------------------------- */

hangmanButton.addEventListener(
    "click",
    function () {

        connectFourFrame.src =
            "projects/hangman/index.html";

        gameModal.style.display = "flex";

    }
);


/* ---------------------------------------------------------
   BRICK BREAKER
--------------------------------------------------------- */

brickBreakerButton.addEventListener(
    "click",
    function () {

        connectFourFrame.src =
            "projects/brick-breaker/index.html";

        gameModal.style.display = "flex";

    }
);


/* ---------------------------------------------------------
   TETRIS
--------------------------------------------------------- */

tetrisButton.addEventListener(
    "click",
    function () {

        connectFourFrame.src =
            "./projects/tetris/";

        gameModal.style.display = "flex";

    }
);


/* ---------------------------------------------------------
   PONG
--------------------------------------------------------- */

pongButton.addEventListener(
    "click",
    function () {

        connectFourFrame.src =
            "./projects/pong/";

        gameModal.style.display = "flex";

    }
);


/* ---------------------------------------------------------
   MINESWEEPER
--------------------------------------------------------- */

minesweeperButton.addEventListener(
    "click",
    function () {

        connectFourFrame.src =
            "./projects/minesweeper/";

        gameModal.style.display = "flex";

    }
);


/* ---------------------------------------------------------
   CLOSE GAME MODAL
--------------------------------------------------------- */

closeGameModal.addEventListener(
    "click",
    function () {

        gameModal.style.display = "none";

        connectFourFrame.src = "";

    }
);
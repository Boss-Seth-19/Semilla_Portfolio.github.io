/* =========================================================
   ARCADE INTRO / AUDIO SYSTEM
========================================================= */

const introScreen = document.getElementById("intro-screen");
const pressStart = document.getElementById("press-start");
const backgroundMusic = document.getElementById("background-music");
const audioToggle = document.getElementById("audio-toggle");

let audioMuted = false;
let audioContext = null;
let portfolioStarted = false;


/* =========================================================
   STARTUP SOUND
========================================================= */

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


/* =========================================================
   PIXEL REVEAL
========================================================= */

function createPixelReveal() {

    const pixelLayer = document.createElement("div");

    pixelLayer.className = "pixel-reveal-layer";

    document.body.appendChild(pixelLayer);


    /*
        Chunky pixel size.

        Smaller screens use smaller pixels so the
        transition still covers the screen properly.
    */

    let pixelSize = 32;

    if (window.innerWidth <= 900) {
        pixelSize = 28;
    }

    if (window.innerWidth <= 700) {
        pixelSize = 24;
    }

    if (window.innerWidth <= 450) {
        pixelSize = 20;
    }


    const columns = Math.ceil(
        window.innerWidth / pixelSize
    );

    const rows = Math.ceil(
        window.innerHeight / pixelSize
    );

    const pixels = [];


    /* =====================================================
       CREATE FULL PIXEL GRID
    ===================================================== */

    for (let row = 0; row < rows; row++) {

        for (let column = 0; column < columns; column++) {

            const pixel = document.createElement("div");

            pixel.className = "pixel-reveal";

            pixel.style.width =
                pixelSize + "px";

            pixel.style.height =
                pixelSize + "px";

            pixel.style.left =
                (column * pixelSize) + "px";

            pixel.style.top =
                (row * pixelSize) + "px";

            pixels.push(pixel);

        }

    }


    /* =====================================================
       SHUFFLE PIXELS
    ===================================================== */

    for (
        let i = pixels.length - 1;
        i > 0;
        i--
    ) {

        const randomIndex =
            Math.floor(
                Math.random() * (i + 1)
            );

        const temporary =
            pixels[i];

        pixels[i] =
            pixels[randomIndex];

        pixels[randomIndex] =
            temporary;

    }


    /* =====================================================
       CONFIGURE EACH PIXEL
    ===================================================== */

    pixels.forEach(function (pixel, index) {

        /*
            Earlier pixels disappear sooner.

            Later pixels stay on screen longer,
            creating a chaotic breakup instead of
            everything disappearing simultaneously.
        */

        const progress =
            index / pixels.length;

        const randomDelay =
            (progress * 1.05) +
            (Math.random() * 0.35);


        /*
            Give every pixel slightly different
            movement when it breaks apart.
        */

        const randomX =
            (Math.random() - 0.5) * 80;

        const randomY =
            (Math.random() - 0.5) * 80;

        const randomRotation =
            (Math.random() - 0.5) * 30;

        const randomScale =
            0.05 +
            (Math.random() * 0.15);


        pixel.style.setProperty(
            "--pixel-x",
            randomX + "px"
        );

        pixel.style.setProperty(
            "--pixel-y",
            randomY + "px"
        );

        pixel.style.setProperty(
            "--pixel-rotation",
            randomRotation + "deg"
        );

        pixel.style.setProperty(
            "--pixel-scale",
            randomScale
        );


        pixel.style.animationDelay =
            randomDelay + "s";


        pixel.style.animationDuration =
            (0.22 + Math.random() * 0.18) + "s";


        pixelLayer.appendChild(pixel);

    });


    return pixelLayer;

}


/* =========================================================
   START PORTFOLIO
========================================================= */

function startPortfolio() {

    if (portfolioStarted) {
        return;
    }

    portfolioStarted = true;


    /* Start arcade startup sound */

    playStartSound();


    /* Start background music */

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


    /* Prevent repeated Press Start clicks */

    if (pressStart) {
        pressStart.style.pointerEvents = "none";
    }


    /*
        IMPORTANT:

        The pixel grid is created while the intro
        is still completely visible.

        This prevents the website underneath from
        being exposed before the transition starts.
    */

    const pixelLayer =
        createPixelReveal();


    /*
        Wait for the browser to paint the complete
        pixel layer before hiding the original intro.
    */

    requestAnimationFrame(function () {

        requestAnimationFrame(function () {

            if (introScreen) {

                introScreen.style.visibility =
                    "hidden";

                introScreen.style.pointerEvents =
                    "none";

            }

        });

    });


    /*
        The final pixels finish disappearing around
        1.8 seconds.

        Wait slightly longer before removing the
        pixel layer completely.
    */

    setTimeout(function () {

        if (pixelLayer) {
            pixelLayer.remove();
        }

        if (introScreen) {

            introScreen.style.display =
                "none";

        }

        document.body.classList.remove(
            "intro-active"
        );

    }, 1900);

}


/* =========================================================
   PRESS START
========================================================= */

if (pressStart) {

    pressStart.addEventListener(
        "click",
        startPortfolio
    );

}


/* =========================================================
   AUDIO TOGGLE
========================================================= */

if (audioToggle) {

    audioToggle.addEventListener(
        "click",
        function () {

            audioMuted = !audioMuted;

            if (!backgroundMusic) {
                return;
            }


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


/* =========================================================
   OPEN GAME
========================================================= */

function openGame(gamePath) {

    if (!connectFourFrame || !gameModal) {
        return;
    }

    connectFourFrame.src = gamePath;

    gameModal.style.display = "flex";

}


/* =========================================================
   CONNECT FOUR
========================================================= */

if (connectFourButton) {

    connectFourButton.addEventListener(
        "click",
        function () {

            openGame(
                "projects/connect-four/index.html"
            );

        }
    );

}


/* =========================================================
   TIC TAC TOE
========================================================= */

if (ticTacToeButton) {

    ticTacToeButton.addEventListener(
        "click",
        function () {

            openGame(
                "projects/tic-tac-toe/index.html"
            );

        }
    );

}


/* =========================================================
   SNAKE
========================================================= */

if (snakeButton) {

    snakeButton.addEventListener(
        "click",
        function () {

            openGame(
                "projects/snake/index.html"
            );

        }
    );

}


/* =========================================================
   ROCK PAPER SCISSORS
========================================================= */

if (rockPaperScissorsButton) {

    rockPaperScissorsButton.addEventListener(
        "click",
        function () {

            openGame(
                "projects/rock-paper-scissors/index.html"
            );

        }
    );

}


/* =========================================================
   HANGMAN
========================================================= */

if (hangmanButton) {

    hangmanButton.addEventListener(
        "click",
        function () {

            openGame(
                "projects/hangman/index.html"
            );

        }
    );

}


/* =========================================================
   BRICK BREAKER
========================================================= */

if (brickBreakerButton) {

    brickBreakerButton.addEventListener(
        "click",
        function () {

            openGame(
                "projects/brick-breaker/index.html"
            );

        }
    );

}


/* =========================================================
   TETRIS
========================================================= */

if (tetrisButton) {

    tetrisButton.addEventListener(
        "click",
        function () {

            openGame(
                "./projects/tetris/"
            );

        }
    );

}


/* =========================================================
   PONG
========================================================= */

if (pongButton) {

    pongButton.addEventListener(
        "click",
        function () {

            openGame(
                "./projects/pong/"
            );

        }
    );

}


/* =========================================================
   MINESWEEPER
========================================================= */

if (minesweeperButton) {

    minesweeperButton.addEventListener(
        "click",
        function () {

            openGame(
                "./projects/minesweeper/"
            );

        }
    );

}


/* =========================================================
   CLOSE GAME MODAL
========================================================= */

if (closeGameModal) {

    closeGameModal.addEventListener(
        "click",
        function () {

            if (gameModal) {
                gameModal.style.display = "none";
            }

            if (connectFourFrame) {
                connectFourFrame.src = "";
            }

        }
    );

}
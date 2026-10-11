document.addEventListener("DOMContentLoaded", () => {
    const cells = document.querySelectorAll(".cell");
    const status = document.getElementById("status");
    const resetButton = document.getElementById("reset");

    let currentPlayer = "X";
    let gameActive = true;

    // 9 cells: indexes 0 through 8
    let board = ["", "", "", "", "", "", "", "", ""];

    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];


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

    function playMoveSound() {
        playTone(
            620,
            0.06,
            "square",
            0.035
        );
    }

    function playWinSound() {
        playTone(
            523,
            0.10,
            "square",
            0.045
        );

        playTone(
            659,
            0.10,
            "square",
            0.045,
            0.11
        );

        playTone(
            784,
            0.16,
            "square",
            0.05,
            0.22
        );
    }

    function playDrawSound() {
        playTone(
            420,
            0.10,
            "square",
            0.035
        );

        playTone(
            330,
            0.14,
            "square",
            0.04,
            0.12
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

    function handleCellClick(index) {
        if (!gameActive || board[index] !== "") {
            return;
        }

        board[index] = currentPlayer;
        cells[index].textContent = currentPlayer;

        // Give X and O their theme colors
        cells[index].classList.add(
            currentPlayer === "X" ? "x" : "o"
        );

        playMoveSound();

        checkGameResult();
    }

    function checkGameResult() {
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;

            if (
                board[a] !== "" &&
                board[a] === board[b] &&
                board[a] === board[c]
            ) {
                status.textContent =
                    `Player ${currentPlayer} wins!`;

                gameActive = false;

                playWinSound();

                return;
            }
        }

        if (!board.includes("")) {
            status.textContent =
                "It's a draw!";

            gameActive = false;

            playDrawSound();

            return;
        }

        currentPlayer =
            currentPlayer === "X"
                ? "O"
                : "X";

        status.textContent =
            `Player ${currentPlayer}'s turn`;
    }

    function resetGame() {
        board = [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ];

        currentPlayer = "X";
        gameActive = true;

        cells.forEach((cell) => {
            cell.textContent = "";

            cell.classList.remove(
                "x",
                "o"
            );
        });

        status.textContent =
            "Player X's turn";

        playResetSound();
    }


    /* =========================================================
       EVENT LISTENERS
    ========================================================= */

    cells.forEach((cell, index) => {
        cell.addEventListener(
            "click",
            () => {
                handleCellClick(index);
            }
        );
    });

    resetButton.addEventListener(
        "click",
        resetGame
    );
});
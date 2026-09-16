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
                status.textContent = `Player ${currentPlayer} wins!`;
                gameActive = false;
                return;
            }
        }

        if (!board.includes("")) {
            status.textContent = "It's a draw!";
            gameActive = false;
            return;
        }

        currentPlayer = currentPlayer === "X" ? "O" : "X";
        status.textContent = `Player ${currentPlayer}'s turn`;
    }

    function resetGame() {
        board = ["", "", "", "", "", "", "", "", ""];

        currentPlayer = "X";
        gameActive = true;

        cells.forEach((cell) => {
            cell.textContent = "";
            cell.classList.remove("x", "o");
        });

        status.textContent = "Player X's turn";
    }

    cells.forEach((cell, index) => {
        cell.addEventListener("click", () => {
            handleCellClick(index);
        });
    });

    resetButton.addEventListener("click", resetGame);
});
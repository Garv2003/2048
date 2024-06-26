import Grid from "./Grid.js";
import Tile from "./Tile.js";

const gameBoard = document.getElementById("game-board");
const gamemessage = document.querySelector(".game-message");
const gameover = document.querySelector("#game-over");
const newgame = document.querySelector(".btn");

newgame.addEventListener("click", () => {
  restartGame();
});

let grid;

function startGame() {
  const savedGrid = localStorage.getItem("grid");
  grid = new Grid(gameBoard);
  if (savedGrid != null) {
    const values = JSON.parse(savedGrid);
    grid.cells.forEach((cell, index) => {
      if (values[index] === 0) return;
      const tile = new Tile(gameBoard);
      tile.value = values[index];
      cell.tile = tile;
    });
    if (localStorage.getItem("GameOver") == "true") {
      gamemessage.classList.add("game-over");
    }
  } else {
    const newTile = new Tile(gameBoard);
    grid.randomEmptyCell().tile = newTile;
  }
  setupInput();
}

function restartGame() {
  gameBoard.innerHTML = "";
  localStorage.removeItem("grid");
  gamemessage.classList.remove("game-over");
  startGame();
}

startGame();

function setupInput() {
  window.addEventListener("keydown", handleInput, { once: true });
  gameBoard.addEventListener("touchstart", handleTouchStart, { once: true });
}

let xDown = null;
let yDown = null;

function handleTouchStart(e) {
  e.preventDefault();
  xDown = e.touches[0].clientX;
  yDown = e.touches[0].clientY;
  gameBoard.addEventListener("touchmove", handleTouchMove, { once: true });
}

function handleTouchMove(e) {
  const xUp = e.touches[0].clientX;
  const yUp = e.touches[0].clientY;

  const xDiff = xDown - xUp;
  const yDiff = yDown - yUp;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    if (xDiff > 0) {
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      moveLeft();
    } else {
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      moveRight();
    }
  } else {
    if (yDiff > 0) {
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      moveUp();
    } else {
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      moveDown();
    }
  }
  handleAfterMove();
}

async function handleInput(e) {
  switch (e.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      await moveUp();
      break;
    case "ArrowDown":
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      await moveDown();
      break;
    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      await moveLeft();
      break;
    case "ArrowRight":
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      await moveRight();
      break;
    default:
      setupInput();
      return;
  }
  handleAfterMove();
}

function handleAfterMove() {
  grid.cells.forEach((cell) => cell.mergeTiles());

  const newTile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = newTile;

  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    newTile.waitForTransition(true).then(() => {
      gamemessage.classList.add("game-over");
    });
    localStorage.setItem(
      "grid",
      JSON.stringify(grid.cells.map((cell) => cell.tile?.value ?? 0))
    );
    localStorage.setItem("GameOver", "true");
    return;
  }

  setupInput();
}

function moveUp() {
  return slideTiles(grid.cellsByColumn);
}

function moveDown() {
  return slideTiles(grid.cellsByColumn.map((column) => [...column].reverse()));
}

function moveLeft() {
  return slideTiles(grid.cellsByRow);
}

function moveRight() {
  return slideTiles(grid.cellsByRow.map((row) => [...row].reverse()));
}

function slideTiles(cells) {
  return Promise.all(
    cells.flatMap((group) => {
      const promises = [];
      for (let i = 1; i < group.length; i++) {
        const cell = group[i];
        if (cell.tile == null) continue;
        let lastValidCell;
        for (let j = i - 1; j >= 0; j--) {
          const moveToCell = group[j];
          if (!moveToCell.canAccept(cell.tile)) break;
          lastValidCell = moveToCell;
        }

        if (lastValidCell != null) {
          promises.push(cell.tile.waitForTransition());
          if (lastValidCell.tile != null) {
            lastValidCell.mergeTile = cell.tile;
          } else {
            lastValidCell.tile = cell.tile;
          }
          cell.tile = null;
        }
      }
      localStorage.setItem(
        "grid",
        JSON.stringify(grid.cells.map((cell) => cell.tile?.value ?? 0))
      );
      return promises;
    })
  );
}

function canMoveUp() {
  return canMove(grid.cellsByColumn);
}

function canMoveDown() {
  return canMove(grid.cellsByColumn.map((column) => [...column].reverse()));
}

function canMoveLeft() {
  return canMove(grid.cellsByRow);
}

function canMoveRight() {
  return canMove(grid.cellsByRow.map((row) => [...row].reverse()));
}

function canMove(cells) {
  return cells.some((group) => {
    return group.some((cell, index) => {
      if (index === 0) return false;
      if (cell.tile == null) return false;
      const moveToCell = group[index - 1];
      return moveToCell.canAccept(cell.tile);
    });
  });
}

gameover.addEventListener("click", () => {
  restartGame();
});

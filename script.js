// === DOM REFERENCES ===
const board = document.getElementById("game-board");
const overlay = document.getElementById("overlay");
const restartBtn = document.getElementById("restart-btn");
const gameOverMessage = document.getElementById("game-over-message");
const scoreDisplay = document.getElementById("score-display");
const liveScoreDisplay = document.getElementById("live-score");

// === GAME STATE ===
let snake, currentDirection, queuedDirection, directionUpdatedThisTick;
let obstacles, food, superBonus;
let gameSpeed = 200;
let lastMoveTime = 0;
let bonusTimeout;
let isGameOver = false;

// === INIT ===
function initGame() {
  snake = [[10, 10]];
  currentDirection = "right";
  queuedDirection = "right";
  directionUpdatedThisTick = false;
  obstacles = generateObstacles(10);
  food = getRandomFoodPosition();
  superBonus = null;
  isGameOver = false;
  overlay.classList.add("hidden");
  draw();
  updateScoreDisplay();
  requestAnimationFrame(gameLoopFrame);
}

// === GRID SETUP ===
function setupGrid() {
  board.innerHTML = "";
  for (let i = 0; i < 400; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    board.appendChild(cell);
  }
}

function getIndex(row, col) {
  return row * 20 + col;
}

function isSnakeOnCell([r, c]) {
  return snake.some(([sr, sc]) => sr === r && sc === c);
}

function isObstacle([r, c]) {
  return obstacles.some(([or, oc]) => or === r && oc === c);
}

function getRandomFoodPosition() {
  let newPos;
  do {
    const row = Math.floor(Math.random() * 20);
    const col = Math.floor(Math.random() * 20);
    newPos = [row, col];
  } while (
    isSnakeOnCell(newPos) ||
    isObstacle(newPos) ||
    (superBonus && newPos[0] === superBonus[0] && newPos[1] === superBonus[1])
  );
  return newPos;
}

function generateObstacles(count) {
  const list = [];
  while (list.length < count) {
    const row = Math.floor(Math.random() * 20);
    const col = Math.floor(Math.random() * 20);
    const pos = [row, col];
    if (!isSnakeOnCell(pos) && !list.some(([r, c]) => r === row && c === col)) {
      list.push(pos);
    }
  }
  return list;
}

// === DRAW ===
function draw() {
  const allCells = document.querySelectorAll(".cell");
  allCells.forEach(cell => cell.className = "cell");

  snake.forEach(([r, c], i) => {
    const index = getIndex(r, c);
    if (i === 0) {
      allCells[index].classList.add("snake-head");
    } else {
      allCells[index].classList.add("snake");
    }
  });

  if (food) {
    const foodIndex = getIndex(food[0], food[1]);
    allCells[foodIndex].classList.add("food");
  }

  if (superBonus) {
    const index = getIndex(superBonus[0], superBonus[1]);
    allCells[index].classList.add("super-bonus");
  }

  obstacles.forEach(([r, c]) => {
    const index = getIndex(r, c);
    allCells[index].classList.add("obstacle");
  });
}

// === MOVE ===
function moveSnake() {
  currentDirection = queuedDirection;
  directionUpdatedThisTick = false;

  const head = snake[0];
  let newHead;
  switch (currentDirection) {
    case "right": newHead = [head[0], head[1] + 1]; break;
    case "left": newHead = [head[0], head[1] - 1]; break;
    case "up": newHead = [head[0] - 1, head[1]]; break;
    case "down": newHead = [head[0] + 1, head[1]]; break;
  }

  if (
    newHead[0] < 0 || newHead[0] >= 20 ||
    newHead[1] < 0 || newHead[1] >= 20 ||
    isObstacle(newHead) ||
    isSnakeOnCell(newHead)
  ) {
    endGame();
    return;
  }

  if (superBonus && newHead[0] === superBonus[0] && newHead[1] === superBonus[1]) {
    snake = Array(snake.length * 2).fill().map((_, i) => snake[i] || snake[snake.length - 1]);
    superBonus = null;
    clearTimeout(bonusTimeout);
  }

  if (newHead[0] === food[0] && newHead[1] === food[1]) {
    snake.unshift(newHead);
    food = getRandomFoodPosition();
    if ((snake.length - 1) % 10 === 0) spawnBonus();
  } else {
    snake.unshift(newHead);
    snake.pop();
  }

  draw();
  updateScoreDisplay();
}

function spawnBonus() {
  let row, col;
  do {
    row = Math.floor(Math.random() * 20);
    col = Math.floor(Math.random() * 20);
  } while (
    isObstacle([row, col]) ||
    isSnakeOnCell([row, col]) ||
    (food && row === food[0] && col === food[1])
  );

  superBonus = [row, col];
  bonusTimeout = setTimeout(() => {
    superBonus = null;
    draw();
  }, 7000); // 7 seconds
}

function updateScoreDisplay() {
  liveScoreDisplay.textContent = snake.length - 1;
}

function endGame() {
  isGameOver = true;
  gameOverMessage.textContent = "💀 Game Over!";
  scoreDisplay.textContent = `Your score: ${snake.length - 1}`;
  overlay.classList.remove("hidden");
}

// === INPUT ===
function requestDirection(newDir, oppositeDir) {
  if (isGameOver) return;
  if (!directionUpdatedThisTick && currentDirection !== oppositeDir) {
    queuedDirection = newDir;
    directionUpdatedThisTick = true;
  }
}

window.addEventListener("keydown", e => {
  switch (e.code) {
    case "ArrowUp":
    case "KeyW": requestDirection("up", "down"); break;
    case "ArrowDown":
    case "KeyS": requestDirection("down", "up"); break;
    case "ArrowLeft":
    case "KeyA": requestDirection("left", "right"); break;
    case "ArrowRight":
    case "KeyD": requestDirection("right", "left"); break;
  }
});

["up", "down", "left", "right"].forEach(dir => {
  const btn = document.getElementById(`${dir}-btn`);
  if (btn) {
    btn.addEventListener("touchstart", e => {
      e.preventDefault();
      const opposites = { up: "down", down: "up", left: "right", right: "left" };
      requestDirection(dir, opposites[dir]);
    }, { passive: false });
  }
});

// === GAME LOOP ===
function gameLoopFrame(timestamp) {
  if (isGameOver) return;
  if (!lastMoveTime || timestamp - lastMoveTime > gameSpeed) {
    moveSnake();
    lastMoveTime = timestamp;
  }
  requestAnimationFrame(gameLoopFrame);
}

// === RESTART ===
restartBtn.addEventListener("click", initGame);

// === START ===
setupGrid();
initGame();
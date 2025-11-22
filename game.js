const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Canvas fullscreen setzen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Spieler-Objekt
const player = {
  width: canvas.width * 0.05,
  height: canvas.width * 0.05,
  x: canvas.width / 2 - (canvas.width * 0.05) / 2,
  y: canvas.height - canvas.height * 0.1,
  speed: 10,
  dx: 0,
};

// Gegner-Array
const enemies = [];
let enemyCount = 1;
const maxEnemies = 7;

// Herzbild
const heartImg = new Image();
heartImg.src = "bilder/leben.png";

// Gegner-Bild
const enemyImg = new Image();
enemyImg.src = "bilder/howl.png";

// Score und Leben
let score = 0;
let highscore = localStorage.getItem("highscore") || 0;
let lives = 3;

// Spielstatus
let isStarted = false;
let isPaused = false;
let isGameOver = false;

// Gegner erzeugen
function createEnemy(baseSpeed) {
  return {
    width: canvas.width * 0.06,
    height: canvas.width * 0.06,
    x: Math.random() * (canvas.width - canvas.width * 0.06),
    y: -Math.random() * 400 - 50,
    speed: baseSpeed,
  };
}

for (let i = 0; i < enemyCount; i++) {
  enemies.push(createEnemy(4));
}

// Spieler zeichnen
function drawPlayer() {
  ctx.fillStyle = "black";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Gegner zeichnen
function drawEnemies() {
  for (const enemy of enemies) {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  }
}

// Herzen zeichnen
function drawHearts(startX, startY) {
  const size = canvas.width * 0.03;
  for (let i = 0; i < lives; i++) {
    ctx.drawImage(heartImg, startX + i * (size + 5), startY, size, size);
  }
}

// Score zeichnen
function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.textAlign = "left";
  const text = "Score: " + score + "  |  Highscore: " + highscore + "  | ";
  ctx.fillText(text, 10, 30);
  const widthText = ctx.measureText(text).width;
  drawHearts(10 + widthText, 5);
}

// Startscreen
function drawStartScreen() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Drück ENTER zum Starten", canvas.width / 2, canvas.height / 2);
}

// Pausescreen
function drawPauseScreen() {
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.font = "38px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
}

// Game-Over-Screen
function drawGameOverScreen() {
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "28px Arial";
  ctx.fillText("Score: " + score + "  |  Highscore: " + highscore, canvas.width / 2, canvas.height / 2 + 20);
  ctx.font = "20px Arial";
  ctx.fillText("Drück ENTER zum Neustart", canvas.width / 2, canvas.height / 2 + 60);
}

// Canvas clear
function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Gegner resetten
function resetEnemy(enemy) {
  enemy.x = Math.random() * (canvas.width - enemy.width);
  enemy.y = -Math.random() * 300 - enemy.height;
}

// Game Over
function gameOver() {
  if (score > highscore) {
    highscore = score;
    localStorage.setItem("highscore", highscore);
  }
  isGameOver = true;
  player.dx = 0;
}

// Update
function update() {
  clear();

  if (!isStarted) {
    drawStartScreen();
    requestAnimationFrame(update);
    return;
  }

  if (isPaused) {
    drawPlayer();
    drawEnemies();
    drawScore();
    drawPauseScreen();
    requestAnimationFrame(update);
    return;
  }

  if (isGameOver) {
    drawPlayer();
    drawEnemies();
    drawScore();
    drawGameOverScreen();
    requestAnimationFrame(update);
    return;
  }

  player.x += player.dx;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  for (const enemy of enemies) {
    enemy.y += enemy.speed;

    if (enemy.y > canvas.height) {
      score++;
      enemy.speed += 0.3;
      resetEnemy(enemy);

      if (score % 5 === 0 && enemies.length < maxEnemies) {
        enemies.push(createEnemy(4 + enemies.length * 0.5));
      }
    }

    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      lives--;
      resetEnemy(enemy);

      if (lives <= 0) {
        gameOver();
        break;
      }
    }
  }

  drawPlayer();
  drawEnemies();
  drawScore();

  requestAnimationFrame(update);
}

// Keyboard
function keyDown(e) {
  if (e.key === "Enter") {
    if (!isStarted && !isGameOver) {
      isStarted = true;
      return;
    }
    if (isGameOver) {
      location.reload();
      return;
    }
  }

  if (e.key === "p" || e.key === "P") {
    if (isStarted) {
      isPaused = !isPaused;
      player.dx = 0;
      return;
    }
  }

  if (!isStarted || isPaused || isGameOver) return;

  if (e.key === "ArrowRight" || e.key === "d") player.dx = player.speed;
  if (e.key === "ArrowLeft" || e.key === "a") player.dx = -player.speed;
}

function keyUp(e) {
  if (
    e.key === "ArrowRight" ||
    e.key === "ArrowLeft" ||
    e.key === "d" ||
    e.key === "a"
  ) {
    player.dx = 0;
  }
}

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

update();

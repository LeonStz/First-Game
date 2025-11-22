const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Gegner-Array (mehrere Gegner)
const enemies = [];
let enemyCount = 1;      // Start: nur 1 Gegner
const maxEnemies = 7;    // maximal erlaubte Gegner

function resizeGame() {
  // Canvas an Fenster anpassen
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Spieler neu skalieren und positionieren
  player.width = canvas.width * 0.05;
  player.height = canvas.width * 0.05;
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - player.height - 20;

  // Gegner neu skalieren und neu verteilen
  for (const enemy of enemies) {
    enemy.width = canvas.width * 0.06;
    enemy.height = canvas.width * 0.06;
    enemy.x = Math.random() * (canvas.width - enemy.width);
    enemy.y = -Math.random() * 400 - enemy.height;
  }
}

// beim Start und bei Resize aufrufen
window.addEventListener("resize", resizeGame);


// Spieler-Objekt
const player = {
  width: 50,
  height: 50,
  x: 0,
  y: 0,
  speed: 6,
  dx: 0,
};

// Anfangsgegner erzeugen
for (let i = 0; i < enemyCount; i++) {
  enemies.push(createEnemy(canvas.height * 0.004));
}

resizeGame();

// Herzbild für Leben
const heartImg = new Image();
heartImg.src = "bilder/leben.png";

// Gegnerbild
const enemyImg = new Image();
enemyImg.src = "bilder/howl.png";


// Score + Highscore + Leben
let score = 0;
let highscore = localStorage.getItem("highscore") || 0;
let lives = 3;

// Spielzustand
let isStarted = false;
let isPaused = false;
let isGameOver = false;

// Hilfsfunktion, um einen neuen Gegner zu erstellen
function createEnemy(baseSpeed) {
  return {
    width: canvas.width * 0.06,
    height: canvas.width * 0.06,
    x: Math.random() * (canvas.width - canvas.width * 0.06),
    y: -Math.random() * 400 - 50, // etwas zufällig versetzt spawnen
    speed: baseSpeed,
  };
}

// Spieler zeichnen
function drawPlayer() {
  ctx.fillStyle = "black";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// alle Gegner zeichnen
function drawEnemies() {
  for (const enemy of enemies) {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  }
}


// Score + Highscore + Leben zeichnen
function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.textAlign = "left";

  // Text zeichnen
  const text = "Score: " + score + "  |  Highscore: " + highscore + "  | ";
  ctx.fillText(text, 10, 30);

  // Position ermitteln, an der der Text endet
  const textWidth = ctx.measureText(text).width;

  // Herzen direkt dahinter zeichnen
  drawHearts(10 + textWidth, 10);
}



function drawHearts(startX, startY) {
  const size = canvas.width * 0.03; // ca. 3% der Breite
  for (let i = 0; i < lives; i++) {
    ctx.drawImage(heartImg, startX + i * (size + 5), startY, size, size);
  }
}




// Startscreen zeichnen
function drawStartScreen() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Drück ENTER zum Starten", canvas.width / 2, canvas.height / 2);
  ctx.font = "18px Arial";
  ctx.fillText("Steuerung: A/D oder Pfeiltasten, P = Pause", canvas.width / 2, canvas.height / 2 + 40);
  ctx.textAlign = "left";
}

// Game-Over-Screen zeichnen
// Pausescreen zeichnen
function drawPauseScreen() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
  ctx.font = "18px Arial";
  ctx.fillText("Drück P zum Fortsetzen", canvas.width / 2, canvas.height / 2 + 40);
  ctx.textAlign = "left";
}

function drawGameOverScreen() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = "20px Arial";
  ctx.fillText(
    "Score: " + score + "  |  Highscore: " + highscore,
    canvas.width / 2,
    canvas.height / 2 + 15
  );

  ctx.font = "18px Arial";
  ctx.fillText(
    "Drück ENTER für Neustart",
    canvas.width / 2,
    canvas.height / 2 + 50
  );

  ctx.textAlign = "left";
}


// Canvas leeren
function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function resetGame() {
  score = 0;
  lives = 3;
  isGameOver = false;
  isPaused = false;
  isStarted = true; // direkt wieder ins Spiel, ohne Startscreen

  // Spieler zurück in die Mitte
  player.x = canvas.width / 2 - player.width / 2;
  player.dx = 0;

  // Gegner zurücksetzen
  enemies.length = 0;
  enemyCount = 1;
  for (let i = 0; i < enemyCount; i++) {
    enemies.push(createEnemy(2));
  }
}

// einzelnen Gegner zurück nach oben setzen
function resetEnemy(enemy) {
  enemy.x = Math.random() * (canvas.width - enemy.width);
  enemy.y = -Math.random() * 300 - enemy.height;
}

// Game Over behandeln
function gameOver() {
  // Highscore aktualisieren
  if (score > highscore) {
    highscore = score;
    localStorage.setItem("highscore", highscore);
  }

  isGameOver = true;
  isPaused = false;
  player.dx = 0; // Bewegung stoppen
}

// Spiellogik aktualisieren
function update() {
  clear();

  // Startscreen anzeigen, solange nicht gestartet
  if (!isStarted) {
    drawStartScreen();
    requestAnimationFrame(update);
    return;
  }

  // Wenn pausiert: aktuellen Stand zeigen + Pausescreen, aber nichts bewegen
  if (isPaused) {
    drawPlayer();
    drawEnemies();
    drawScore();
    drawPauseScreen();
    requestAnimationFrame(update);
    return;
  }

    // Wenn Game Over: alles anzeigen + Game-Over-Screen
  if (isGameOver) {
    drawPlayer();
    drawEnemies();
    drawScore();
    drawGameOverScreen();
    requestAnimationFrame(update);
    return;
  }


  // Spieler bewegen
  player.x += player.dx;

  // Begrenzungen
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }

  // alle Gegner updaten
  for (const enemy of enemies) {
    enemy.y += enemy.speed;

    // Gegner unten raus -> Score +1, schneller machen, ggf. neuen Gegner hinzufügen
    if (enemy.y > canvas.height) {
      score++;
      enemy.speed += 0.2;
      resetEnemy(enemy);

      // alle 5 Punkte einen neuen Gegner (bis maxEnemies)
      if (score % 5 === 0 && enemies.length < maxEnemies) {
  enemies.push(createEnemy(canvas.height * (0.004 + enemies.length * 0.0005)));
}
    }


        // Kollision mit diesem Gegner prüfen
    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      // Treffer -> Leben runter, Gegner resetten
      lives--;
      resetEnemy(enemy);

      // keine Leben mehr -> Game Over
      if (lives <= 0) {
        gameOver();
        // Schleife abbrechen, aber update() weiterlaufen lassen
        break;
      }
    }
  }

  // zeichnen
  drawPlayer();
  drawEnemies();
  drawScore();

  requestAnimationFrame(update);
}

// Tastatur-Eingaben (Pfeiltasten + WASD + ENTER + P)
function keyDown(e) {
    // Spiel starten oder nach Game Over neu starten
  if (e.key === "Enter") {
    // Start vom Startscreen
    if (!isStarted && !isGameOver) {
      isStarted = true;
      return;
    }

    // Neustart nach Game Over
    if (isGameOver) {
      resetGame();
      return;
    }
  }


  // Pause toggeln
  if (e.key === "p" || e.key === "P") {
    if (isStarted && !isGameOver) {
      isPaused = !isPaused;
      if (isPaused) {
        player.dx = 0; // Bewegung stoppen
      }
      return;
    }
  }

  // Bewegung nur, wenn gestartet und nicht pausiert
  if (!isStarted || isPaused || isGameOver) return;

  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    player.dx = player.speed;
  } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    player.dx = -player.speed;
  }
}

function keyUp(e) {
  if (!isStarted || isPaused) return;

  if (
    e.key === "ArrowRight" ||
    e.key === "ArrowLeft" ||
    e.key === "a" ||
    e.key === "A" ||
    e.key === "d" ||
    e.key === "D"
  ) {
    player.dx = 0;
  }
}

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// Spiel starten (Loop)
update();

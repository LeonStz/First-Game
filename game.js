const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Canvas fullscreen setzen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// bei Fensteränderung: Seite neu laden und Spiel an neue Größe anpassen
window.addEventListener("resize", () => {
  location.reload();
});

// Spieler-Objekt
const playerSize = canvas.width * 0.05;

const hitParticles = [];

const player = {
  width: playerSize,
  height: playerSize,
  x: canvas.width / 2 - playerSize / 2,
  y: canvas.height - playerSize - 80, // 80px über dem unteren Rand
  speed: 10,
  dx: 0,
};

// ======================
// Hintergrund-Partikel
// ======================
const particles = [];
const PARTICLE_COUNT = 80;

function createParticle() {
  const radius = Math.random() * 3 + 2; // Größe der Schneeflocke

  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: radius,
    speedY: 0.25 + Math.random() * 0.6,   // langsam nach unten
    speedX: -0.15 + Math.random() * 0.3,  // leichtes Driften
    alpha: 0.2 + Math.random() * 0.3,     // 0.2–0.4
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: -0.01 + Math.random() * 0.02, // leichte Drehung
  };
}

function initParticles() {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle());
  }
}

function updateParticles() {
  for (const p of particles) {
    p.y += p.speedY;
    p.x += p.speedX;
    p.rotation += p.rotationSpeed;

    // Wrap um den Bildschirm
    if (p.y > canvas.height + p.radius) {
      p.y = -p.radius;
      p.x = Math.random() * canvas.width;
    }
    if (p.x < -p.radius) p.x = canvas.width + p.radius;
    if (p.x > canvas.width + p.radius) p.x = -p.radius;
  }
}

function drawSnowflake(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  // Glow
  ctx.shadowColor = "rgba(80, 120, 255, 0.9)"; // bläuliches Glühen
  ctx.shadowBlur = 8;

  ctx.strokeStyle = "rgba(200, 230, 255, 1)"; // leicht bläuliches Weiß
  ctx.lineWidth = 1.8;

  const len = p.radius * 2.2;

  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI / 3) * i;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;

    ctx.moveTo(-dx, -dy);
    ctx.lineTo(dx, dy);
  }

  ctx.stroke();
  ctx.restore();
}



function drawParticles() {
  ctx.save();
  ctx.globalAlpha = 1; // Alpha kommt aus p.alpha in drawSnowflake

  for (const p of particles) {
    ctx.globalAlpha = p.alpha;
    drawSnowflake(p);
  }

  ctx.restore();
}


// Treffer-Partikel (Hit-Effekt)
function createHitParticle(x, y) {
  const angle = Math.random() * Math.PI * 2;     // in alle Richtungen
  const speed = 1.5 + Math.random() * 3.5;       // etwas langsamer als zuvor
  const life = 25 + Math.random() * 15;          // etwas länger sichtbar

  return {
    x,
    y,
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed,
    life: life,
    maxLife: life,
    radius: 2 + Math.random() * 3,               // Tropfengröße
  };
}


function spawnHitEffect(x, y) {
  const count = 25;
  for (let i = 0; i < count; i++) {
    hitParticles.push(createHitParticle(x, y));
  }
}

function updateHitParticles() {
  for (let i = hitParticles.length - 1; i >= 0; i--) {
    const p = hitParticles[i];

    p.x += p.dx;
    p.y += p.dy;
    p.dy += 0.25; // leichte Schwerkraft
    p.life -= 1;

    if (p.life <= 0) {
      hitParticles.splice(i, 1);
    }
  }
}

function drawHitParticles() {
  ctx.save();

  for (const p of hitParticles) {
    const alpha = p.life / p.maxLife;

    ctx.globalAlpha = alpha;

    // dunkles, leicht bräunliches Rot
    ctx.fillStyle = "rgba(120, 10, 20, 1)";

    // leichte „Spritzer-Form“ (gestreckter Kreis)
    ctx.beginPath();
    ctx.ellipse(
      p.x,
      p.y,
      p.radius * 1.4,      // breite
      p.radius,            // höhe
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}




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

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}


function drawPlayer() {
  ctx.save();

  // Schatten
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 8;

  // Verlauf im Player
  const gradient = ctx.createLinearGradient(
    player.x,
    player.y,
    player.x,
    player.y + player.height
  );
  gradient.addColorStop(0, "#1f2933");
  gradient.addColorStop(1, "#3b4252");

  ctx.fillStyle = gradient;

  const radius = player.height * 0.3;
  drawRoundedRect(player.x, player.y, player.width, player.height, radius);
  ctx.fill();

  ctx.restore();
}


// Gegner zeichnen
function drawEnemies() {
  ctx.save();

  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;

  for (const enemy of enemies) {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  }

  ctx.restore();
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
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Drück ENTER zum Starten", canvas.width / 2, canvas.height / 2);
}

// Pausescreen
function drawPauseScreen() {
   ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.font = "38px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
}

// Game-Over-Screen
function drawGameOverScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "28px Arial";
  ctx.fillText(
    "Score: " + score + "  |  Highscore: " + highscore,
    canvas.width / 2,
    canvas.height / 2 + 20
  );
  ctx.font = "20px Arial";
  ctx.fillText(
    "Drück ENTER zum Neustart",
    canvas.width / 2,
    canvas.height / 2 + 60
  );
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

// Hilfsfunktion: verkleinerte Hitbox berechnen
function getHitbox(obj, shrinkFactor) {
  const shrinkX = obj.width * shrinkFactor;
  const shrinkY = obj.height * shrinkFactor;

  return {
    x: obj.x + shrinkX / 2,
    y: obj.y + shrinkY / 2,
    width: obj.width - shrinkX,
    height: obj.height - shrinkY,
  };
}

// Axis-Aligned Bounding Box Kollision
function isColliding(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

// Update
function update() {
  clear();

  // Hintergrund-Partikel updaten + zeichnen
  updateParticles();
  drawParticles();

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

  // Spielerbewegung
  player.x += player.dx;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }

  // Gegnerbewegung + Kollision
  for (const enemy of enemies) {
    enemy.y += enemy.speed;

    // Gegner unten raus -> Score, Speed erhöhen, ggf. neuen Gegner spawnen
    if (enemy.y > canvas.height) {
      score++;
      enemy.speed += 0.3;
      resetEnemy(enemy);

      if (score % 5 === 0 && enemies.length < maxEnemies) {
        enemies.push(createEnemy(4 + enemies.length * 0.5));
      }
    }

    // Hitboxen verkleinern
    const playerBox = getHitbox(player, 0.3);
    const enemyBox = getHitbox(enemy, 0.2);

    // Kollision Spieler <-> Gegner
    if (isColliding(playerBox, enemyBox)) {
      const centerX = player.x + player.width / 2;
      const centerY = player.y + player.height / 2;

      // Treffer-Funken
      spawnHitEffect(centerX, centerY);

      lives--;
      resetEnemy(enemy);

      if (lives <= 0) {
        gameOver();
        break;
      }
    }
  }

  // Treffer-Partikel updaten
  updateHitParticles();

  // Zeichnen
  drawPlayer();
  drawEnemies();
  drawHitParticles();
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

initParticles();
update();

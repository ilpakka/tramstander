const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


const initialGreenZoneRadius = 100;
const initialCautionRadius = 150;
const initialFailThreshold = 180;


let currentGreenRadius = initialGreenZoneRadius;  
let currentCautionRadius = initialCautionRadius;
let failThreshold = initialFailThreshold;


let player = { 
  x: canvas.width / 2, 
  y: canvas.height / 2, 
  vx: 0, 
  vy: 0 
};

const damping = 0.98;               // Damping factor to gradually reduce velocity
const randomForceStrength = 0.05;     // Magnitude of force
const keyForce = 0.05;                // Force applied from keys
const maxEdgePullStrength = 0.10;     // Strength of pull when the player drifts too far


let score = 0;
let totalTime = 0;
let gameStarted = false;
const keys = {};


const timerElement = document.getElementById("timer");
const scoreElement = document.getElementById("score");


// --- Event Listeners ---

document.addEventListener("keydown", (event) => {
  if (!gameStarted) {
    gameStarted = true;
    return;
  }
  keys[event.key] = true;
});

document.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});


// --- Force and Movement Functions ---

// Applies a random force to the player for drifting
function applyRandomForce() {
  const randomX = Math.random() * randomForceStrength * 2 - randomForceStrength;
  const randomY = Math.random() * randomForceStrength * 2 - randomForceStrength;
  player.vx += randomX;
  player.vy += randomY;
}

// Pushes the player outward if they're too close to the center (within the safe green zone)
function applyRepulsionForce() {
  const dx = player.x - canvas.width / 2;
  const dy = player.y - canvas.height / 2;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < currentGreenRadius && distance !== 0) {
    const repulsionStrength = (currentGreenRadius - distance) / currentGreenRadius;
    const repulsionX = (dx / distance) * repulsionStrength * 0.1;
    const repulsionY = (dy / distance) * repulsionStrength * 0.1;
    player.vx += repulsionX;
    player.vy += repulsionY;
  }
}

// Pulls the player outward when they stray into the caution/red area
function applyEdgePullForce() {
  const dx = player.x - canvas.width / 2;
  const dy = player.y - canvas.height / 2;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > currentCautionRadius) {
    const normalizedDistance = (distance - currentCautionRadius) / (failThreshold - currentCautionRadius);
    const pullStrength = maxEdgePullStrength * Math.pow(normalizedDistance, 3);
    const outwardForceX = (dx / distance) * pullStrength;
    const outwardForceY = (dy / distance) * pullStrength;
    player.vx += outwardForceX;
    player.vy += outwardForceY;
  }
}

// Update the player's position based on forces, input, and time delta
function updatePosition(deltaTime) {
  if (!gameStarted) return;
  

  if (keys["ArrowUp"])    player.vy -= keyForce;
  if (keys["ArrowDown"])  player.vy += keyForce;
  if (keys["ArrowLeft"])  player.vx -= keyForce;
  if (keys["ArrowRight"]) player.vx += keyForce;
  

  applyEdgePullForce();
  applyRepulsionForce();
  

  player.x += player.vx;
  player.y += player.vy;
  

  player.vx *= damping;
  player.vy *= damping;
  

  if (player.x < 0) player.x = 0;
  if (player.x > canvas.width) player.x = canvas.width;
  if (player.y < 0) player.y = 0;
  if (player.y > canvas.height) player.y = canvas.height;
  

  const dx = player.x - canvas.width / 2;
  const dy = player.y - canvas.height / 2;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > failThreshold) {
    alert(`Game Over! You survived ${totalTime.toFixed(1)} seconds with a score of ${Math.floor(score)}.`);
    resetGame();
  }
}


// --- Zone and Stat Update Functions ---


function updateZones(deltaTime) {

  if (currentGreenRadius > 10) { 
    currentGreenRadius -= deltaTime * 5;  // Adjust this multiplier to control shrink speed
  }

  currentCautionRadius = Math.max(currentGreenRadius + 10, currentCautionRadius - deltaTime * 3);

  failThreshold = Math.max(currentCautionRadius + 10, failThreshold - deltaTime * 2);
}

function updateScore(deltaTime) {
  const dx = player.x - canvas.width / 2;
  const dy = player.y - canvas.height / 2;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance <= currentGreenRadius) {
    score += 3 * deltaTime;       // Best score in green
  } else if (distance <= currentCautionRadius) {
    score += 1 * deltaTime;       // Lower score in yellow
  }
  
  scoreElement.textContent = `Score: ${Math.floor(score)}`;
}


function updateTimer(deltaTime) {
  totalTime += deltaTime;
  timerElement.textContent = `Time: ${totalTime.toFixed(1)} s`;
}


// --- Drawing Function ---

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!gameStarted) {
    ctx.fillStyle = "black";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Press any key to START!", canvas.width / 2, canvas.height / 2);
    return;
  }
  
  // Draw the red (fail) zone
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, failThreshold, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw the yellow (caution) zone
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, currentCautionRadius, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw the green (safe) zone
  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, currentGreenRadius, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw the player as a blue dot
  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.arc(player.x, player.y, 10, 0, 2 * Math.PI);
  ctx.fill();
}


// --- Reset and Game Loop ---


function resetGame() {
  player = { x: canvas.width / 2, y: canvas.height / 2, vx: 0, vy: 0 };
  score = 0;
  totalTime = 0;
  currentGreenRadius = initialGreenZoneRadius;
  currentCautionRadius = initialCautionRadius;
  failThreshold = initialFailThreshold;
  gameStarted = false;
  draw();
}


let lastTimestamp = 0;
function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  
  if (gameStarted) {
    applyRandomForce();
    updateZones(deltaTime);
    updatePosition(deltaTime);
    updateScore(deltaTime);
    updateTimer(deltaTime);
  }
  
  draw();
  requestAnimationFrame(gameLoop);
}

resetGame();
requestAnimationFrame(gameLoop);

const holes = Array.from(document.querySelectorAll('.hole'));
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('start');
const messageEl = document.getElementById('message');
const durationInput = document.getElementById('duration');

let lastHole;
let timeUp = false;
let score = 0;
let gameTimer = null;
let timeLeft = 30;

function randomTime(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
  const idx = Math.floor(Math.random() * holes.length);
  const hole = holes[idx];
  if (hole === lastHole) {
    return randomHole(holes);
  }
  lastHole = hole;
  return hole;
}

function peep() {
  const min = 900;
  const max = Math.max(1500 - Math.min(score * 5, 300), 1200);
  const time = randomTime(min, max);
  const hole = randomHole(holes);
  const mole = hole.querySelector('.mole');
  mole.classList.add('up');
  setTimeout(() => {
    mole.classList.remove('up');
    if (!timeUp) {
      peep();
    }
  }, time);
}

function startGame() {
  score = 0;
  scoreEl.textContent = score;
  timeLeft = parseInt(durationInput.value, 10) || 30;
  timeEl.textContent = timeLeft;
  messageEl.hidden = true;

  timeUp = false;
  peep();

  clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    timeLeft -= 1;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      timeUp = true;
      clearInterval(gameTimer);
      endGame();
    }
  }, 1000);
}

function endGame() {
  messageEl.hidden = false;
  messageEl.textContent = `Kết thúc! Điểm của bạn: ${score}`;
  try {
    const best = parseInt(localStorage.getItem('whack_highscore') || '0', 10);
    if (score > best) {
      localStorage.setItem('whack_highscore', String(score));
      messageEl.textContent += ' — Tân vương! 🎉';
    } else {
      messageEl.textContent += ` — Điểm cao nhất: ${best}`;
    }
  } catch (e) {
    // ignore
  }
}

function hitMole(e) {
  if (!e.isTrusted) return;
  if (!this.classList.contains('up')) return;
  score += 1;
  scoreEl.textContent = score;
  this.classList.add('hit');
  setTimeout(() => this.classList.remove('hit'), 150);
  this.classList.remove('up');
}

document.querySelectorAll('.mole').forEach(mole => {
  mole.addEventListener('click', hitMole);
});

startBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    startGame();
  }
});

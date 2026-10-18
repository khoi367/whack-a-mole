const holes = Array.from(document.querySelectorAll('.hole'));
const popups = Array.from(document.querySelectorAll('.mole, .bomb'));
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('start');
const messageEl = document.getElementById('message');
const GAME_DURATION_SECONDS = 60;

let lastHole;
let timeUp = false;
let score = 0;
let gameTimer = null;
let popupTimer = null;
let timeLeft = GAME_DURATION_SECONDS;

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
  const popup = hole.querySelector(Math.random() < 0.25 ? '.bomb' : '.mole');
  popup.classList.add('up');
  popupTimer = setTimeout(() => {
    popup.classList.remove('up');
    if (!timeUp) {
      peep();
    }
  }, time);
}

function startGame() {
  clearInterval(gameTimer);
  clearTimeout(popupTimer);
  popups.forEach(popup => popup.classList.remove('up', 'hit'));

  score = 0;
  scoreEl.textContent = score;
  timeLeft = GAME_DURATION_SECONDS;
  timeEl.textContent = timeLeft;
  messageEl.hidden = true;

  timeUp = false;
  peep();

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
  clearTimeout(popupTimer);
  popups.forEach(popup => popup.classList.remove('up'));
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

function hitPopup(e) {
  if (!e.isTrusted) return;
  if (timeUp) return;
  if (!this.classList.contains('up')) return;
  score = this.classList.contains('bomb')
    ? Math.max(0, score - 5)
    : score + 1;
  scoreEl.textContent = score;
  this.classList.add('hit');
  setTimeout(() => this.classList.remove('hit'), 150);
  this.classList.remove('up');
}

popups.forEach(popup => {
  popup.addEventListener('click', hitPopup);
});

startBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    startGame();
  }
});

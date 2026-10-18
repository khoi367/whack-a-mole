const holes = Array.from(document.querySelectorAll('.hole'));
const popups = Array.from(document.querySelectorAll('.mole, .bomb'));
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('start');
const soundToggle = document.getElementById('sound-toggle');
const messageEl = document.getElementById('message');
const GAME_DURATION_SECONDS = 60;

let lastHole;
let timeUp = false;
let score = 0;
let gameTimer = null;
let popupTimer = null;
let timeLeft = GAME_DURATION_SECONDS;
let soundEnabled = true;
let audioContext;

function playTone(frequency, duration, type = 'sine', volume = 0.08, delay = 0) {
  if (!soundEnabled || !audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const startAt = audioContext.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(volume, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
}

function playSound(kind) {
  if (!soundEnabled) return;
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  if (kind === 'mole') {
    playTone(520, 0.09, 'sine', 0.09);
    playTone(760, 0.12, 'sine', 0.07, 0.06);
  } else if (kind === 'bomb') {
    playTone(150, 0.2, 'triangle', 0.12);
    playTone(90, 0.25, 'sawtooth', 0.05, 0.04);
  } else {
    playTone(440, 0.12, 'sine', 0.06);
    playTone(660, 0.16, 'sine', 0.06, 0.1);
  }
}

function showHitFeedback(popup, points) {
  const hole = popup.closest('.hole');
  const feedback = document.createElement('span');
  feedback.className = `hit-feedback${points < 0 ? ' penalty' : ''}`;
  feedback.textContent = points > 0 ? `+${points} ✨` : `${points} 💥`;
  hole.append(feedback);
  feedback.addEventListener('animationend', () => feedback.remove(), { once: true });
}

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
  document.querySelectorAll('.hit-feedback').forEach(feedback => feedback.remove());

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
  playSound('end');
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
  const hitBomb = this.classList.contains('bomb');
  const points = hitBomb ? -5 : 1;
  score = hitBomb ? Math.max(0, score - 5) : score + 1;
  scoreEl.textContent = score;
  scoreEl.classList.remove('score-pop');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('score-pop');
  showHitFeedback(this, points);
  playSound(hitBomb ? 'bomb' : 'mole');
  this.classList.add('hit');
  setTimeout(() => this.classList.remove('hit'), 150);
  this.classList.remove('up');
}

popups.forEach(popup => {
  popup.addEventListener('click', hitPopup);
});

startBtn.addEventListener('click', startGame);
soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt';
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  if (soundEnabled) playSound('mole');
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    startGame();
  }
});

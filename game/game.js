"use strict";

// Memory Garden — JavaScript thuần, không cần API hay thư viện ngoài.
const ICONS = ["🐰", "🐻", "🐱", "🐼", "🦊", "🐸", "🐣", "🦋", "🌷", "🍓", "🍒", "🌈"];
const PAIRS_BY_LEVEL = { easy: 6, medium: 8, hard: 12 };
const FLIP_DELAY = 850;

const $ = (id) => document.getElementById(id);
const board = $("board");
const difficulty = $("difficulty");
const restartBtn = $("restartBtn");
const soundToggle = $("soundToggle");
const winModal = $("winModal");

let cards = [];
let flipped = [];
let moves = 0;
let matches = 0;
let seconds = 0;
let timerId = null;
let flipTimeoutId = null;
let locked = false;
let started = false;
let soundOn = true;
let audioContext = null;
let previousFocus = null;

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function formatTime(total) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function bestKey() {
  return `memoryGardenBest_${difficulty.value}`;
}

function getBest() {
  try {
    const value = Number(localStorage.getItem(bestKey()));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function setBest(value) {
  try { localStorage.setItem(bestKey(), String(value)); } catch { /* Chơi vẫn được khi chặn storage */ }
}

function playTone(type) {
  if (!soundOn) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    const now = audioContext.currentTime;
    const notes = type === "match" ? [660, 880] : type === "win" ? [523, 659, 784, 1047] : type === "wrong" ? [280] : [520];
    notes.forEach((frequency, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = now + i * (type === "win" ? 0.12 : 0.09);
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.075, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  } catch { /* Âm thanh không phải điều kiện để chơi */ }
}

function updateStats() {
  const total = PAIRS_BY_LEVEL[difficulty.value];
  const percentage = Math.round((matches / total) * 100);
  $("moves").textContent = String(moves);
  $("timer").textContent = formatTime(seconds);
  $("matches").textContent = `${matches}/${total}`;
  $("best").textContent = getBest() ?? "—";
  $("progressText").textContent = matches === total ? "Đã ghép đủ các cặp! ✨" : `Tìm đủ ${total} cặp thẻ nhé!`;
  $("progressPercent").textContent = `${percentage}%`;
  $("progressFill").style.width = `${percentage}%`;
  $("progressBar").setAttribute("aria-valuenow", String(percentage));
}

function startTimer() {
  if (started) return;
  started = true;
  timerId = setInterval(() => {
    seconds += 1;
    $("timer").textContent = formatTime(seconds);
  }, 1000);
}

function makeCard(icon, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "card";
  button.dataset.icon = icon;
  button.dataset.index = String(index);
  button.setAttribute("aria-label", `Thẻ số ${index + 1}, chưa lật`);
  button.setAttribute("aria-pressed", "false");

  const inner = document.createElement("span");
  inner.className = "card-inner";
  const back = document.createElement("span");
  back.className = "card-face card-back";
  back.setAttribute("aria-hidden", "true");
  const symbol = document.createElement("span");
  symbol.textContent = "✿";
  back.appendChild(symbol);
  const front = document.createElement("span");
  front.className = "card-face card-front";
  front.setAttribute("aria-hidden", "true");
  front.textContent = icon;
  inner.append(back, front);
  button.appendChild(inner);
  button.addEventListener("click", () => flipCard(button));
  return button;
}

function flipCard(card) {
  if (locked || card.classList.contains("flipped") || card.classList.contains("matched")) return;
  startTimer();
  card.classList.add("flipped");
  card.setAttribute("aria-pressed", "true");
  card.setAttribute("aria-label", `Thẻ số ${Number(card.dataset.index) + 1}: ${card.dataset.icon}`);
  flipped.push(card);
  playTone("flip");
  if (flipped.length !== 2) {
    $("statusText").textContent = "Hãy tìm chiếc thẻ giống nó!";
    return;
  }

  moves++;
  updateStats();
  locked = true;
  const [first, second] = flipped;
  if (first.dataset.icon === second.dataset.icon) {
    first.classList.add("matched");
    second.classList.add("matched");
    first.disabled = true;
    second.disabled = true;
    first.setAttribute("aria-label", `Đã ghép: ${first.dataset.icon}`);
    second.setAttribute("aria-label", `Đã ghép: ${second.dataset.icon}`);
    matches++;
    flipped = [];
    locked = false;
    playTone("match");
    $("statusText").textContent = "Chính xác! Bạn giỏi quá! 🌟";
    updateStats();
    if (matches === PAIRS_BY_LEVEL[difficulty.value]) finishGame();
  } else {
    $("statusText").textContent = "Chưa đúng rồi, thử lại nhé! 💕";
    flipTimeoutId = setTimeout(() => {
      [first, second].forEach((item) => {
        item.classList.remove("flipped");
        item.setAttribute("aria-pressed", "false");
        item.setAttribute("aria-label", `Thẻ số ${Number(item.dataset.index) + 1}, chưa lật`);
      });
      flipped = [];
      locked = false;
      flipTimeoutId = null;
    }, FLIP_DELAY);
  }
}

function confetti() {
  const layer = $("confetti");
  layer.replaceChildren();
  const colors = ["#f5aac4", "#b6a3eb", "#a9e2ce", "#f9d58e"];
  for (let i = 0; i < 55; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.7}s`;
    piece.style.animationDuration = `${2.2 + Math.random() * 1.3}s`;
    piece.style.borderRadius = i % 3 ? "2px" : "50%";
    layer.appendChild(piece);
  }
  setTimeout(() => layer.replaceChildren(), 4500);
}

function finishGame() {
  clearInterval(timerId);
  timerId = null;
  const oldBest = getBest();
  const newRecord = oldBest === null || moves < oldBest;
  if (newRecord) setBest(moves);
  updateStats();
  $("winMoves").textContent = String(moves);
  $("winTime").textContent = formatTime(seconds);
  $("winMessage").textContent = `Bạn đã tìm được tất cả ${matches} cặp thẻ. Cùng chơi thêm một ván nhé!`;
  $("newRecord").hidden = !newRecord;
  previousFocus = document.activeElement;
  winModal.hidden = false;
  $("playAgainBtn").focus();
  playTone("win");
  confetti();
}

function resetGame() {
  clearInterval(timerId);
  clearTimeout(flipTimeoutId);
  timerId = null;
  flipTimeoutId = null;
  started = false;
  locked = false;
  flipped = [];
  moves = 0;
  matches = 0;
  seconds = 0;
  const total = PAIRS_BY_LEVEL[difficulty.value];
  const chosen = shuffle(ICONS).slice(0, total);
  cards = shuffle([...chosen, ...chosen]);
  board.classList.toggle("hard", difficulty.value === "hard");
  board.replaceChildren(...cards.map((icon, index) => makeCard(icon, index)));
  winModal.hidden = true;
  $("confetti").replaceChildren();
  $("statusText").textContent = "Chọn hai thẻ để bắt đầu!";
  updateStats();
}

restartBtn.addEventListener("click", resetGame);
difficulty.addEventListener("change", resetGame);
$("playAgainBtn").addEventListener("click", () => {
  resetGame();
  restartBtn.focus();
});
soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  soundToggle.setAttribute("aria-pressed", String(soundOn));
  soundToggle.setAttribute("aria-label", soundOn ? "Tắt âm thanh" : "Bật âm thanh");
  $("soundIcon").textContent = soundOn ? "♫" : "♪";
  $("soundLabel").textContent = soundOn ? "Âm thanh: Bật" : "Âm thanh: Tắt";
  if (soundOn) playTone("flip");
});
winModal.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    $("playAgainBtn").focus();
  }
});

resetGame();

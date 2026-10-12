"use strict";

// Puzzle Garden — trò chơi trượt ô ghép tranh, không dùng thư viện ngoài.
const $ = (selector) => document.querySelector(selector);
const board = $("#puzzleBoard");
const scenePicker = $("#scenePicker");
const difficultyPicker = $("#difficultyPicker");
const timeValue = $("#timeValue");
const moveValue = $("#moveValue");
const bestValue = $("#bestValue");
const progressBar = $("#progressBar");
const progressText = $("#progressText");
const statusPill = $("#statusPill");
const liveStatus = $("#liveStatus");
const previewModal = $("#previewModal");
const winModal = $("#winModal");

function svgUrl(svg) {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

const scenes = [
  {
    id: "bunny", name: "Thỏ hồng",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#fce6f2"/><stop offset="1" stop-color="#eadffd"/></linearGradient></defs><rect width="600" height="600" fill="url(#bg)"/><circle cx="510" cy="92" r="65" fill="#fff6cd" opacity=".8"/><g fill="#fff" opacity=".8"><circle cx="100" cy="130" r="33"/><circle cx="140" cy="130" r="45"/><circle cx="175" cy="138" r="30"/></g><path d="M0 455Q180 390 300 454T600 430V600H0" fill="#bce7cf"/><path d="M0 500Q180 450 350 510T600 480V600H0" fill="#95d5b7"/><ellipse cx="300" cy="506" rx="145" ry="28" fill="#7abca6" opacity=".35"/><g><ellipse cx="235" cy="213" rx="53" ry="146" transform="rotate(-15 235 213)" fill="#fffdfc"/><ellipse cx="365" cy="213" rx="53" ry="146" transform="rotate(15 365 213)" fill="#fffdfc"/><ellipse cx="237" cy="211" rx="25" ry="105" transform="rotate(-15 237 211)" fill="#ffc5d9"/><ellipse cx="363" cy="211" rx="25" ry="105" transform="rotate(15 363 211)" fill="#ffc5d9"/><ellipse cx="300" cy="440" rx="123" ry="104" fill="#fffdfc"/><circle cx="300" cy="332" r="138" fill="#fffdfc"/><ellipse cx="252" cy="336" rx="11" ry="16" fill="#5b516a"/><ellipse cx="348" cy="336" rx="11" ry="16" fill="#5b516a"/><ellipse cx="218" cy="365" rx="26" ry="13" fill="#ffc4d8" opacity=".9"/><ellipse cx="382" cy="365" rx="26" ry="13" fill="#ffc4d8" opacity=".9"/><path d="M287 370Q300 384 313 370Q300 361 287 370" fill="#e89cb6"/><path d="M300 380q-12 18-25 1m25-1q12 18 25 1" fill="none" stroke="#76647c" stroke-width="5" stroke-linecap="round"/><ellipse cx="215" cy="494" rx="46" ry="26" fill="#fffdfc"/><ellipse cx="385" cy="494" rx="46" ry="26" fill="#fffdfc"/></g><g fill="#ffcf7b"><circle cx="78" cy="448" r="10"/><circle cx="515" cy="467" r="10"/></g><g stroke="#fff" stroke-width="9" stroke-linecap="round"><path d="M78 426v44m-22-22h44M515 445v44m-22-22h44"/></g></svg>`
  },
  {
    id: "bear", name: "Gấu mật",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#e1f3ff"/><stop offset="1" stop-color="#f9f5d9"/></linearGradient></defs><rect width="600" height="600" fill="url(#sky)"/><circle cx="492" cy="100" r="62" fill="#fff3c2"/><g fill="#fff" opacity=".85"><ellipse cx="100" cy="142" rx="87" ry="30"/><ellipse cx="130" cy="120" rx="52" ry="35"/></g><path d="M0 450Q180 380 310 440T600 430V600H0" fill="#c3e8b7"/><path d="M0 510Q180 455 320 500T600 490V600H0" fill="#9bd7b0"/><ellipse cx="300" cy="515" rx="150" ry="25" fill="#6eae87" opacity=".25"/><circle cx="205" cy="215" r="72" fill="#b98355"/><circle cx="395" cy="215" r="72" fill="#b98355"/><circle cx="205" cy="215" r="38" fill="#e9b88e"/><circle cx="395" cy="215" r="38" fill="#e9b88e"/><ellipse cx="300" cy="455" rx="135" ry="108" fill="#c9966a"/><circle cx="300" cy="318" r="148" fill="#c9966a"/><ellipse cx="246" cy="318" rx="12" ry="16" fill="#57483f"/><ellipse cx="354" cy="318" rx="12" ry="16" fill="#57483f"/><ellipse cx="300" cy="374" rx="65" ry="48" fill="#f5d8b8"/><ellipse cx="300" cy="358" rx="21" ry="15" fill="#674e46"/><path d="M300 370v12m0 0q-16 18-32 0m32 0q16 18 32 0" stroke="#674e46" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="207" cy="362" rx="25" ry="12" fill="#eaa9a0"/><ellipse cx="393" cy="362" rx="25" ry="12" fill="#eaa9a0"/><ellipse cx="210" cy="491" rx="45" ry="27" fill="#c9966a"/><ellipse cx="390" cy="491" rx="45" ry="27" fill="#c9966a"/><path d="M260 431h80l-10 70h-60z" fill="#f4c35d"/><path d="M270 432h60" stroke="#fff0ba" stroke-width="8" stroke-linecap="round"/><g fill="#fff3be"><circle cx="90" cy="476" r="9"/><circle cx="510" cy="469" r="9"/></g></svg>`
  },
  {
    id: "cat", name: "Mèo mây",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="sky" x2="1" y2="1"><stop stop-color="#dce9ff"/><stop offset="1" stop-color="#e9dcfc"/></linearGradient></defs><rect width="600" height="600" fill="url(#sky)"/><circle cx="490" cy="104" r="62" fill="#fff9dc"/><g fill="#fff" opacity=".85"><ellipse cx="100" cy="172" rx="80" ry="34"/><ellipse cx="150" cy="153" rx="60" ry="41"/><ellipse cx="420" cy="232" rx="80" ry="25"/></g><path d="M0 470Q120 440 240 485T600 455V600H0" fill="#c6e6db"/><path d="M0 530Q180 480 310 530T600 495V600H0" fill="#a7d8c7"/><path d="M188 252L195 117L290 207M410 252L405 117L310 207" fill="#fffdfc" stroke="#fffdfc" stroke-width="14" stroke-linejoin="round"/><path d="M212 209L214 155L260 217M388 209L386 155L340 217" fill="#f9cadc"/><path d="M402 422q112-10 96-101" fill="none" stroke="#fffdfc" stroke-width="44" stroke-linecap="round"/><ellipse cx="300" cy="453" rx="130" ry="100" fill="#fffdfc"/><circle cx="300" cy="325" r="144" fill="#fffdfc"/><ellipse cx="247" cy="323" rx="12" ry="17" fill="#60556b"/><ellipse cx="353" cy="323" rx="12" ry="17" fill="#60556b"/><path d="M288 362q12 13 24 0q-12-10-24 0" fill="#eda5bc"/><path d="M300 370v9m0 0q-14 18-27 0m27 0q14 18 27 0" fill="none" stroke="#6c5b70" stroke-width="4" stroke-linecap="round"/><g stroke="#a49baa" stroke-width="4" stroke-linecap="round"><path d="M211 365l-48-9m47 23l-47 7m226-21l48-9m-47 23l47 7"/></g><ellipse cx="214" cy="354" rx="22" ry="11" fill="#fbc9d8"/><ellipse cx="386" cy="354" rx="22" ry="11" fill="#fbc9d8"/><ellipse cx="218" cy="502" rx="42" ry="25" fill="#fffdfc"/><ellipse cx="382" cy="502" rx="42" ry="25" fill="#fffdfc"/><g fill="#fff"><circle cx="90" cy="397" r="6"/><circle cx="518" cy="370" r="9"/><circle cx="110" cy="300" r="5"/></g></svg>`
  }
];
scenes.forEach(s => s.url = svgUrl(s.svg));

let size = 3;
let sceneIndex = 0;
let tiles = [];
let moves = 0;
let elapsed = 0;
let started = false;
let finished = false;
let timerId = null;
let audioEnabled = true;
let audioContext = null;
let lastFocus = null;

function getName() {
  try { return localStorage.getItem("quizUserName") || "Bạn"; }
  catch { return "Bạn"; }
}
function updateName() {
  document.querySelectorAll(".displayUserName").forEach(el => el.textContent = getName());
}
function fmt(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function recordKey() { return `puzzleGardenBest_${scenes[sceneIndex].id}_${size}`; }
function readRecord() {
  try { const val = JSON.parse(localStorage.getItem(recordKey())); return val && Number.isFinite(val.moves) ? val : null; }
  catch { return null; }
}
function updateRecord() {
  const record = readRecord();
  bestValue.textContent = record ? `${record.moves} bước` : "—";
}
function playSound(kind = "move") {
  if (!audioEnabled) return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioContext ||= new Context();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime;
    const notes = kind === "win" ? [523, 659, 784, 1047] : [kind === "start" ? 520 : 620];
    notes.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const t = now + i * .12;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(.0001, t);
      gain.gain.exponentialRampToValueAtTime(.07, t + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, t + .14);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(t);
      osc.stop(t + .15);
    });
  } catch { /* Âm thanh không bắt buộc để chơi. */ }
}
function adjacent(a, b) {
  const ar = Math.floor(a / size), ac = a % size;
  const br = Math.floor(b / size), bc = b % size;
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
}
function neighbors(index) {
  return [index - size, index + size, index - 1, index + 1]
    .filter(i => i >= 0 && i < size * size && adjacent(i, index));
}
function shuffleBoard() {
  // Chỉ hoán đổi ô trống với ô kề bên nên mọi thế cờ đều giải được.
  const n = size * size;
  tiles = Array.from({ length: n }, (_, i) => i === n - 1 ? null : i);
  let blank = n - 1;
  let previous = -1;
  const steps = size * size * 45;
  for (let step = 0; step < steps; step++) {
    let choices = neighbors(blank).filter(i => i !== previous);
    if (!choices.length) choices = neighbors(blank);
    const next = choices[Math.floor(Math.random() * choices.length)];
    [tiles[blank], tiles[next]] = [tiles[next], tiles[blank]];
    previous = blank;
    blank = next;
  }
  if (isSolved()) {
    const next = neighbors(blank)[0];
    [tiles[blank], tiles[next]] = [tiles[next], tiles[blank]];
  }
}
function isSolved() {
  return tiles.every((value, index) => index === tiles.length - 1 ? value === null : value === index);
}
function progress() {
  const correct = tiles.filter((value, index) => value !== null && value === index).length;
  return Math.round(correct / (tiles.length - 1) * 100);
}
function renderBoard() {
  const image = scenes[sceneIndex].url;
  const blank = tiles.indexOf(null);
  board.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
  board.replaceChildren();
  tiles.forEach((tile, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = tile === null ? "tile blank" : "tile";
    if (tile === null) {
      btn.disabled = true;
      btn.setAttribute("aria-label", "Ô trống");
    } else {
      const row = Math.floor(tile / size);
      const col = tile % size;
      btn.style.backgroundImage = `url("${image}")`;
      btn.style.backgroundSize = `${size * 100}% ${size * 100}%`;
      btn.style.backgroundPosition = `${col * 100 / (size - 1)}% ${row * 100 / (size - 1)}%`;
      btn.setAttribute("aria-label", `Mảnh ${tile + 1}${adjacent(index, blank) ? ', có thể di chuyển' : ''}`);
      if (adjacent(index, blank)) btn.classList.add("movable");
      const number = document.createElement("span");
      number.className = "tile-number";
      number.textContent = tile + 1;
      btn.append(number);
      btn.addEventListener("click", () => moveTile(index));
    }
    board.append(btn);
  });
  moveValue.textContent = String(moves);
  timeValue.textContent = fmt(elapsed);
  const pct = progress();
  progressBar.style.width = `${pct}%`;
  progressText.textContent = `${pct}%`;
}
function startTimer() {
  if (started) return;
  started = true;
  statusPill.textContent = "🎮 Đang chơi";
  timerId = setInterval(() => { elapsed++; timeValue.textContent = fmt(elapsed); }, 1000);
}
function moveTile(index) {
  if (finished || !adjacent(index, tiles.indexOf(null))) return;
  startTimer();
  const blank = tiles.indexOf(null);
  [tiles[index], tiles[blank]] = [tiles[blank], tiles[index]];
  moves++;
  playSound();
  renderBoard();
  if (isSolved()) winGame();
}
function winGame() {
  finished = true;
  clearInterval(timerId);
  timerId = null;
  statusPill.textContent = "🏆 Hoàn thành!";
  const old = readRecord();
  const newBest = !old || moves < old.moves || (moves === old.moves && elapsed < old.time);
  if (newBest) {
    try { localStorage.setItem(recordKey(), JSON.stringify({ moves, time: elapsed })); } catch { /* Private mode */ }
  }
  updateRecord();
  $("#winTime").textContent = fmt(elapsed);
  $("#winMoves").textContent = String(moves);
  $("#recordMessage").textContent = newBest ? "✨ Kỷ lục mới! Tuyệt vời quá!" : "🌷 Cùng thử vượt kỷ lục nhé!";
  updateName();
  liveStatus.textContent = "Chúc mừng, bạn đã hoàn thành bức tranh!";
  playSound("win");
  setTimeout(() => showModal(winModal), 350);
}
function newGame() {
  clearInterval(timerId);
  timerId = null;
  started = false;
  finished = false;
  moves = 0;
  elapsed = 0;
  statusPill.textContent = "🌱 Sẵn sàng";
  shuffleBoard();
  updateRecord();
  renderBoard();
  liveStatus.textContent = `Đã trộn hình ${scenes[sceneIndex].name}, bảng ${size} nhân ${size}.`;
}
function renderChoices() {
  scenePicker.replaceChildren();
  scenes.forEach((scene, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `scene-choice${index === sceneIndex ? " active" : ""}`;
    button.setAttribute("aria-pressed", String(index === sceneIndex));
    const img = document.createElement("img");
    img.src = scene.url;
    img.alt = "";
    const label = document.createElement("span");
    label.textContent = scene.name;
    button.append(img, label);
    button.addEventListener("click", () => {
      if (sceneIndex === index) return;
      sceneIndex = index;
      renderChoices();
      newGame();
    });
    scenePicker.append(button);
  });
}
function showModal(modal) {
  lastFocus = document.activeElement;
  modal.hidden = false;
  const first = modal.querySelector("button");
  if (first) first.focus();
}
function hideModal(modal) {
  modal.hidden = true;
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}
function openPreview() {
  $("#previewImage").src = scenes[sceneIndex].url;
  $("#previewTitle").textContent = scenes[sceneIndex].name;
  showModal(previewModal);
}
$("#newGameBtn").addEventListener("click", () => { newGame(); playSound("start"); });
$("#hintBtn").addEventListener("click", openPreview);
$("#soundBtn").addEventListener("click", () => {
  audioEnabled = !audioEnabled;
  $("#soundBtn").textContent = audioEnabled ? "🔊" : "🔇";
  $("#soundBtn").setAttribute("aria-pressed", String(audioEnabled));
  $("#soundBtn").setAttribute("aria-label", audioEnabled ? "Tắt âm thanh" : "Bật âm thanh");
  if (audioEnabled) playSound("start");
});
difficultyPicker.addEventListener("click", event => {
  const button = event.target.closest("button[data-size]");
  if (!button) return;
  const nextSize = Number(button.dataset.size);
  if (size === nextSize) return;
  size = nextSize;
  difficultyPicker.querySelectorAll("button").forEach(btn => {
    btn.classList.toggle("active", btn === button);
    btn.setAttribute("aria-pressed", String(btn === button));
  });
  newGame();
});
previewModal.querySelectorAll('[data-close="preview"]').forEach(el => el.addEventListener("click", () => hideModal(previewModal)));
$("#playAgainBtn").addEventListener("click", () => { hideModal(winModal); newGame(); });
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !previewModal.hidden) { hideModal(previewModal); return; }
  if (!previewModal.hidden || !winModal.hidden || event.altKey || event.ctrlKey || event.metaKey) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
  const blank = tiles.indexOf(null);
  const r = Math.floor(blank / size), c = blank % size;
  const target = ({ ArrowUp: r < size - 1 ? blank + size : -1, ArrowDown: r > 0 ? blank - size : -1, ArrowLeft: c < size - 1 ? blank + 1 : -1, ArrowRight: c > 0 ? blank - 1 : -1 })[event.key];
  if (target !== undefined) { event.preventDefault(); if (target >= 0) moveTile(target); }
});
updateName();
renderChoices();
difficultyPicker.querySelectorAll("button").forEach(btn => btn.setAttribute("aria-pressed", String(Number(btn.dataset.size) === size)));
newGame();

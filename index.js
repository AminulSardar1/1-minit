/* ================= CONFIG ================= */
const INTERVAL_SEC = 60;
const ENDPOINT = "https://nid.proo.one/sms.php?number=";
const PHONE_RE = /^01[3-9]\d{8}$/;

/* ================= ELEMENTS ================= */
const timerEl  = document.getElementById("timer");
const statusEl = document.getElementById("status");
const dotEl    = document.getElementById("dot");
const numberEl = document.getElementById("number");
const checksEl = document.getElementById("checks");
const logEl    = document.getElementById("log");
const startBtn = document.getElementById("startBtn");
const stopBtn  = document.getElementById("stopBtn");

/* ================= STATE ================= */
let running   = false;
let remaining = INTERVAL_SEC;
let deadline  = 0;
let ticker    = null;
let checks    = 0;

/* ================= HELPERS ================= */
const pad = n => String(n).padStart(2, "0");

function render() {
  timerEl.textContent = pad(Math.floor(remaining / 60)) + ":" + pad(remaining % 60);
}

function setStatus(text, color) {
  statusEl.textContent = text;
  dotEl.style.background = color;
  dotEl.style.boxShadow = "0 0 10px " + color;
}

function isValid(v) {
  return PHONE_RE.test(v.trim());
}

function setRunningUI(on) {
  startBtn.disabled = on;
  stopBtn.disabled  = !on;
  numberEl.disabled = on;
}

function addLog(msg, color) {
  const empty = logEl.querySelector(".log-empty");
  if (empty) empty.remove();

  const row = document.createElement("div");
  row.className = "log-row";
  row.innerHTML =
    '<span class="log-time">' + new Date().toLocaleTimeString() + '</span>' +
    '<span style="color:' + color + '">' + msg + '</span>';

  logEl.prepend(row);
  while (logEl.children.length > 30) logEl.lastElementChild.remove();
}

/* ================= CORE LOOP ================= */
function loop() {
  const left = deadline - Date.now();
  remaining = Math.max(0, Math.ceil(left / 1000));
  render();

  if (left <= 0) {
    deadline = Date.now() + INTERVAL_SEC * 1000;
    remaining = INTERVAL_SEC;
    render();
    doCheck();
  }
}

/* ================= ENDPOINT CHECK ================= */
async function doCheck() {
  const num = numberEl.value.trim();
  if (!isValid(num)) return;

  checks++;
  checksEl.textContent = checks;

  const url = ENDPOINT + encodeURIComponent(num);
  setStatus("CHECKING #" + checks + "...", "#38bdf8");
  timerEl.style.color = "#fbbf24";

  try {
    await fetch(url, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      keepalive: true
    });
    addLog("✔ CHECK #" + checks + " SENT", "#22c55e");
    setStatus("CHECK #" + checks + " DONE", "#22c55e");
  } catch (err) {
    addLog("✖ CHECK #" + checks + " FAILED", "#ef4444");
    setStatus("CHECK #" + checks + " FAILED", "#ef4444");
  }

  setTimeout(() => {
    timerEl.style.color = "#38bdf8";
    if (running) setStatus("AUTO CHECK ON • EVERY 60s", "#22c55e");
  }, 1200);
}

/* ================= CONTROLS ================= */
function startTimer() {
  if (running) return;

  if (!isValid(numberEl.value)) {
    alert("Please enter a valid Bangladesh mobile number!");
    return;
  }

  localStorage.setItem("aminul_number", numberEl.value.trim());

  running   = true;
  checks    = 0;
  checksEl.textContent = "0";
  deadline  = Date.now() + INTERVAL_SEC * 1000;
  remaining = INTERVAL_SEC;
  render();

  setRunningUI(true);
  setStatus("AUTO CHECK ON • EVERY 60s", "#22c55e");
  addLog("▶ TIMER STARTED", "#22c55e");

  ticker = setInterval(loop, 200);
  loop();
}

function stopTimer() {
  clearInterval(ticker);
  ticker  = null;
  running = false;

  setRunningUI(false);
  setStatus("TIMER STOPPED", "#ef4444");
  timerEl.style.color = "#38bdf8";
  addLog("■ TIMER STOPPED", "#ef4444");
}

function resetTimer() {
  clearInterval(ticker);
  ticker    = null;
  running   = false;
  checks    = 0;
  remaining = INTERVAL_SEC;
  deadline  = 0;

  checksEl.textContent = "0";
  timerEl.style.color = "#38bdf8";
  render();

  setRunningUI(false);
  setStatus("READY TO START", "#64748b");
  addLog("↻ RESET", "#94a3b8");
}

function openURL() {
  const num = numberEl.value.trim();

  if (!isValid(num)) {
    alert("Please enter a valid mobile number!");
    return;
  }

  window.open(ENDPOINT + encodeURIComponent(num), "_blank");
  addLog("🌐 MANUAL OPEN", "#38bdf8");
}

/* ================= INIT ================= */
(function init() {
  const saved = localStorage.getItem("aminul_number");
  if (saved) numberEl.value = saved;

  numberEl.addEventListener("input", () => {
    numberEl.value = numberEl.value.replace(/\D/g, "").slice(0, 11);
  });

  render();
  setStatus("READY TO START", "#64748b");
})();

/* Make functions available for inline onclick handlers */
window.startTimer = startTimer;
window.stopTimer  = stopTimer;
window.resetTimer = resetTimer;
window.openURL    = openURL;

/* ================= CONFIG ================= */
const INTERVAL_SEC = 60;
const PHONE_RE = /^01[3-9]\d{8}$/;

/* ================= ELEMENTS ================= */
const timerEl  = document.getElementById("timer");
const statusEl = document.getElementById("status");
const dotEl    = document.getElementById("dot");
const numberEl = document.getElementById("number");
const newNumberEl = document.getElementById("newNumber");
const checksEl = document.getElementById("checks");
const logEl    = document.getElementById("log");
const startBtn = document.getElementById("startBtn");
const stopBtn  = document.getElementById("stopBtn");
const singleTab = document.getElementById("singleTab");
const multiTab = document.getElementById("multiTab");
const singleSection = document.getElementById("singleSection");
const multiSection = document.getElementById("multiSection");
const numberListContainer = document.getElementById("numberListContainer");
const countBadge = document.getElementById("countBadge");

/* ================= STATE ================= */
let currentMode = "single"; // 'single' or 'multi'
let running   = false;
let remaining = INTERVAL_SEC;
let deadline  = 0;
let ticker    = null;
let checks    = 0;
let savedNumbers = [];

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
  newNumberEl.disabled = on;
  singleTab.disabled = on;
  multiTab.disabled = on;
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
  while (logEl.children.length > 40) logEl.lastElementChild.remove();
}

/* ================= MODE SWITCHING ================= */
function switchMode(mode) {
  if (running) return;
  currentMode = mode;
  if (mode === "single") {
    singleTab.classList.add("active");
    multiTab.classList.remove("active");
    singleSection.style.display = "block";
    multiSection.style.display = "none";
  } else {
    multiTab.classList.add("active");
    singleTab.classList.remove("active");
    singleSection.style.display = "none";
    multiSection.style.display = "block";
    renderNumberList();
  }
}

function addNumber() {
  const num = newNumberEl.value.trim();
  if (!isValid(num)) {
    alert("Please enter a valid Bangladesh mobile number!");
    return;
  }
  if (savedNumbers.includes(num)) {
    alert("Number already added!");
    return;
  }
  savedNumbers.push(num);
  newNumberEl.value = "";
  localStorage.setItem("aminul_multi_numbers", JSON.stringify(savedNumbers));
  renderNumberList();
  addLog("+ ADDED: " + num, "#38bdf8");
}

function removeNumber(num) {
  if (running) return;
  savedNumbers = savedNumbers.filter(n => n !== num);
  localStorage.setItem("aminul_multi_numbers", JSON.stringify(savedNumbers));
  renderNumberList();
  addLog("- REMOVED: " + num, "#94a3b8");
}

function renderNumberList() {
  countBadge.textContent = savedNumbers.length;
  if (savedNumbers.length === 0) {
    numberListContainer.innerHTML = '<div class="log-empty">No numbers added yet</div>';
    return;
  }
  numberListContainer.innerHTML = "";
  savedNumbers.forEach(num => {
    const item = document.createElement("div");
    item.className = "number-item";
    item.innerHTML = '<span>📱 ' + num + '</span><button onclick="removeNumber(\'' + num + '\')">Delete</button>';
    numberListContainer.appendChild(item);
  });
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
  if (currentMode === "single") {
    const num = numberEl.value.trim();
    if (!isValid(num)) return;

    checks++;
    checksEl.textContent = checks;

    const apiUrl = "/api/check?number=" + encodeURIComponent(num);
    setStatus("CHECKING #" + checks + "...", "#38bdf8");
    timerEl.style.color = "#fbbf24";

    try {
      const res = await fetch(apiUrl);
      const result = await res.json();
      if (result.success) {
        addLog("✔ [" + num + "] CHECK #" + checks + " SENT", "#22c55e");
        setStatus("CHECK #" + checks + " DONE", "#22c55e");
      } else {
        throw new Error(result.error || 'Failed');
      }
    } catch (err) {
      addLog("✖ [" + num + "] FAILED", "#ef4444");
      setStatus("CHECK #" + checks + " FAILED", "#ef4444");
    }
  } else {
    // Multi Mode
    if (savedNumbers.length === 0) {
      addLog("⚠ NO NUMBERS IN LIST", "#fbbf24");
      return;
    }

    checks++;
    checksEl.textContent = checks;
    setStatus("CHECKING BATCH #" + checks + "...", "#38bdf8");
    timerEl.style.color = "#fbbf24";

    for (let i = 0; i < savedNumbers.length; i++) {
      const num = savedNumbers[i];
      const apiUrl = "/api/check?number=" + encodeURIComponent(num);
      try {
        const res = await fetch(apiUrl);
        const result = await res.json();
        if (result.success) {
          addLog("✔ [" + num + "] SENT", "#22c55e");
        } else {
          addLog("✖ [" + num + "] FAILED", "#ef4444");
        }
      } catch (err) {
        addLog("✖ [" + num + "] FAILED", "#ef4444");
      }
      await new Promise(r => setTimeout(r, 400));
    }
    setStatus("BATCH #" + checks + " COMPLETED", "#22c55e");
  }

  setTimeout(() => {
    timerEl.style.color = "#38bdf8";
    if (running) setStatus("AUTO CHECK ON • EVERY 60s", "#22c55e");
  }, 1200);
}

/* ================= CONTROLS ================= */
function startTimer() {
  if (running) return;

  if (currentMode === "single") {
    if (!isValid(numberEl.value)) {
      alert("Please enter a valid Bangladesh mobile number!");
      return;
    }
    localStorage.setItem("aminul_number", numberEl.value.trim());
  } else {
    if (savedNumbers.length === 0) {
      alert("Please add at least one mobile number to the list!");
      return;
    }
  }

  running   = true;
  checks    = 0;
  checksEl.textContent = "0";
  deadline  = Date.now() + INTERVAL_SEC * 1000;
  remaining = INTERVAL_SEC;
  render();

  setRunningUI(true);
  setStatus("AUTO CHECK ON • EVERY 60s", "#22c55e");
  addLog("▶ TIMER STARTED (" + (currentMode === "single" ? "Single" : savedNumbers.length + " Numbers") + ")", "#22c55e");

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
  if (currentMode === "single") {
    const num = numberEl.value.trim();
    if (!isValid(num)) {
      alert("Please enter a valid mobile number!");
      return;
    }
    window.open("https://nid.proo.one/sms.php?number=" + encodeURIComponent(num), "_blank");
    addLog("🌐 MANUAL OPEN (" + num + ")", "#38bdf8");
  } else {
    if (savedNumbers.length === 0) {
      alert("Please add numbers to the list first!");
      return;
    }
    savedNumbers.forEach(num => {
      window.open("https://nid.proo.one/sms.php?number=" + encodeURIComponent(num), "_blank");
    });
    addLog("🌐 OPENED " + savedNumbers.length + " URL(S)", "#38bdf8");
  }
}

/* ================= INIT ================= */
(function init() {
  const saved = localStorage.getItem("aminul_number");
  if (saved) numberEl.value = saved;

  const savedMulti = localStorage.getItem("aminul_multi_numbers");
  if (savedMulti) {
    try {
      savedNumbers = JSON.parse(savedMulti);
    } catch (e) {
      savedNumbers = [];
    }
  }

  numberEl.addEventListener("input", () => {
    numberEl.value = numberEl.value.replace(/\D/g, "").slice(0, 11);
  });

  if (newNumberEl) {
    newNumberEl.addEventListener("input", () => {
      newNumberEl.value = newNumberEl.value.replace(/\D/g, "").slice(0, 11);
    });
  }

  render();
  renderNumberList();
  setStatus("READY TO START", "#64748b");
})();

/* Make functions available for inline onclick handlers */
window.startTimer = startTimer;
window.stopTimer  = stopTimer;
window.resetTimer = resetTimer;
window.openURL    = openURL;
window.switchMode = switchMode;
window.addNumber  = addNumber;
window.removeNumber = removeNumber;

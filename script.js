// script.js
lucide.createIcons();

const dateInput = document.getElementById("date-input");
const countInput = document.getElementById("count-input");
const extInput = document.getElementById("ext-input");

const genBtn = document.getElementById("gen-btn");
const todayBtn = document.getElementById("today-btn");
const clearBtn = document.getElementById("clear-btn");

const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");

const resultCard = document.getElementById("result-card");
const resultList = document.getElementById("result-list"); // <pre>
const hint = document.getElementById("hint");
const lineCopyIndicator = document.getElementById("line-copy-indicator");

let currentLines = []; // 生成した行を保持

// ===== helpers =====
function pad(num, width) {
  const s = String(num);
  return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

function yyyymmddFromDateValue(dateValue) {
  // dateValue: "YYYY-MM-DD"
  if (!dateValue) return "";
  const [y, m, d] = dateValue.split("-");
  if (!y || !m || !d) return "";
  return `${y}${m}${d}`;
}

function inferIndexWidth(count) {
  // 1..9 => 1, 1..99 => 2, 1..999 => 3, 1..9999 => 4
  const n = Math.max(1, Math.min(9999, Number(count) || 1));
  return String(n).length;
}

function emphasizeResult() {
  resultCard.classList.add("border-blue-300", "bg-blue-50/30");
  setTimeout(() => {
    resultCard.classList.remove("border-blue-300", "bg-blue-50/30");
  }, 250);
}

function setHint(text) {
  hint.textContent = text || "";
}

function setLineIndicator(text) {
  lineCopyIndicator.textContent = text || "";
}

// 100行程度なら span 100個は全然OK。
// イベントは親に1つだけ（委任）なので軽いです。
function renderLines(lines) {
  if (!lines.length) {
    resultList.innerHTML = "";
    return;
  }
  resultList.innerHTML = lines
    .map((line, idx) => {
      // hover で視認、クリック対象を明確にする
      return `
        <span
          data-idx="${idx}"
          class="block px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          title="クリックでこの1行をコピー"
        >${escapeHtml(line)}</span>
      `;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clampCount(v) {
  let count = Number(v);
  if (!Number.isFinite(count)) count = 100;
  count = Math.floor(count);
  count = Math.max(1, Math.min(9999, count));
  return count;
}

// ===== main =====
function generateList() {
  const ymd = yyyymmddFromDateValue(dateInput.value);

  const count = clampCount(countInput.value);
  countInput.value = String(count);

  const ext = (extInput.value || "png").replace(".", "").toLowerCase();

  if (!ymd) {
    currentLines = [];
    renderLines(currentLines);
    setHint("まず日付を入力してください。");
    setLineIndicator("");
    return;
  }

  const width = Math.max(3, inferIndexWidth(count)); // 基本は001形式
  currentLines = Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return `${ymd}_${pad(n, width)}.${ext}`;
  });

  renderLines(currentLines);
  setHint(`生成：${count}件（行クリックで1行コピー / ボタンで全文コピー）`);
  setLineIndicator("");
  emphasizeResult();
}

async function copyAll() {
  if (!currentLines.length) return;

  try {
    await navigator.clipboard.writeText(currentLines.join("\n"));
    const original = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i data-lucide="check" class="text-green-400"></i> コピーしました！';
    lucide.createIcons();
    setTimeout(() => {
      copyBtn.innerHTML = original;
      lucide.createIcons();
    }, 1300);
  } catch (e) {
    console.error("Copy failed", e);
  }
}

async function copyOneLine(text, el) {
  try {
    await navigator.clipboard.writeText(text);

    // 行の視覚フィードバック（ミスった？を減らす）
    el.classList.add("line-flash");
    setLineIndicator("コピーしました ✅");
    setTimeout(() => {
      el.classList.remove("line-flash");
      setLineIndicator("");
    }, 450);
  } catch (e) {
    console.error("Copy failed", e);
  }
}

function clearAll() {
  if ((dateInput.value || currentLines.length) && confirm("内容をクリアしますか？")) {
    dateInput.value = "";
    currentLines = [];
    renderLines(currentLines);
    setHint("");
    setLineIndicator("");
  }
}

function setToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1, 2);
  const d = pad(now.getDate(), 2);
  dateInput.value = `${y}-${m}-${d}`;
  generateList();
}

function downloadTxt() {
  if (!currentLines.length) return;

  const ymd = yyyymmddFromDateValue(dateInput.value) || "sequence";
  const text = currentLines.join("\n");

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${ymd}_filenames.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);

  const original = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '<i data-lucide="check" class="text-green-400"></i> 作成しました';
  lucide.createIcons();
  setTimeout(() => {
    downloadBtn.innerHTML = original;
    lucide.createIcons();
  }, 1200);
}

// ===== events =====
genBtn.addEventListener("click", generateList);
todayBtn.addEventListener("click", setToday);
clearBtn.addEventListener("click", clearAll);
copyBtn.addEventListener("click", copyAll);
downloadBtn.addEventListener("click", downloadTxt);

// 親にだけイベントを付ける（軽い＆ミスりにくい）
resultList.addEventListener("click", (e) => {
  const target = e.target.closest("[data-idx]");
  if (!target) return;

  const idx = Number(target.dataset.idx);
  const line = currentLines[idx];
  if (!line) return;

  copyOneLine(line, target);
});

// オート生成（邪魔なら消してOK）
dateInput.addEventListener("input", generateList);
countInput.addEventListener("input", generateList);
extInput.addEventListener("change", generateList);

// 初期メッセージ
setHint("日付を入れると連番が出ます。行クリックで1行コピーできます。");

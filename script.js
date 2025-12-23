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

const resultOutput = document.getElementById("result-output");
const resultCard = document.getElementById("result-card");
const hint = document.getElementById("hint");

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
  }, 300);
}

function setHint(text) {
  hint.textContent = text || "";
}

// ===== main =====
function generateList() {
  const dateValue = dateInput.value;
  const ymd = yyyymmddFromDateValue(dateValue);

  let count = Number(countInput.value);
  if (!Number.isFinite(count)) count = 100;
  count = Math.max(1, Math.min(9999, Math.floor(count)));
  countInput.value = String(count);

  const ext = (extInput.value || "png").replace(".", "").toLowerCase();

  if (!ymd) {
    resultOutput.value = "";
    setHint("まず日付を入力してください。");
    return;
  }

  const width = Math.max(3, inferIndexWidth(count)); // 基本は001形式を守る
  const lines = [];
  for (let i = 1; i <= count; i++) {
    lines.push(`${ymd}_${pad(i, width)}.${ext}`);
  }

  resultOutput.value = lines.join("\n");
  setHint(`${ymd}_${pad(1, width)}.${ext} 〜 ${ymd}_${pad(count, width)}.${ext}（${count}件）`);
  emphasizeResult();
}

async function copyResult() {
  const text = resultOutput.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    const original = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i data-lucide="check" class="text-green-400"></i> コピーしました！';
    lucide.createIcons();
    setTimeout(() => {
      copyBtn.innerHTML = original;
      lucide.createIcons();
    }, 1400);
  } catch (e) {
    console.error("Copy failed", e);
  }
}

function clearAll() {
  if ((dateInput.value || resultOutput.value) && confirm("内容をクリアしますか？")) {
    dateInput.value = "";
    resultOutput.value = "";
    setHint("");
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
  const text = resultOutput.value;
  if (!text) return;

  const ymd = yyyymmddFromDateValue(dateInput.value) || "sequence";
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${ymd}_filenames.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);

  // 軽いフィードバック
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
copyBtn.addEventListener("click", copyResult);
downloadBtn.addEventListener("click", downloadTxt);
todayBtn.addEventListener("click", setToday);
clearBtn.addEventListener("click", clearAll);

// オート生成（邪魔なら外してOK）
dateInput.addEventListener("input", generateList);
countInput.addEventListener("input", generateList);
extInput.addEventListener("change", generateList);

// 初期ヒント
setHint("日付を入れると自動で連番が出ます。");

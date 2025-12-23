// script.js
lucide.createIcons();

// Elements
const dateInput = document.getElementById("date-input");
const countInput = document.getElementById("count-input");
// extInput 削除

const genBtn = document.getElementById("gen-btn");
const todayBtn = document.getElementById("today-btn");
const clearBtn = document.getElementById("clear-btn");

const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");

const resultList = document.getElementById("result-list");
const listInfo = document.getElementById("list-info");
const hintText = document.getElementById("hint-text");
const emptyState = document.getElementById("empty-state");

let currentLines = [];

// ===== Helpers =====
function pad(num, width) {
  const s = String(num);
  return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

function yyyymmddFromDateValue(dateValue) {
  if (!dateValue) return "";
  const [y, m, d] = dateValue.split("-");
  return (y && m && d) ? `${y}${m}${d}` : "";
}

function showHint(msg, isError = false) {
  hintText.textContent = msg;
  hintText.className = `text-[11px] text-right h-4 pr-1 transition-opacity duration-300 ${isError ? 'text-red-400 font-bold' : 'text-slate-400'}`;
  hintText.style.opacity = '1';
  
  if (hintText.timeout) clearTimeout(hintText.timeout);
  hintText.timeout = setTimeout(() => {
    hintText.style.opacity = '0';
  }, 3000);
}

// ===== Rendering =====
function renderLines(lines) {
  currentLines = lines;
  resultList.innerHTML = "";

  if (!lines.length) {
    emptyState.classList.remove("hidden");
    listInfo.textContent = "";
    return;
  }

  emptyState.classList.add("hidden");
  listInfo.textContent = `${lines.length} items`;

  const fragment = document.createDocumentFragment();

  lines.forEach((line, idx) => {
    const div = document.createElement("div");
    div.className = "group flex items-center justify-between px-3 py-0.5 rounded-lg hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-100 cursor-pointer transition-all select-none";
    div.dataset.idx = idx;
    
    div.innerHTML = `
      <span class="font-mono text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors truncate">${line}</span>
      <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
         <span class="text-[10px] font-bold text-slate-300 uppercase tracking-wider status-text">Copy</span>
         <i data-lucide="copy" class="w-3.5 h-3.5 text-slate-400 icon-target"></i>
      </div>
    `;

    div.addEventListener("click", () => handleLineClick(line, div));
    fragment.appendChild(div);
  });

  resultList.appendChild(fragment);
  lucide.createIcons();
}

// ===== Core Logic =====
function generateList() {
  const ymd = yyyymmddFromDateValue(dateInput.value);
  let count = Number(countInput.value);
  
  if (!Number.isFinite(count) || count < 1) count = 100;
  if (count > 9999) count = 9999;
  
  const width = Math.max(3, String(count).length);

  if (!ymd) {
    renderLines([]);
    return;
  }

  // 拡張子なしで生成
  const newLines = Array.from({ length: count }, (_, i) => {
    return `${ymd}_${pad(i + 1, width)}`; 
  });

  renderLines(newLines);
  
  resultList.animate([
    { opacity: 0.5, transform: 'translateY(5px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 250, easing: 'ease-out' });
}

// ===== Actions =====
async function handleLineClick(text, element) {
  try {
    await navigator.clipboard.writeText(text);
    
    const icon = element.querySelector(".icon-target");
    
    element.classList.add("bg-blue-50/80", "ring-1", "ring-blue-100");
    
    if(icon) {
      icon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>'; 
      icon.parentElement.innerHTML = '<span class="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Copied!</span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    }

    setTimeout(() => {
        element.classList.remove("bg-blue-50/80", "ring-1", "ring-blue-100");
        const statusDiv = element.querySelector("div");
        if(statusDiv) {
            statusDiv.innerHTML = `
                <span class="text-[10px] font-bold text-slate-300 uppercase tracking-wider status-text">Copy</span>
                <i data-lucide="copy" class="w-3.5 h-3.5 text-slate-400 icon-target"></i>
            `;
            lucide.createIcons();
        }
    }, 1000);

  } catch (err) {
    console.error("Copy failed", err);
    showHint("コピーに失敗しました", true);
  }
}

async function copyAll() {
  if (!currentLines.length) {
    showHint("コピーする内容がありません", true);
    return;
  }
  
  try {
    await navigator.clipboard.writeText(currentLines.join("\n"));
    
    const originalContent = copyBtn.innerHTML;
    copyBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i><span>Copied!</span>`;
    copyBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");
    copyBtn.classList.add("bg-emerald-500", "hover:bg-emerald-600");
    lucide.createIcons();
    
    showHint("クリップボードにコピーしました！");

    setTimeout(() => {
      copyBtn.innerHTML = originalContent;
      copyBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
      copyBtn.classList.remove("bg-emerald-500", "hover:bg-emerald-600");
      lucide.createIcons();
    }, 2000);

  } catch (err) {
    showHint("エラーが発生しました", true);
  }
}

function setToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1, 2);
  const d = pad(now.getDate(), 2);
  dateInput.value = `${y}-${m}-${d}`;
  generateList();
  showHint("今日の日付をセットしました");
}

function clearAll() {
  dateInput.value = "";
  countInput.value = "100";
  renderLines([]);
  showHint("リセットしました");
}

function downloadTxt() {
  if (!currentLines.length) return;
  
  const ymd = yyyymmddFromDateValue(dateInput.value) || "sequence";
  const blob = new Blob([currentLines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ymd}_list.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showHint("ファイルをダウンロードしました");
}

// ===== Events =====
genBtn.addEventListener("click", () => {
    generateList();
    if(currentLines.length) showHint("生成完了！");
});
todayBtn.addEventListener("click", setToday);
clearBtn.addEventListener("click", clearAll);
copyBtn.addEventListener("click", copyAll);
downloadBtn.addEventListener("click", downloadTxt);

// Realtime updates
dateInput.addEventListener("input", generateList);
countInput.addEventListener("input", generateList);
// extInput 関連イベント削除

// Init
lucide.createIcons();
renderLines([]);
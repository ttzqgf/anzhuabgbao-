const STORAGE_KEY = "qing-ledger-state-v1";

const categories = {
  expense: ["餐饮", "交通", "购物", "居家", "娱乐", "医疗", "学习", "其他"],
  income: ["工资", "奖金", "副业", "理财", "红包", "其他"],
};

const categoryGlyphs = {
  餐饮: "食",
  交通: "行",
  购物: "购",
  居家: "家",
  娱乐: "乐",
  医疗: "医",
  学习: "学",
  工资: "薪",
  奖金: "奖",
  副业: "副",
  理财: "财",
  红包: "礼",
  其他: "其",
};

const demoRecords = [
  { id: crypto.randomUUID(), type: "expense", amount: 36.5, category: "餐饮", note: "午餐", date: todayISO() },
  { id: crypto.randomUUID(), type: "expense", amount: 12, category: "交通", note: "地铁", date: todayISO() },
  { id: crypto.randomUUID(), type: "income", amount: 5200, category: "工资", note: "本月工资", date: todayISO() },
  { id: crypto.randomUUID(), type: "expense", amount: 218, category: "购物", note: "日用品", date: shiftDateISO(-2) },
];

let state = loadState();
let entryType = "expense";

const els = {
  currentMonth: document.querySelector("#currentMonth"),
  netAmount: document.querySelector("#netAmount"),
  incomeAmount: document.querySelector("#incomeAmount"),
  expenseAmount: document.querySelector("#expenseAmount"),
  budgetLeft: document.querySelector("#budgetLeft"),
  budgetInput: document.querySelector("#budgetInput"),
  budgetProgress: document.querySelector("#budgetProgress"),
  budgetHint: document.querySelector("#budgetHint"),
  categoryInput: document.querySelector("#categoryInput"),
  amountInput: document.querySelector("#amountInput"),
  dateInput: document.querySelector("#dateInput"),
  noteInput: document.querySelector("#noteInput"),
  entryForm: document.querySelector("#entryForm"),
  recordsList: document.querySelector("#recordsList"),
  recordTemplate: document.querySelector("#recordTemplate"),
  categoryBars: document.querySelector("#categoryBars"),
  topCategory: document.querySelector("#topCategory"),
  clearRecords: document.querySelector("#clearRecords"),
  resetDemo: document.querySelector("#resetDemo"),
  typeButtons: document.querySelectorAll("[data-type]"),
};

init();

function init() {
  els.dateInput.value = todayISO();
  els.budgetInput.value = state.budget;
  renderCategoryOptions();
  render();
  bindEvents();
}

function bindEvents() {
  els.typeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      entryType = button.dataset.type;
      els.typeButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderCategoryOptions();
    });
  });

  els.entryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const amount = Number(els.amountInput.value);
    if (!Number.isFinite(amount) || amount <= 0) return;

    state.records.unshift({
      id: crypto.randomUUID(),
      type: entryType,
      amount: Math.round(amount * 100) / 100,
      category: els.categoryInput.value,
      note: els.noteInput.value.trim(),
      date: els.dateInput.value || todayISO(),
    });

    els.amountInput.value = "";
    els.noteInput.value = "";
    persist();
    render();
  });

  els.budgetInput.addEventListener("input", () => {
    state.budget = Math.max(0, Number(els.budgetInput.value) || 0);
    persist();
    render();
  });

  els.clearRecords.addEventListener("click", () => {
    if (!state.records.length) return;
    state.records = [];
    persist();
    render();
  });

  els.resetDemo.addEventListener("click", () => {
    state = { budget: 4200, records: [...demoRecords] };
    els.budgetInput.value = state.budget;
    persist();
    render();
  });
}

function renderCategoryOptions() {
  els.categoryInput.innerHTML = categories[entryType]
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");
}

function render() {
  const monthKey = todayISO().slice(0, 7);
  const monthRecords = state.records.filter((record) => record.date.startsWith(monthKey));
  const income = sumByType(monthRecords, "income");
  const expense = sumByType(monthRecords, "expense");
  const net = income - expense;
  const left = state.budget - expense;
  const used = state.budget > 0 ? Math.min(100, Math.round((expense / state.budget) * 100)) : 0;

  els.currentMonth.textContent = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`;
  els.netAmount.textContent = formatMoney(net);
  els.incomeAmount.textContent = formatMoney(income);
  els.expenseAmount.textContent = formatMoney(expense);
  els.budgetLeft.textContent = formatMoney(left);
  els.budgetProgress.style.width = `${used}%`;
  els.budgetProgress.style.background = used >= 90 ? "#bd4b4b" : "";
  els.budgetHint.textContent = state.budget > 0 ? `已使用 ${used}%` : "设置预算后显示进度";

  renderCategoryBars(monthRecords, expense);
  renderRecords();
}

function renderCategoryBars(monthRecords, totalExpense) {
  const totals = monthRecords
    .filter((record) => record.type === "expense")
    .reduce((acc, record) => {
      acc[record.category] = (acc[record.category] || 0) + record.amount;
      return acc;
    }, {});

  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  els.topCategory.textContent = rows.length ? `最高：${rows[0][0]}` : "暂无";

  if (!rows.length) {
    els.categoryBars.innerHTML = `<p class="empty-state">还没有本月支出</p>`;
    return;
  }

  els.categoryBars.innerHTML = rows
    .slice(0, 5)
    .map(([category, amount]) => {
      const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return `
        <div class="category-row">
          <div class="category-meta">
            <span>${category}</span>
            <strong>${formatMoney(amount)} · ${percent}%</strong>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderRecords() {
  els.recordsList.innerHTML = "";

  if (!state.records.length) {
    els.recordsList.innerHTML = `<p class="empty-state">还没有记录，先记一笔吧</p>`;
    return;
  }

  state.records.slice(0, 30).forEach((record) => {
    const node = els.recordTemplate.content.firstElementChild.cloneNode(true);
    const sign = record.type === "income" ? "+" : "-";
    const amountClass = record.type === "income" ? "var(--income)" : "var(--expense)";

    node.querySelector(".record-icon").textContent = categoryGlyphs[record.category] || "记";
    node.querySelector("h3").textContent = record.category;
    node.querySelector("p").textContent = [formatDisplayDate(record.date), record.note].filter(Boolean).join(" · ");
    node.querySelector("strong").textContent = `${sign}${formatMoney(record.amount)}`;
    node.querySelector("strong").style.color = amountClass;
    node.querySelector("button").addEventListener("click", () => {
      state.records = state.records.filter((item) => item.id !== record.id);
      persist();
      render();
    });
    els.recordsList.appendChild(node);
  });
}

function sumByType(records, type) {
  return records.filter((record) => record.type === type).reduce((sum, record) => sum + record.amount, 0);
}

function formatMoney(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}¥${Math.abs(value).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDisplayDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.records)) return saved;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { budget: 4200, records: [...demoRecords] };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayISO() {
  return toLocalISODate(new Date());
}

function shiftDateISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalISODate(date);
}

function toLocalISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

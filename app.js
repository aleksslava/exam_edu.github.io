const tg = window.Telegram?.WebApp;

try {
  tg?.ready();
  tg?.expand();
} catch (_) {
  // Открыто не из Telegram — это ок для теста в браузере
}

const QUESTIONS = window.QUESTIONS || [];
if (!Array.isArray(QUESTIONS) || QUESTIONS.length !== 4) {
  console.error("QUESTIONS должен быть массивом из 4 вопросов");
}

let index = 0;

// answers[qId][fieldId] = number
const answers = Object.fromEntries(QUESTIONS.map(q => [q.id, {}]));

const elProgress = document.getElementById("progress");
const elTaskText = document.getElementById("taskText");
const elTaskImage = document.getElementById("taskImage");
const elQuestionText = document.getElementById("questionText");
const elFields = document.getElementById("fields");
const elNextBtn = document.getElementById("nextBtn");
const elHint = document.getElementById("hint");

function allFieldsValid(q) {
  return q.fields.every(f => Number.isFinite(answers[q.id][f.id]));
}

function buildFieldRow(q, f) {
  const row = document.createElement("div");
  row.className = "fieldRow";

  const label = document.createElement("div");
  label.className = "fieldLabel";
  label.textContent = `${f.label} —`;

  const input = document.createElement("input");
  input.className = "fieldInput";
  input.type = "number";
  input.inputMode = "numeric";
  input.placeholder = "0";

  const current = answers[q.id][f.id];
  input.value = Number.isFinite(current) ? String(current) : "";

  input.addEventListener("input", () => {
    const raw = input.value.trim();

    if (raw === "") {
      delete answers[q.id][f.id];
    } else {
      const n = Number(raw);
      if (Number.isFinite(n)) {
        answers[q.id][f.id] = n;
      } else {
        delete answers[q.id][f.id];
      }
    }

    updateButtonState();
  });

  row.appendChild(label);
  row.appendChild(input);
  return row;
}

function updateButtonState() {
  const q = QUESTIONS[index];
  const ok = allFieldsValid(q);
  elNextBtn.disabled = !ok;

  elHint.textContent = ok ? "" : "Заполните все поля цифрами, чтобы продолжить.";
}

function render() {
  const q = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;

  elProgress.textContent = `Страница ${index + 1} / ${QUESTIONS.length}`;

  elTaskText.textContent = q.taskText;
  elTaskImage.src = q.image;

  elQuestionText.textContent = q.questionText;

  elFields.innerHTML = "";
  q.fields.forEach(f => elFields.appendChild(buildFieldRow(q, f)));

  elNextBtn.textContent = isLast ? "Отправить ответы" : "Далее";

  updateButtonState();

  // Чтобы “страница” всегда начиналась сверху
  window.scrollTo({ top: 0, behavior: "instant" });
}

function nextOrSubmit() {
  const q = QUESTIONS[index];
  if (!allFieldsValid(q)) return;

  const isLast = index === QUESTIONS.length - 1;

  if (!isLast) {
    index += 1;
    render();
    return;
  }

  // Финальная отправка
  const payload = {
    answers,
    submittedAt: new Date().toISOString(),
    // initDataUnsafe может быть полезен боту (user id и т.д.), но не доверяй без проверки initData на сервере
    user: tg?.initDataUnsafe?.user ?? null,
  };

  if (tg?.sendData) {
    tg.sendData(JSON.stringify(payload));
    elHint.textContent = "Ответы отправлены ✅";
    // Можно закрыть окно
    setTimeout(() => tg.close?.(), 200);
  } else {
    // Тест в обычном браузере
    console.log("Payload:", payload);
    alert("Открыто не в Telegram. Смотри payload в консоли.");
  }
}

elNextBtn.addEventListener("click", nextOrSubmit);

render();

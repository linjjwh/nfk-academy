document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "https://nfk-academy-production.up.railway.app";
  const BASE = "/nfk-academy";

  const tg = window.Telegram?.WebApp;
  let username = tg?.initDataUnsafe?.user?.username;
  if (!username) {
  username = "id_" + tg?.initDataUnsafe?.user?.id;
}
  const params = new URLSearchParams(window.location.search);

  console.log("URL:", window.location.href);
console.log("params.get('num'):", params.get("num"));
console.log("lessonNum после parse:", parseInt(params.get("num")));


  const lessonNum = params.get("num") ? parseInt(params.get("num")) : 1;

  const lessonTitle = document.getElementById("lesson-title");
  const lessonBody = document.getElementById("lesson-body");
  const nextBtn = document.getElementById("next-btn");
  const backBtn = document.getElementById("back-btn");
  const topProgressFill = document.getElementById("top-progress-bar-fill");
  const topProgressPercent = document.getElementById("top-progress-percent");

  // --- Загружаем урок из API ---
  let lesson = null;
  try {
    const res = await fetch(`${API_BASE}/lessons/${lessonNum}`);
    if (res.ok) {
      const data = await res.json();
      lesson = data.lesson || data;   // <-- достаём сам урок
      console.log("PARSED LESSON:", lesson);
    }

  } catch (err) {
    console.warn("Сервер недоступен, используем локальные данные.", err);
  }

// --- Если сервер не ответил — используем локальный lessonsData.json ---
if (!lesson) {
  try {
    const localRes = await fetch(`${BASE}/webapp/lessonsData.json`);
    if (localRes.ok) {
      const localData = await localRes.json();
      lesson = localData.find(l => parseInt(l.id) === lessonNum);
      console.log("Урок загружен локально:", lesson);
    } else {
      console.error("Не удалось загрузить локальный lessonsData.json:", localRes.status);
    }
  } catch (err) {
    console.error("Ошибка при загрузке локальных данных:", err);
  }
}

  if (!lesson || !lesson.sections) {
    lessonTitle.textContent = "Ошибка: урок не найден.";
    lessonBody.innerHTML = "<p>Не удалось загрузить данные урока.</p>";
    return;
  }

  lessonTitle.textContent = lesson.title || `Урок ${lessonNum}`;
  lessonBody.innerHTML = "";

  // Рендерим секции
  lesson.sections.forEach(section => {
    // общий контейнер секции
    const sec = document.createElement("div");
    sec.classList.add("lesson-section", "fade-in");

    // заголовок секции (если есть)
    if (section.heading) {
      const h = document.createElement("h2");
      h.textContent = section.heading;
      sec.appendChild(h);
      sec.appendChild(h);
    }

    /* ===== ТИПЫ СЕКЦИЙ ===== */
    if (section.type === "text") {
      section.content.forEach(pText => {
        const p = document.createElement("p");
        p.textContent = pText;
        sec.appendChild(p);
      });
    }

    if (section.type === "list") {
      const ul = document.createElement("ul");
      section.content.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      sec.appendChild(ul);
    }

    if (section.type === "list-numbered" || section.type === "list-number") {
      const ol = document.createElement("ol");
      section.content.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        ol.appendChild(li);
      });
      sec.appendChild(ol);
    }

    if (section.type === "questions") {
      const wrap = document.createElement("div");
      wrap.classList.add("questions-block");
      section.content.forEach((q, idx) => {
        const p = document.createElement("p");
        p.textContent = `${idx + 1}. ${q}`;
        wrap.appendChild(p);
      });
      sec.appendChild(wrap);
    }

    /* ===== ИНТЕРАКТИВНЫЕ ТИПЫ ===== */

// 1) Flipcards — поддерживаем имена section.type: "flipcards" или "flip-card"
    if (section.type === "flipcards" || section.type === "flip-cards" || section.type === "flip-card" || section.type === "flipcard") {
      const containerWrap = document.createElement("div");
      containerWrap.classList.add("flipcard-wrap");

      // подсказка
      const hint = document.createElement("p");
      hint.classList.add("flipcard-hint");
      hint.textContent = "Нажми на карточку, чтобы увидеть определение 👇";
      containerWrap.appendChild(hint);

      const container = document.createElement("div");
      container.classList.add("flipcard-container");

      // создаём карточки
      (section.content || []).forEach(card => {
        const cardWrap = document.createElement("div");
        cardWrap.classList.add("flipcard");
        cardWrap.setAttribute("tabindex", "0");
        cardWrap.setAttribute("role", "button");
        cardWrap.setAttribute("aria-pressed", "false");

        const inner = document.createElement("div");
        inner.classList.add("flipcard-inner");

        const front = document.createElement("div");
        front.classList.add("flipcard-front");
        front.innerHTML = card.front || "";

        const back = document.createElement("div");
        back.classList.add("flipcard-back");
        back.innerHTML = card.back || "";

        inner.appendChild(front);
        inner.appendChild(back);
        cardWrap.appendChild(inner);
        container.appendChild(cardWrap);

        // при инициализации — задаём высоту под front
        inner.style.height = front.scrollHeight + "px";

        // функция переворота с динамической высотой
        const toggleFlip = () => {
          cardWrap.classList.toggle("flip");
          cardWrap.setAttribute("aria-pressed", cardWrap.classList.contains("flip") ? "true" : "false");

          if (cardWrap.classList.contains("flip")) {
            inner.style.height = back.scrollHeight + "px";
          } else {
            inner.style.height = front.scrollHeight + "px";
          }
        };

        // клик / клавиатура
        cardWrap.addEventListener("click", toggleFlip);
        cardWrap.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleFlip();
          }
        });
      });

      containerWrap.appendChild(container);
      sec.appendChild(containerWrap);

      // после рендера: можно при желании сделать одинаковую высоту фронтов
      requestAnimationFrame(() => {
        const allInner = container.querySelectorAll(".flipcard-inner");
        let maxFrontHeight = 0;

        allInner.forEach(inner => {
          const front = inner.querySelector(".flipcard-front");
          if (front.scrollHeight > maxFrontHeight) maxFrontHeight = front.scrollHeight;
        });

        allInner.forEach(inner => {
          // только фронт задаём одинаковым — back остаётся динамическим
          inner.style.height = maxFrontHeight + "px";
        });
      });
    }


    // 2) Choice (мини-задачка)
    if (section.type === "choice" || section.type === "choice-scenario") {
      const qWrap = document.createElement("div");
      qWrap.classList.add("quiz-block");

      const qText = document.createElement("div");
      qText.classList.add("quiz-question");
      qText.textContent = section.content?.question || "";
      qWrap.appendChild(qText);

      const optsWrap = document.createElement("div");
      optsWrap.classList.add("quiz-options");

      (section.content?.options || []).forEach(opt => {
        const btn = document.createElement("button");
        btn.classList.add("quiz-btn");
        btn.type = "button";
        btn.textContent = opt.text || opt;

        btn.addEventListener("click", () => {
          // убираем предыдущие стили
          optsWrap.querySelectorAll("button").forEach(b => {
            b.classList.remove("selected", "correct", "wrong");
            b.disabled = true;
          });

          // подсветка выбранного
          btn.classList.add("selected");

          // определяем исход (если есть correct)
          if (opt.correct === true) {
            btn.classList.add("correct");
          } else if (opt.correct === false) {
            btn.classList.add("wrong");
          }

          // комментарий
          let feedback = qWrap.querySelector(".quiz-explanation");
          if (!feedback) {
            feedback = document.createElement("div");
            feedback.classList.add("quiz-explanation");
            qWrap.appendChild(feedback);
          }
          feedback.innerHTML = `<p>${opt.feedback || " "}</p>`;
          feedback.style.display = "block";
        });

        optsWrap.appendChild(btn);
      });

      qWrap.appendChild(optsWrap);
      sec.appendChild(qWrap);
    }

    // 3) Quiz — section.type: "quiz" или "quiz-single"
    if (section.type === "quiz" || section.type === "quiz-single") {
      const quizContainer = document.createElement("div");
      quizContainer.classList.add("quiz-container");

      const contentArray = Array.isArray(section.content) ? section.content : [section.content];

      contentArray.forEach((qObj, qIndex) => {
        const qBlock = document.createElement("div");
        qBlock.classList.add("quiz-block-item");
        qBlock.style.marginBottom = "18px";

        const qText = document.createElement("div");
        qText.classList.add("quiz-question");
        qText.textContent = `${qIndex + 1}. ${qObj.question || qObj.title || ""}`;
        qBlock.appendChild(qText);

        const optsWrap = document.createElement("div");
        optsWrap.classList.add("quiz-options");

        (qObj.options || []).forEach((optText, i) => {
          const btn = document.createElement("button");
          btn.classList.add("quiz-btn");
          btn.type = "button";
          btn.textContent = typeof optText === "string" ? optText : optText.text;
          btn.dataset.index = i;

          btn.addEventListener("click", () => {
            optsWrap.querySelectorAll("button").forEach(b => b.disabled = true);

            if (qObj.correct === null || typeof qObj.correct === "undefined") {
              btn.classList.add("neutral");
            } else {
              const correctIndex = Number(qObj.correct);
              if (i === correctIndex) {
                btn.classList.add("correct");
              } else {
                btn.classList.add("wrong");
                const correctBtn = optsWrap.querySelector(`button[data-index="${correctIndex}"]`);
                if (correctBtn) correctBtn.classList.add("correct");
              }
            }

            const expl = document.createElement("div");
            expl.classList.add("quiz-explanation");
            expl.textContent = qObj.explanation || "";
            expl.style.display = "block";
            qBlock.appendChild(expl);
          });

          optsWrap.appendChild(btn);
        });

        qBlock.appendChild(optsWrap);
        quizContainer.appendChild(qBlock);
      });

      sec.appendChild(quizContainer);
    }

// 4) Drag & Drop (соединение пар) — улучшенная версия с поддержкой клика и drag
if (section.type === "drag-drop") {
  const wrapper = document.createElement("div");
  wrapper.classList.add("dragdrop-wrapper");

  const dragWrap = document.createElement("div");
  dragWrap.classList.add("dragdrop-container");

  wrapper.appendChild(dragWrap);
  sec.appendChild(wrapper); // ✅ сюда вставляем wrapper, не dragWrap!

  const instruction = document.createElement("p");
  instruction.classList.add("dragdrop-instruction");
  instruction.textContent = section.content?.instruction || "Соедини элементы:";
  dragWrap.appendChild(instruction);

  const setsWrap = document.createElement("div");
  setsWrap.classList.add("dragdrop-sets");
  setsWrap.style.justifyContent = "space-between";
  setsWrap.style.gap = "40px";

  const groupA = document.createElement("div");
  groupA.classList.add("dragdrop-group", "group-a");
  groupA.style.display = "flex";
  groupA.style.flexDirection = "column";
  groupA.style.gap = "10px";

  const groupB = document.createElement("div");
  groupB.classList.add("dragdrop-group", "group-b");
  groupB.style.display = "flex";
  groupB.style.flexDirection = "column";
  groupB.style.gap = "10px";

  // --- Блоки A ---
  (section.content?.groupA || []).forEach(item => {
    const el = document.createElement("div");
    el.classList.add("drag-item");
    el.draggable = true;
    el.dataset.id = item.id;

    const textSpan = document.createElement("span");
    textSpan.classList.add("drag-item-text");
    textSpan.textContent = item.text;

    el.appendChild(textSpan);
    groupA.appendChild(el);
  });

  // --- Блоки B ---
  (section.content?.groupB || []).forEach(item => {
    const el = document.createElement("div");
    el.classList.add("drop-target");
    el.dataset.id = item.id;
    el.dataset.currentMatches = 0;

    const title = document.createElement("div");
    title.classList.add("drop-title");
    title.textContent = item.text;
    el.appendChild(title);

    groupB.appendChild(el);
  });

  setsWrap.appendChild(groupA);
  setsWrap.appendChild(groupB);
  dragWrap.appendChild(setsWrap);

  /* ===== Логика Drag & Drop  ===== */
  let draggedItem = null;

  // dragstart / dragend — назначаем для текущих элементов (делегирование не нужно для drag)
  groupA.querySelectorAll(".drag-item").forEach(drag => {
    drag.addEventListener("dragstart", e => {
      draggedItem = drag;
      drag.classList.add("dragging");
      // помещаем id в dataTransfer (на случай)
      try { e.dataTransfer.setData("text/plain", drag.dataset.id); } catch (err) {}
    });
    drag.addEventListener("dragend", () => {
      drag.classList.remove("dragging");
      draggedItem = null;
    });
  });

  // drop зоны
  groupB.querySelectorAll(".drop-target").forEach(drop => {
    drop.addEventListener("dragover", e => {
      e.preventDefault();
      drop.classList.add("hover");
    });
    drop.addEventListener("dragleave", () => {
      drop.classList.remove("hover");
    });
    drop.addEventListener("drop", e => {
      e.preventDefault();
      drop.classList.remove("hover");
      if (!draggedItem) {
        // попытка прочитать из dataTransfer (на некоторых браузерах)
        const id = e.dataTransfer && e.dataTransfer.getData ? e.dataTransfer.getData("text/plain") : null;
        if (id) {
          const candidate = dragWrap.querySelector(`.drag-item[data-id="${id}"]`);
          if (candidate) handleMatch(candidate, drop);
        }
        return;
      }
      handleMatch(draggedItem, drop);
    });
  });

  /* ===== CLICK логика — делегирование (работает для перемещённых элементов тоже) =====
     Поведение: клик по .drag-item -> выделяем его (selected).
     Клик по .drop-target -> если есть selected -> пробуем match.
     Клик по пустой области groupA -> если есть selected -> возвращаем selected в groupA.
  */
  let selectedA = null;

  // Делегируем клики на весь компонент
  dragWrap.addEventListener("click", (e) => {
    const item = e.target.closest(".drag-item");
    if (item) {
      // игнорируем окончательно правильные блоки
      if (item.classList.contains("correct")) {
        // если хочешь — можно сделать сброс selection из правильного блока, но пока игнорируем
        return;
      }
      // переключаем выбор
      if (selectedA === item) {
        item.classList.remove("selected");
        selectedA = null;
      } else {
        // снимаем предыдущий
        const prev = dragWrap.querySelector(".drag-item.selected");
        if (prev) prev.classList.remove("selected");
        item.classList.add("selected");
        selectedA = item;
      }
      return;
    }

    const drop = e.target.closest(".drop-target");
    if (drop && selectedA) {
      handleMatch(selectedA, drop);
      if (selectedA) {
        selectedA.classList.remove("selected");
        selectedA = null;
      }
      return;
    }

    // клик по пустому месту внутри groupA — вернём выбранный элемент обратно
    const clickedInGroupA = e.target.closest(".dragdrop-group.group-a");
    if (clickedInGroupA && selectedA) {
      groupA.appendChild(selectedA);
      selectedA.classList.remove("selected");
      selectedA = null;
      return;
    }
  });

  /* ===== Вспомогательные функции: маркеры, и общая обработка (drag+click) ===== */
  function _ensureBadge(el) {
    let b = el.querySelector(".match-badge");
    if (!b) {
      b = document.createElement("span");
      b.className = "match-badge";
      // небольшой отступ
      b.style.marginLeft = "8px";
      b.style.fontWeight = "700";
      el.appendChild(b);
    }
    return b;
  }

  function setCorrect(el) {
    el.classList.remove("wrong");
    el.classList.add("correct");
    el.draggable = false;
    const badge = _ensureBadge(el);
    badge.textContent = "✅";
    badge.classList.remove("badge-wrong");
    badge.classList.add("badge-correct");
  }

  function setWrong(el) {
    // если уже правильный — ничего
    if (el.classList.contains("correct")) return;
    el.classList.remove("correct");
    el.classList.add("wrong");
    const badge = _ensureBadge(el);
    badge.textContent = "❗";
    badge.classList.remove("badge-correct");
    badge.classList.add("badge-wrong");

    // визуальный откат/анимация
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 600);
  }

  // Общая функция для сопоставления (используется и при drag, и при click)
  function handleMatch(aEl, bEl) {
    // Найдём пару в correctMatches
    const correctPair = (section.content?.correctMatches || []).find(
      m => m.a === aEl.dataset.id && m.b === bEl.dataset.id
    );

    // НЕ используем textContent += " ✅" — работаем через badge чтобы не дублировалось
    // Если элемент ещё в groupA (или где угодно) — просто appendChild переместит его
    // сохраняем ссылку на исходный контейнер, если понадобится
    const wasInDrop = aEl.parentElement && aEl.parentElement.classList.contains("drop-target");

    // move element to target (appendChild перемещает ноду)
    bEl.appendChild(aEl);

    if (correctPair) {
      // корректно — фиксируем
      setCorrect(aEl);

      // пометить drop как completed (опц)
      bEl.classList.add("completed");

      // увеличим счётчик (если нужно)
      try {
        bEl.dataset.currentMatches = String(Number(bEl.dataset.currentMatches || 0) + 1);
      } catch (err) {}
    } else {
      // неверно — показываем ❗ и оставляем возможность взаимодействовать
      setWrong(aEl);

      // оставляем draggable = true (можно перетаскивать дальше)
      aEl.draggable = true;
    }
  }

  // функция для повторной инициализации drag-обработчиков (можно вызывать при необходимости)
  function refreshDragHandlers() {
    groupA.querySelectorAll(".drag-item").forEach(drag => {
      if (drag._dragHandlersAttached) return;
      drag.addEventListener("dragstart", e => {
        draggedItem = drag;
        drag.classList.add("dragging");
        try { e.dataTransfer.setData("text/plain", drag.dataset.id); } catch (err) {}
      });
      drag.addEventListener("dragend", () => {
        drag.classList.remove("dragging");
        draggedItem = null;
      });
      drag._dragHandlersAttached = true;
    });
  }

  // вызовем один раз (если в дальнейшем добавляешь новые элементы — вызывай refreshDragHandlers())
  refreshDragHandlers();
} // конец drag-drop


    // 5) Step-by-step list with hint
    if (section.type === "expandable-list") {
      const listWrap = document.createElement("div");
      listWrap.classList.add("step-list-wrap");

      // подсказка
      const hint = document.createElement("p");
      hint.classList.add("step-hint");
      hint.textContent = "Нажимай на каждый пункт, чтобы увидеть продолжение 👇";
      listWrap.appendChild(hint);

      const stepList = document.createElement("div");
      stepList.classList.add("step-list");

      let after = null;
      if (section.afterText) {
        after = document.createElement("p");
        after.classList.add("step-after");
        after.textContent = section.afterText;
        after.style.display = "none"; // скрываем по дефолту
      }

      (section.content || []).forEach((text, i) => {
        const row = document.createElement("div");
        row.classList.add("step-item");

        // последний пункт финальный
        if (i === section.content.length - 1) row.classList.add("final-step");

        row.textContent = text;

        // все кроме первого скрываем изначально
        if (i > 0) row.style.display = "none";

        row.addEventListener("click", () => {
          const next = stepList.children[i + 1];
          if (next) {
            next.style.display = "flex";
            next.classList.add("fade-in");

            // если это предпоследний пункт и следующий последний — показываем afterText сразу
            if (next.classList.contains("final-step") && after) {
              after.style.display = "block";
              after.classList.add("fade-in");
            }
          }
        });

        stepList.appendChild(row);
      });

  listWrap.appendChild(stepList);
  if (after) listWrap.appendChild(after);

  sec.appendChild(listWrap);
}

    // 6) Simulator (симулятор расчёта дохода)
    if (section.type === "simulator") {
      const simWrap = document.createElement("div");
      simWrap.classList.add("simulator-container");

      const desc = document.createElement("p");
      desc.textContent = section.content || "Попробуй рассчитать доход!";
      simWrap.appendChild(desc);

      const form = document.createElement("div");
      form.classList.add("simulator-form");

      const createField = (labelText, min, max, step, defaultValue, suffix = "", id, marks = []) => {
        const fieldWrap = document.createElement("div");
        fieldWrap.classList.add("sim-field");

        const label = document.createElement("label");
        label.textContent = labelText;
        fieldWrap.appendChild(label);

        const inputRow = document.createElement("div");
        inputRow.classList.add("input-row");

        const numberInput = document.createElement("input");
        numberInput.type = "number";
        numberInput.value = defaultValue;
        numberInput.id = id;
        numberInput.classList.add("sim-input");

        const suffixSpan = document.createElement("span");
        suffixSpan.textContent = suffix;
        suffixSpan.classList.add("suffix");

        const rangeInput = document.createElement("input");
        rangeInput.type = "range";
        rangeInput.min = min;
        rangeInput.max = max;
        rangeInput.step = step;
        rangeInput.value = defaultValue;
        rangeInput.classList.add("sim-range");

        // Создаем элемент для подсказки
        const hint = document.createElement("div");
        hint.classList.add("sim-hint");
        hint.style.display = "none";
        hint.style.fontSize = "11px";
        hint.style.color = "#666";
        hint.style.marginTop = "4px";
        hint.style.transition = "opacity 0.3s ease";

        // Функция для показа подсказки
        const showHint = (message, duration = 2000) => {
          hint.textContent = message;
          hint.style.display = "block";
          hint.style.opacity = "1";

          setTimeout(() => {
            hint.style.opacity = "0";
            setTimeout(() => {
              hint.style.display = "none";
            }, 300);
          }, duration);
        };

        // Функция для корректировки значения
        const adjustValue = (value) => {
          let val = parseFloat(value);
          let originalVal = val;
          let message = "";

          // Если значение не число, возвращаем минимальное
          if (isNaN(val)) {
            message = `Установлено минимальное значение: ${min}`;
            val = min;
          } else {
            // Ограничиваем по минимуму и максимуму
            if (val < min) {
              message = `Установлено минимальное значение: ${min}`;
              val = min;
            } else if (val > max) {
              message = `Установлено максимальное значение: ${max}`;
              val = max;
            }

            // Для суммы вложения округляем до ближайшего кратного 1000
            if (id === "amount") {
              const roundedVal = Math.round(val / 1000) * 1000;
              if (roundedVal !== val) {
                message = `Сумма округлена до ${roundedVal.toLocaleString()} ₽ (кратно 1000)`;
                val = roundedVal;
              }
            }

            // Для процентной ставки округляем до целого числа
            if (id === "rate") {
              const roundedVal = Math.round(val);
              if (roundedVal !== val) {
                message = `Ставка округлена до ${roundedVal}%`;
                val = roundedVal;
              }
            }

            // Для месяцев оставляем целым числом
            if (id === "months") {
              const roundedVal = Math.round(val);
              if (roundedVal !== val) {
                message = `Срок округлен до ${roundedVal} месяцев`;
                val = roundedVal;
              }
            }
          }

          return { value: val, message };
        };

        // Валидация при потере фокуса
        numberInput.addEventListener("blur", () => {
          const { value: adjustedValue, message } = adjustValue(numberInput.value);

          if (numberInput.value !== adjustedValue.toString()) {
            numberInput.value = adjustedValue;
            rangeInput.value = adjustedValue;
            if (message) {
              showHint(message);
            }
          }
        });

        // Валидация при нажатии Enter
        numberInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            const { value: adjustedValue, message } = adjustValue(numberInput.value);

            if (numberInput.value !== adjustedValue.toString()) {
              numberInput.value = adjustedValue;
              rangeInput.value = adjustedValue;
              if (message) {
                showHint(message);
              }
            }
            numberInput.blur();
          }
        });

        // Связь слайдера с инпутом (слайдер всегда валиден)
        rangeInput.addEventListener("input", () => {
          numberInput.value = rangeInput.value;
        });

        // Разметка значений по процентам
        const marksWrap = document.createElement("div");
        marksWrap.classList.add("sim-marks");
        marks.forEach(val => {
          const mark = document.createElement("span");
          mark.textContent = val;
          const percent = ((val - min) / (max - min)) * 100;
          mark.style.position = "absolute";
          mark.style.left = `${percent}%`;
          mark.style.transform = "translateX(-50%)";
          mark.style.top = "0";
          mark.style.fontSize = "12px";
          mark.style.color = "#999";
          mark.style.whiteSpace = "nowrap";
          marksWrap.appendChild(mark);
        });

        inputRow.appendChild(numberInput);
        inputRow.appendChild(suffixSpan);
        fieldWrap.appendChild(inputRow);
        fieldWrap.appendChild(rangeInput);
        fieldWrap.appendChild(marksWrap);
        fieldWrap.appendChild(hint); // Добавляем подсказку в поле

        return fieldWrap;
      };

      const amountField = createField("💵 Сумма вложения", 1000, 1000000, 1000, 10000, "₽", "amount", [1000, 250000, 500000, 750000, 1000000]);
      const rateField = createField("📈 Процентная ставка", 10, 31, 1, 15, "%", "rate", [10, 15, 20, 25, 30, 31]);
      const periodField = createField("🕒 Срок (мес.)", 1, 120, 1, 12, "мес.", "months", [1, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120]);

      form.appendChild(amountField);
      form.appendChild(rateField);
      form.appendChild(periodField);

      const calcBtn = document.createElement("button");
      calcBtn.textContent = "Рассчитать";
      calcBtn.classList.add("sim-btn");

      const result = document.createElement("div");
      result.classList.add("sim-result");
      result.textContent = "Результат: 0 ₽";

      calcBtn.addEventListener("click", () => {
        const P = parseFloat(document.getElementById("amount").value);
        const r = parseFloat(document.getElementById("rate").value) / 100 / 12;
        const n = parseInt(document.getElementById("months").value);

        const total = P * Math.pow(1 + r, n);
        const profit = total - P;
        result.textContent = `Результат: ${profit.toFixed(2)} ₽ прибыли за ${n} мес.`;
      });

      simWrap.appendChild(form);
      simWrap.appendChild(calcBtn);
      simWrap.appendChild(result);

      sec.appendChild(simWrap);
    }

    // 7) Dialogue (формат переписки)
    if (section.type === "dialogue") {
      const dialogWrap = document.createElement("div");
      dialogWrap.classList.add("dialogue-container");

      section.content.forEach((line, i) => {
        const msg = document.createElement("div");
        msg.classList.add("dialogue-message");

        const isLeft = line.speaker === "Маша";
        msg.classList.add(isLeft ? "left" : "right");

        const avatar = document.createElement("div");
        avatar.classList.add("avatar");
        avatar.textContent = isLeft ? "👩" : "🧑"; // можно заменить на <img>

        const bubble = document.createElement("div");
        bubble.classList.add("bubble");
        bubble.textContent = line.text;

        // порядок элементов
        if (isLeft) {
          msg.append(avatar, bubble);
        } else {
          msg.append(bubble, avatar);
        }

        // добавляем с задержкой для эффекта появления
        setTimeout(() => {
          msg.classList.add("visible");
        }, i * 200);

        dialogWrap.appendChild(msg);
      });

      sec.appendChild(dialogWrap);
    }

    // 8) Pie-chart (круговая диаграмма)
    if (section.type === "piechart") {
      const chartWrap = document.createElement("div");
      chartWrap.classList.add("piechart-container");

      // Основной контейнер для диаграммы и легенды
      const chartContent = document.createElement("div");
      chartContent.classList.add("piechart-content");
      chartContent.style.display = "flex";
      chartContent.style.flexWrap = "wrap";
      chartContent.style.alignItems = "center";
      chartContent.style.justifyContent = "center";
      chartContent.style.gap = "40px";
      chartContent.style.maxWidth = "800px";
      chartContent.style.margin = "0 auto";

      // Контейнер для диаграммы
      const chartContainer = document.createElement("div");
      chartContainer.classList.add("piechart");
      chartContainer.style.position = "relative";
      chartContainer.style.width = "220px";
      chartContainer.style.height = "220px";

      // Canvas для диаграммы
      const canvas = document.createElement("canvas");
      canvas.width = 220;
      canvas.height = 220;
      canvas.style.borderRadius = "50%";
      canvas.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";

      chartContainer.appendChild(canvas);
      chartContent.appendChild(chartContainer);

      // Легенда сбоку
      const legend = document.createElement("div");
      legend.classList.add("piechart-legend");
      legend.style.display = "flex";
      legend.style.flexDirection = "column";
      legend.style.gap = "12px";
      legend.style.minWidth = "200px";

      const colors = ['#4e8cff', '#ff6b6b', '#51cf66', '#ffd43b', '#9775fa', '#22b8cf'];

      section.content.forEach((item, index) => {
        const legendItem = document.createElement("div");
        legendItem.classList.add("legend-item");
        legendItem.style.display = "flex";
        legendItem.style.alignItems = "center";
        legendItem.style.gap = "12px";
        legendItem.style.padding = "8px 12px";
        legendItem.style.borderRadius = "8px";
        legendItem.style.background = "rgba(255,255,255,0.7)";
        legendItem.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
        legendItem.style.transition = "all 0.3s ease";
        legendItem.style.opacity = "0";
        legendItem.style.transform = "translateX(-20px)";

        const colorBox = document.createElement("div");
        colorBox.classList.add("legend-color");
        colorBox.style.width = "16px";
        colorBox.style.height = "16px";
        colorBox.style.borderRadius = "4px";
        colorBox.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

        colorBox.style.backgroundColor = colors[index % colors.length];

        const label = document.createElement("span");
        label.classList.add("legend-label");
        label.textContent = `${item.label}`;
        label.style.fontSize = "0.95rem";
        label.style.fontWeight = "500";

        const value = document.createElement("span");
        value.classList.add("legend-value");
        value.textContent = `${item.value}%`;
        value.style.marginLeft = "auto";
        value.style.fontWeight = "700";
        value.style.color = "#333";

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendItem.appendChild(value);
        legend.appendChild(legendItem);

        // Анимация появления элементов легенды
        setTimeout(() => {
          legendItem.style.opacity = "1";
          legendItem.style.transform = "translateX(0)";
        }, 600 + index * 100);
      });

      chartContent.appendChild(legend);
      chartWrap.appendChild(chartContent);

      // Примечание
      if (section.note) {
        const note = document.createElement("p");
        note.classList.add("piechart-note");
        note.textContent = section.note;
        note.style.opacity = "0";
        chartWrap.appendChild(note);

        setTimeout(() => {
          note.style.opacity = "1";
        }, 1000);
      }

      sec.appendChild(chartWrap);

      // Рисуем диаграмму с анимацией
      setTimeout(() => {
        drawAnimatedPieChart(canvas, section.content);
      }, 300);
    }

    // Функция для анимированной диаграммы
    function drawAnimatedPieChart(canvas, data) {
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 15;

      const colors = ['#4e8cff', '#ff6b6b', '#51cf66', '#ffd43b', '#9775fa', '#22b8cf'];
      const durations = [800, 1000, 1200, 1400, 1600, 1800];

      let currentAngle = -0.5 * Math.PI;
      let startTime = Date.now();

      function animate() {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let animatedCurrentAngle = -0.5 * Math.PI;

        data.forEach((item, index) => {
          const progress = Math.min(1, elapsed / durations[index]);
          const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

          const sliceAngle = (item.value / 100) * 2 * Math.PI * easedProgress;

          // Рисуем сегмент
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, animatedCurrentAngle, animatedCurrentAngle + sliceAngle);
          ctx.closePath();

          ctx.fillStyle = colors[index % colors.length];
          ctx.fill();

          // Добавляем обводку
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();

          animatedCurrentAngle += sliceAngle;
        });

        // Белый круг в центре
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();

        if (elapsed < Math.max(...durations)) {
          requestAnimationFrame(animate);
        }
      }

      animate();
    }

    // Добавляем секцию в тело урока
    lessonBody.appendChild(sec);
  }); // end forEach section


  // --- Загружаем текущий прогресс пользователя ---
  let maxProgress = 0;
  try {
    const res = await fetch(`${API_BASE}/progress/${username}/${lessonNum}`);
    if (res.ok) {
      const data = await res.json();
      maxProgress = data.progress || 0;
    } else {
      console.warn("Не удалось получить прогресс, используем localStorage.");
      maxProgress = parseInt(localStorage.getItem(`lesson_${lessonNum}`)) || 0;
    }
  } catch (err) {
    console.warn("Ошибка соединения при загрузке прогресса:", err);
    maxProgress = parseInt(localStorage.getItem(`lesson_${lessonNum}`)) || 0;
  }

  // --- Обновляем прогрессбар ---
  function updateProgressUI() {
    if (topProgressFill) topProgressFill.style.width = `${maxProgress}%`;
    if (topProgressPercent) topProgressPercent.textContent = `${maxProgress}%`;
    updateButtonState();
  }

  function updateButtonState() {
    if (!nextBtn) return;
    if (maxProgress >= 100) {
      nextBtn.disabled = false;
      nextBtn.classList.remove("btn-disabled");
    } else {
      nextBtn.disabled = true;
      nextBtn.classList.add("btn-disabled");
    }
  }

  updateProgressUI();

  // --- Отслеживаем скролл и сохраняем прогресс ---
  window.addEventListener("scroll", async () => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    let scrolledPercent = Math.round((scrollTop / (scrollHeight || 1)) * 100);
    if (scrolledPercent > maxProgress) {
      maxProgress = Math.min(scrolledPercent, 100);
      localStorage.setItem(`lesson_${lessonNum}`, maxProgress);
      updateProgressUI();

      // Сохраняем на сервер
      try {
        await fetch(`${API_BASE}/progress/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username,
            lesson_id: lessonNum,
            progress: maxProgress
          })
        });
      } catch (err) {
        console.warn("Ошибка при отправке прогресса на сервер:", err);
      }
    }
  });

// --- Переход между уроками ---
if (nextBtn) {
  nextBtn.addEventListener("click", async (e) => {
    if (maxProgress < 100) {
      e.preventDefault();
      return;
    }

    let total = lessonNum; // fallback по умолчанию

    try {
      // Сначала пробуем получить общее количество уроков с сервера
      const res = await fetch(`${API_BASE}/lessons`);
      if (res.ok) {
        const data = await res.json();
        total = data.length;
      } else {
        throw new Error("Сервер не ответил");
      }
    } catch {
      // Если сервер недоступен — пробуем локальный JSON
      try {
        const localRes = await fetch(`${BASE}/webapp/lessonsData.json`);
        if (localRes.ok) {
          const localData = await localRes.json();
          total = localData.length;
        }
      } catch (err) {
        console.warn("Не удалось определить количество уроков:", err);
      }
    }

    // Переход на следующий урок
    if (lessonNum < total) {
      window.location.href = `${BASE}/lesson.html?num=${lessonNum + 1}`;
    } else {
      window.location.href = `${BASE}/index.html`;
    }
  });
}

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = `${BASE}/index.html`;
    });
  }
});
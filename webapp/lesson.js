document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const lessonNum = parseInt(params.get("num")) || 1;

  const lessonTitle = document.getElementById("lesson-title");
  const lessonIntro = document.getElementById("lesson-text"); // можно использовать для короткого вступления
  const lessonBody = document.getElementById("lesson-body"); // сюда рендерим содержимое урока
  const nextBtn = document.getElementById("next-btn");
  const backBtn = document.getElementById("back-btn");
  const topProgressFill = document.getElementById("top-progress-bar-fill");
  const topProgressPercent = document.getElementById("top-progress-percent");

  // Найдём урок в lessonsData (файл lessonsData.js должен быть подключён раньше)
  const lesson = (typeof lessonsData !== "undefined") ? lessonsData.find(l => l.id === lessonNum) : null;
  lessonTitle.textContent = lesson?.title || `Урок ${lessonNum}`;

  // Очистим тело урока
  lessonBody.innerHTML = "";

  if (!lesson) {
    const p = document.createElement("p");
    p.textContent = "Урок не найден.";
    lessonBody.appendChild(p);
    return;
  }

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

    // 4) Drag & Drop (универсальный: ПК + мобильные)
    if (section.type === "drag-drop") {
      const dragWrap = document.createElement("div");
      dragWrap.classList.add("dragdrop-container");

      const instruction = document.createElement("p");
      instruction.classList.add("dragdrop-instruction");
      instruction.textContent = section.content?.instruction || "Соедини элементы:";
      dragWrap.appendChild(instruction);

      const setsWrap = document.createElement("div");
      setsWrap.classList.add("dragdrop-sets");
      setsWrap.style.display = "flex";
      setsWrap.style.justifyContent = "space-between";
      setsWrap.style.gap = "40px";

      const groupA = document.createElement("div");
      groupA.classList.add("dragdrop-group", "group-a");

      const groupB = document.createElement("div");
      groupB.classList.add("dragdrop-group", "group-b");

      // === Блоки A ===
      (section.content?.groupA || []).forEach(item => {
        const el = document.createElement("div");
        el.classList.add("drag-item");
        el.dataset.id = item.id;
        el.draggable = true;
        el.textContent = item.text;
        groupA.appendChild(el);
      });

      // === Блоки B ===
      (section.content?.groupB || []).forEach(item => {
        const el = document.createElement("div");
        el.classList.add("drop-target");
        el.dataset.id = item.id;
        el.dataset.currentMatches = 0;
        el.style.display = "flex";
        el.style.flexDirection = "column";
        el.style.alignItems = "center";
        el.style.justifyContent = "flex-start";
        el.style.gap = "6px";
        el.style.padding = "8px 12px";
        el.textContent = item.text;
        groupB.appendChild(el);
      });

      setsWrap.appendChild(groupA);
      setsWrap.appendChild(groupB);
      dragWrap.appendChild(setsWrap);
      sec.appendChild(dragWrap);

      const draggables = groupA.querySelectorAll(".drag-item");
      const dropzones = groupB.querySelectorAll(".drop-target");

      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      if (isTouchDevice) {
        // === Click-to-move для мобилок ===
        let selectedItem = null;

        draggables.forEach(drag => {
          drag.addEventListener("click", () => {
            draggables.forEach(d => d.classList.remove("selected"));
            selectedItem = drag;
            drag.classList.add("selected");
          });
        });

        dropzones.forEach(drop => {
          drop.addEventListener("click", () => {
            if (!selectedItem) return;

            const correctPair = (section.content?.correctMatches || []).find(
              m => m.a === selectedItem.dataset.id && m.b === drop.dataset.id
            );

            const isAlreadyInDrop = selectedItem.parentElement.classList.contains("drop-target");
            if (!isAlreadyInDrop && selectedItem.classList.contains("drag-item")) {
              selectedItem.remove();
            }

            selectedItem.classList.remove("wrong", "correct");

            if (correctPair) {
              selectedItem.classList.add("correct");
              selectedItem.textContent = selectedItem.textContent.replace(" ❗", "") + " ✅";
              selectedItem.draggable = false;
            } else {
              selectedItem.classList.add("wrong");
              if (!selectedItem.textContent.includes(" ❗")) selectedItem.textContent += " ❗";
              selectedItem.draggable = true;
              setTimeout(() => selectedItem.classList.remove("wrong"), 800);
            }

            drop.appendChild(selectedItem);
            selectedItem.classList.remove("selected");
            selectedItem = null;

            // Подсветка completed
            const totalNeeded = (section.content?.groupA || []).filter(
              a => section.content.correctMatches.some(m => m.a === a.id && m.b === drop.dataset.id)
            ).length;
            if (Number(drop.dataset.currentMatches) >= totalNeeded) drop.classList.add("completed");
          });
        });

      } else {
        // === Drag & Drop для ПК ===
        let draggedItem = null;

        draggables.forEach(drag => {
          drag.addEventListener("dragstart", () => {
            draggedItem = drag;
            drag.classList.add("dragging");
          });
          drag.addEventListener("dragend", () => {
            draggedItem = null;
            drag.classList.remove("dragging");
          });
        });

        dropzones.forEach(drop => {
          drop.addEventListener("dragover", e => e.preventDefault());
          drop.addEventListener("dragleave", () => drop.classList.remove("hover"));
          drop.addEventListener("drop", () => {
            if (!draggedItem) return;

            const correctPair = (section.content?.correctMatches || []).find(
              m => m.a === draggedItem.dataset.id && m.b === drop.dataset.id
            );

            const isAlreadyInDrop = draggedItem.parentElement.classList.contains("drop-target");
            if (!isAlreadyInDrop && draggedItem.classList.contains("drag-item")) draggedItem.remove();

            draggedItem.classList.remove("wrong", "correct");

            if (correctPair) {
              draggedItem.classList.add("correct");
              draggedItem.textContent = draggedItem.textContent.replace(" ❗", "") + " ✅";
              draggedItem.draggable = false;
            } else {
              draggedItem.classList.add("wrong");
              if (!draggedItem.textContent.includes(" ❗")) draggedItem.textContent += " ❗";
              draggedItem.draggable = true;
              setTimeout(() => draggedItem.classList.remove("wrong"), 800);
            }

            drop.appendChild(draggedItem);

            // Подсветка completed
            const totalNeeded = (section.content?.groupA || []).filter(
              a => section.content.correctMatches.some(m => m.a === a.id && m.b === drop.dataset.id)
            ).length;
            if (Number(drop.dataset.currentMatches) >= totalNeeded) drop.classList.add("completed");
          });
        });
      }
    }

    // 5) Step-by-step list with hint
    if (section.type === "expandable-list") {
      const listWrap = document.createElement("div");
      listWrap.classList.add("step-list-wrap");

      // подсказка
      const hint = document.createElement("p");
      hint.classList.add("step-hint");
      hint.textContent = "Нажми на первый пункт, чтобы увидеть продолжение 👇";
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



    // Добавляем секцию в тело урока
    lessonBody.appendChild(sec);
  }); // end forEach section


  /* ===== Прогресс: сохраняем/читаем из localStorage (как у тебя было) ===== */
  let maxProgress = parseInt(localStorage.getItem(`lesson_${lessonNum}`)) || 0;

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

  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    let scrolledPercent = Math.round((scrollTop / (scrollHeight || 1)) * 100);
    if (scrolledPercent > maxProgress) {
      maxProgress = Math.min(scrolledPercent, 100);
      localStorage.setItem(`lesson_${lessonNum}`, maxProgress);
      updateProgressUI();
    }
  });

  // Next / Back handlers
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      if (maxProgress < 100) {
        e.preventDefault();
        return;
      }
      // определяем список уроков (переменная lessons или lessonsData)
      const total = (typeof lessonsData !== "undefined") ? lessonsData.length : (window.lessons ? lessons.length : lessonNum);
      if (lessonNum < total) {
        window.location.href = `lesson.html?num=${lessonNum + 1}`;
      } else {
        window.location.href = "index.html";
      }
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "index.html";
    });
  }
});
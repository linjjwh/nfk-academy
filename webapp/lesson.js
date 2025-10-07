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

    /* ===== ТИПЫ СЕКЦИЙ (существующие) ===== */
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

    /* ===== НОВЫЕ ТИПЫ: flipcards / quiz / choice ===== */

    // 1) Flipcards — поддерживаем имена section.type: "flipcards" или "flip-card"
if (section.type === "flipcards" || section.type === "flip-cards" || section.type === "flip-card" || section.type === "flipcard") {
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

  sec.appendChild(container);

  // после рендера: можно при желании сделать одинаковой высоту фронтов
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

      (section.content || []).forEach((qObj, qIndex) => {
        const qBlock = document.createElement("div");
        qBlock.classList.add("quiz-block-item");
        qBlock.style.marginBottom = "18px";

        const qText = document.createElement("div");
        qText.classList.add("quiz-question");
        qText.textContent = `${qIndex + 1}. ${qObj.question || qObj.title || ""}`;
        qBlock.appendChild(qText);

        const optsWrap = document.createElement("div");
        optsWrap.classList.add("quiz-options");

        // options as array of strings
        (qObj.options || []).forEach((optText, i) => {
          const btn = document.createElement("button");
          btn.classList.add("quiz-btn");
          btn.type = "button";
          // если optText — строка, используем её напрямую
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

            // показать объяснение из qObj.explanation
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
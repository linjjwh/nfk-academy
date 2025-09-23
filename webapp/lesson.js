document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const lessonNum = parseInt(params.get("num")) || 1;

  const lessonTitle = document.getElementById("lesson-title");
  const lessonText = document.getElementById("lesson-text");
  const nextBtn = document.getElementById("next-btn");
  const backBtn = document.getElementById("back-btn");
  const topProgressFill = document.getElementById("top-progress-bar-fill");
  const topProgressPercent = document.getElementById("top-progress-percent");

  // Загружаем текст урока
  lessonTitle.textContent = lessons[lessonNum - 1];
  const lesson = lessonsData.find(l => l.id === lessonNum);

  if (lesson) {
  // Очищаем контейнер
  lessonText.innerHTML = "";

  lesson.sections.forEach(section => {
    // Заголовок секции
    if (section.heading) {
      const h2 = document.createElement("h2");
      h2.textContent = section.heading;
      lessonText.appendChild(h2);
    }

    // В зависимости от типа секции
    if (section.type === "text") {
      section.content.forEach(p => {
        const pEl = document.createElement("p");
        pEl.textContent = p;
        lessonText.appendChild(pEl);
      });
    }

    if (section.type === "list") {
      const ul = document.createElement("ul");
      section.content.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      lessonText.appendChild(ul);
    }

    if (section.type === "list-numbered") {
      const ol = document.createElement("ol");
      section.content.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        ol.appendChild(li);
      });
      lessonText.appendChild(ol);
    }

    if (section.type === "questions") {
      const div = document.createElement("div");
      div.classList.add("questions-block");
      section.content.forEach((q, idx) => {
        const pEl = document.createElement("p");
        pEl.textContent = `${idx + 1}. ${q}`;
        div.appendChild(pEl);
      });
      lessonText.appendChild(div);
    }
  });
}


  // Получаем максимальный прогресс из localStorage
  let maxProgress = parseInt(localStorage.getItem(`lesson_${lessonNum}`)) || 0;

  // Обновление UI прогресса
  function updateProgressUI() {
    topProgressFill.style.width = `${maxProgress}%`;
    topProgressPercent.textContent = `${maxProgress}%`;
    updateButtonState();
  }

  // Обновление состояния кнопки "Следующий урок"
  function updateButtonState() {
    if (maxProgress >= 100) {
      nextBtn.disabled = false;
      nextBtn.classList.remove("btn-disabled");
    } else {
      nextBtn.disabled = true;
      nextBtn.classList.add("btn-disabled");
    }
  }

  updateProgressUI();

  // Обработка прокрутки
  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    let scrolledPercent = Math.round((scrollTop / scrollHeight) * 100);
    if (scrolledPercent > maxProgress) {
      maxProgress = Math.min(scrolledPercent, 100); // никогда не меньше 100
      localStorage.setItem(`lesson_${lessonNum}`, maxProgress);
      updateProgressUI();
    }
  });

  // Кнопка "Следующий урок"
  nextBtn.addEventListener("click", (e) => {
    if (maxProgress < 100) {
      e.preventDefault();
      return;
    }
    if (lessonNum < lessons.length) {
      window.location.href = `lesson.html?num=${lessonNum + 1}`;
    } else {
      window.location.href = "index.html";
    }
  });

  // Кнопка "Назад к списку"
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "index.html";
    });
  }
});

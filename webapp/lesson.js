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
  lessonText.textContent = `Здесь будет текст урока ${lessonNum}...`;

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

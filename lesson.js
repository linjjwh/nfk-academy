document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const lessonNum = parseInt(params.get("num")) || 1;

  const lessonTitle = document.getElementById("lesson-title");
  const lessonText = document.getElementById("lesson-text");
  const lessonBody = document.getElementById("lesson-body");
  const topPercent = document.getElementById("top-progress-percent");
  const topBarFill = document.getElementById("top-progress-bar-fill");
  const backBtn = document.getElementById("back-btn");
  const nextBtn = document.getElementById("next-btn");

  // Заголовок и текст урока
  lessonTitle.textContent = lessons[lessonNum - 1];
  lessonText.textContent = `Здесь будет текст урока ${lessonNum}...`;

  // Получаем прогресс из localStorage
  let storedProgress = parseInt(localStorage.getItem(`lesson_${lessonNum}`)) || 0;
  updateProgress(storedProgress);

  function updateProgress(percent) {
    topPercent.textContent = `${percent}%`;
    topBarFill.style.width = `${percent}%`;
  }

  // Фиксируем правильную высоту документа после рендеринга
  function getDocHeight() {
    return lessonBody.offsetTop + lessonBody.offsetHeight - window.innerHeight;
  }

  // Событие прокрутки
  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight = getDocHeight();

    if (docHeight <= 0) return; // защита от деления на 0

    let scrolled = Math.min(Math.round((scrollTop / docHeight) * 100), 100);
    storedProgress = Math.max(scrolled, storedProgress); // прогресс не уменьшается
    localStorage.setItem(`lesson_${lessonNum}`, storedProgress);
    updateProgress(storedProgress);
  });

  // Кнопка назад
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Кнопка следующий урок
  if (lessonNum < lessons.length) {
    nextBtn.textContent = `Следующий урок: ${lessons[lessonNum]}`;
    nextBtn.addEventListener("click", () => {
      window.location.href = `lesson.html?num=${lessonNum + 1}`;
    });
  } else {
    nextBtn.textContent = "🏁 Закончить курс";
    nextBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  // Обновляем прогресс сразу после полной загрузки страницы
  window.addEventListener("load", () => {
    updateProgress(storedProgress);
  });
});

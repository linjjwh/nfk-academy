document.addEventListener("DOMContentLoaded", () => {
  const lessonsList = document.querySelector(".lessons ul");

  // Создаём элементы списка уроков
  lessons.forEach((title, index) => {
    const lessonNum = index + 1;
    const li = document.createElement("li");
    li.classList.add("lesson");

    // Получаем прогресс урока
    const progress = parseInt(localStorage.getItem(`lesson_${lessonNum}`)) || 0;

    // Разблокировка урока, если есть хоть что-то пройдено
    if (progress > 0) li.classList.add("unlocked");
    else li.classList.add("locked");

    // Контент урока без кнопок
    li.innerHTML = `
      <div class="lesson-title">${title}</div>
      <div class="progress">
        <div class="bar" style="width: ${progress}%;"></div>
      </div>
      <div class="lesson-percent">${progress}%</div>
    `;

    lessonsList.appendChild(li);

    // Можно сделать клик на сам урок для перехода
    li.addEventListener("click", () => {
      window.location.href = `lesson.html?num=${lessonNum}`;
    });
  });
});

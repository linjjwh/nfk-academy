document.addEventListener("DOMContentLoaded", () => {
  const lessonsList = document.getElementById("lessons-list");

  // Получаем прогресс каждого урока
  let allProgress = JSON.parse(localStorage.getItem("lessonsProgress")) || {};

  function renderLessons() {
    lessonsList.innerHTML = "";
    lessons.forEach((title, index) => {
      const li = document.createElement("li");
      li.classList.add("lesson");

      const progress = allProgress[`lesson_${index+1}`] || 0;

      if (index === 0 || allProgress[`lesson_${index}`] >= 100) {
        li.classList.add("unlocked");
        li.innerHTML = `
          <a href="lesson.html?num=${index+1}">${title}</a>
          <div class="progress"><div class="bar" style="width:${progress}%"></div></div>
          <small>${progress === 100 ? "Пройден ✅" : `Прогресс: ${progress}%`}</small>
        `;
      } else {
        li.classList.add("locked");
        li.innerHTML = `<span>${title}</span>
                        <small>Пройдите предыдущие уроки, чтобы разблокировать</small>`;
      }

      lessonsList.appendChild(li);
    });
  }

  renderLessons();
});

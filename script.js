// Демонстрация "прогресса"
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector(".start-btn");
  const lesson = document.querySelector(".lesson.unlocked");
  const span = lesson.querySelector("span");

  startBtn.addEventListener("click", () => {
    let progress = parseInt(span.textContent.replace("%", ""));
    if (progress < 100) {
      progress += 20;
      span.textContent = progress + "%";
    } else {
      alert("Урок завершён! 🎉 Теперь можно разблокировать следующий.");
    }
  });
});

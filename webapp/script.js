document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "http://127.0.0.1:8000/api";
  const tg = window.Telegram?.WebApp;
  const username = tg?.initDataUnsafe?.user?.username || "testuser";
  if (!username) {
  username = "id_" + tg?.initDataUnsafe?.user?.id;
}
  const lessonsList = document.querySelector(".lessons ul");

  if (!username) {
    alert("Ошибка: не удалось определить ваш Telegram username. Запустите обучение через бота.");
    return;
  }

  // --- Глобальный объект прогресса ---
  let userProgress = {};

  // --- Функция для сохранения прогресса на сервере ---
  async function saveProgress(username, lessonNum, progress) {
    try {
      const res = await fetch(`${API_BASE}/progress/update`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          username: username,
          lesson_id: lessonNum,
          progress: progress
        })
      });
      const data = await res.json();
      if (!data.ok) console.warn("Ошибка сохранения прогресса:", data.error);
      else {
        userProgress[lessonNum] = progress;
        localStorage.setItem(`lesson_${lessonNum}`, progress);
      }
    } catch (err) {
      console.error("Ошибка при отправке прогресса:", err);
    }
  }

  // --- Загружаем прогресс пользователя из API ---
  try {
    const res = await fetch(`${API_BASE}/progress/${username}`);
    if (res.ok) {
      const data = await res.json();
      let progressData = [];
      if (Array.isArray(data)) {
        progressData = data;
      } else if (Array.isArray(data.progress)) {
        progressData = data.progress;
      } else {
        console.warn("Неправильный формат ответа API:", data);
      }

      progressData.forEach(p => {
        const lessonKey = parseInt(p["Урок"]);
        const progressValue = parseInt(p["Прогресс"] || 0);
        userProgress[lessonKey] = progressValue;
        localStorage.setItem(`lesson_${lessonKey}`, progressValue);
      });
    } else {
      console.warn("Ошибка при загрузке прогресса:", res.status);
    }
  } catch (err) {
    console.warn("Не удалось подключиться к серверу, используется localStorage:", err);
  }

  // --- Отрисовка списка уроков ---
  lessons.forEach((title, index) => {
    const lessonNum = index + 1;
    const li = document.createElement("li");
    li.classList.add("lesson");

    const progress =
      userProgress[lessonNum] ||
      parseInt(localStorage.getItem(`lesson_${lessonNum}`)) ||
      0;

    const prevProgress =
      lessonNum === 1
        ? 100
        : userProgress[lessonNum - 1] ||
          parseInt(localStorage.getItem(`lesson_${lessonNum - 1}`)) ||
          0;

    if (lessonNum === 1 || prevProgress >= 100) li.classList.add("unlocked");
    else li.classList.add("locked");

    li.innerHTML = `
      <div class="lesson-title">${title}</div>
      <div class="progress">
        <div class="bar" style="width: ${progress}%;"></div>
      </div>
      <div class="lesson-percent">${progress}%</div>
    `;

    lessonsList.appendChild(li);

    li.addEventListener("click", async () => {
      if (!li.classList.contains("unlocked")) {
        tg?.HapticFeedback?.notificationOccurred("error");
        alert("Этот урок пока недоступен. Завершите предыдущий.");
        return;
      }

      // Сохраняем прогресс текущего урока как 100% перед переходом
      if ((userProgress[lessonNum] || 0) < 100) {
        await saveProgress(username, lessonNum, 100);
      }

      // Переход на урок
      window.location.href = `lesson.html?num=${lessonNum}`;
    });
  });
});

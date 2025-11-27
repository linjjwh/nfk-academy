from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
import json
import os
import sys

sys.path.append(os.path.dirname(__file__))

from google_sheets import update_edu_progress, get_edu_progress, user_exists

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # можно указать конкретный домен фронта позже
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LESSONS_PATH = os.path.join(os.path.dirname(__file__), "../webapp/lessonsData.json")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))        # → C:\nfk\education\services
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "webapp")        # → C:\nfk\education\webapp

app.mount("/webapp", StaticFiles(directory=FRONTEND_DIR), name="webapp")

# Функция для чтения lessonsData.json → Python list
def load_lessons():
    if not os.path.exists(LESSONS_PATH):
        print("Файл lessonsData.json не найден:", LESSONS_PATH)
        return []

    try:
        with open(LESSONS_PATH, "r", encoding="utf-8") as f:
            lessons = json.load(f)
        return lessons
    except json.JSONDecodeError as e:
        print("Ошибка парсинга JSON:", e)
        return []
    except Exception as e:
        print("Ошибка чтения lessonsData.json:", e)
        return []

# Получить весь прогресс пользователя
@app.get("/api/progress/{username}")
def get_progress(username: str):
    try:
        if not user_exists(username):
            # Возвращаем пустой список, чтобы фронт не ломался
            return []

        raw = get_edu_progress(username)
        cleaned = []

        for row in raw:
            try:
                lesson = int(row.get("Урок"))
                progress = int(row.get("Прогресс"))
                cleaned.append({"Урок": lesson, "Прогресс": progress})
            except Exception as e:
                # Логируем, но сервер НЕ падает
                print("Ошибка парсинга строки прогресса:", row, e)

        return cleaned

    except Exception as e:
        print("FATAL ERROR /api/progress:", e)
        return []

# Получить прогресс по конкретному уроку
@app.get("/api/progress/{username}/{lesson_id}")
def get_lesson_progress(username: str, lesson_id: int):
    if not user_exists(username):
        return {"ok": True, "progress": 0}

    all_progress = get_edu_progress(username)

    for row in all_progress:
        try:
            l = int(str(row.get("Урок")).strip())
            if l == lesson_id:
                return {
                    "ok": True,
                    "progress": int(str(row.get("Прогресс")).strip())
                }
        except:
            continue

    return {"ok": True, "progress": 0}

# Обновить прогресс пользователя
@app.post("/api/progress/update")
async def update_progress(request: Request):
    data = await request.json()
    username = data.get("username")
    lesson_id = data.get("lesson_id")
    progress = data.get("progress")

    if not username or lesson_id is None or progress is None:
        return {"ok": False, "error": "missing_parameters"}

    if not user_exists(username):
        return {"ok": False, "error": "user_not_found"}

    try:
        # Обновляем прогресс
        update_edu_progress(username, lesson_id, progress)
        # Возвращаем актуальный прогресс по всем урокам
        current_progress = get_edu_progress(username)
        return {"ok": True, "message": "progress_saved", "progress": current_progress}
    except Exception as e:
        # Лог ошибок в консоль сервера
        print("Ошибка при обновлении прогресса:", e)
        return {"ok": False, "error": "update_failed", "details": str(e)}


# Получить текст конкретного урока
@app.get("/api/lessons/{lesson_id}")
def get_lesson(lesson_id: int):
    lessons = load_lessons()
    lesson = next((l for l in lessons if l["id"] == lesson_id), None)
    if not lesson:
        return {"ok": False, "error": "lesson_not_found"}
    return {"ok": True, "lesson": lesson}


# Получить список всех уроков
@app.get("/api/lessons")
def get_all_lessons():
    lessons = load_lessons()
    return {"ok": True, "lessons": lessons}


# Проверка, что сервер жив
@app.get("/")
def root():
    return {"ok": True, "message": "Education API is running"}

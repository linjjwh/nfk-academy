import asyncio
import logging
import os
import json
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from services.config import BOT_TOKEN
from services.google_sheets import update_edu_progress, get_edu_progress, user_exists
from middlewares.last_active import LastActivityMiddleware
from handlers import (
    start_router,
    about_router,
    buy_router,
    edu_router,
    faq_router,
    manager_router,
    registration_router,
    menu_router,
    buy_buttons_router,
    buy_form_router,
    feedback_router
)

# FASTAPI

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))          # services/
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "webapp"))          # webapp/
LESSONS_PATH = os.path.join(FRONTEND_DIR, "lessonsData.json")

app.mount("/webapp", StaticFiles(directory=FRONTEND_DIR), name="webapp")


def load_lessons():
    try:
        with open(LESSONS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []


@app.get("/")
def root():
    return {"ok": True, "message": "Education API is running"}


@app.get("/api/lessons")
def all_lessons():
    return {"ok": True, "lessons": load_lessons()}


@app.get("/api/lessons/{lesson_id}")
def get_lesson(lesson_id: int):
    lessons = load_lessons()
    data = next((l for l in lessons if l["id"] == lesson_id), None)
    return {"ok": True, "lesson": data} if data else {"ok": False}


@app.get("/api/progress/{username}")
def get_progress(username: str):
    if not user_exists(username):
        return []
    out = []
    for row in get_edu_progress(username):
        try:
            out.append({
                "Урок": int(row.get("Урок")),
                "Прогресс": int(row.get("Прогресс"))
            })
        except:
            continue
    return out


@app.get("/api/progress/{username}/{lesson_id}")
def get_progress_by_lesson(username: str, lesson_id: int):
    if not user_exists(username):
        return {"ok": True, "progress": 0}

    for row in get_edu_progress(username):
        try:
            if int(row.get("Урок")) == lesson_id:
                return {"ok": True, "progress": int(row.get("Прогресс"))}
        except:
            continue

    return {"ok": True, "progress": 0}


@app.post("/api/progress/update")
async def update_progress(request: Request):
    data = await request.json()
    username = data.get("username")
    lesson_id = data.get("lesson_id")
    progress = data.get("progress")

    if not (username and lesson_id is not None and progress is not None):
        return {"ok": False, "error": "missing_parameters"}

    if not user_exists(username):
        return {"ok": False, "error": "user_not_found"}

    update_edu_progress(username, lesson_id, progress)

    return {
        "ok": True,
        "message": "progress_saved",
        "progress": get_edu_progress(username)
    }


# AIOGRAM бот

logging.basicConfig(level=logging.INFO)

bot = Bot(
    token=BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)

dp = Dispatcher()

dp.message.middleware(LastActivityMiddleware())
dp.callback_query.middleware(LastActivityMiddleware())

dp.include_router(start_router)
dp.include_router(about_router)
dp.include_router(buy_router)
dp.include_router(edu_router)
dp.include_router(faq_router)
dp.include_router(manager_router)
dp.include_router(registration_router)
dp.include_router(menu_router)
dp.include_router(buy_buttons_router)
dp.include_router(buy_form_router)
dp.include_router(feedback_router)


async def run_bot():
    print("Starting Telegram bot...")
    await dp.start_polling(bot)


@app.on_event("startup")
async def on_startup():
    asyncio.create_task(run_bot())
    print("Bot started!")

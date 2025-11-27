from aiogram import Router, types
from aiogram.filters import Command

from keyboards.main_menu import main_menu
from services.google_sheets import update_last_activity

router = Router()

@router.message(Command("start"))
async def cmd_start(message: types.Message):
    # ID пользователя — всегда строкой
    identifier = str(message.from_user.id)

    # обновляем активность + фиксируем действие
    update_last_activity(identifier, "main_menu")

    # отправляем приветствие
    await message.answer(
        "👋 Привет! Добро пожаловать в бот НФК-Сбережения.\n\n"
        "Выберите раздел из меню:",
        reply_markup=main_menu()
    )

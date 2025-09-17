from aiogram import Router, types
from aiogram.filters import Command
from keyboards.main_menu import main_menu

router = Router()

@router.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        "👋 Привет! Добро пожаловать в бот НФК-Сбережения.\n\n"
        "Выберите раздел из меню:",
        reply_markup=main_menu()
    )

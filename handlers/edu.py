from aiogram import Router, F, types
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from aiogram.fsm.context import FSMContext

from services.google_sheets import user_exists
from handlers.registration import start_registration  # импортируем функцию запуска регистрации

router = Router()

# --- Callback на кнопку обучения ---
@router.callback_query(F.data == "menu_edu")
async def edu_page(callback: types.CallbackQuery, state: FSMContext):
    identifier = callback.from_user.username or f"id_{callback.from_user.id}"

    if user_exists(identifier):
        kb = ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="📚 Пройти обучение", web_app=WebAppInfo(url="https://linjjwh.github.io/nfk-academy/"))]
            ],
            resize_keyboard=True
        )
        await callback.message.answer("С возвращением! Продолжите обучение 👇", reply_markup=kb)
        await callback.answer()
        return

    # Если пользователя нет — запускаем регистрацию
    await start_registration(callback, state)

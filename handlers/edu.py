from aiogram import Router, F, types
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
from aiogram.fsm.context import FSMContext

from services.google_sheets import user_exists
from handlers.registration import start_registration
from keyboards.edu_button import edu_keyboard
from services.google_sheets import update_last_activity

router = Router()


@router.callback_query(F.data == "menu_edu")
async def edu_page(callback: types.CallbackQuery, state: FSMContext):
    identifier = str(callback.from_user.id)

    # фиксируем активность
    update_last_activity(identifier, "education")

    # если пользователь существует — сразу показываем обучение
    if user_exists(identifier):
        await callback.message.answer(
            "С возвращением! Продолжите обучение 👇",
            reply_markup=edu_keyboard()
        )
        await callback.answer()
        return

    # если нет — запускаем регистрацию
    await start_registration(callback, state, purpose="edu")
    await callback.answer()

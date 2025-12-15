from aiogram import Router, F
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext
from aiogram.exceptions import TelegramForbiddenError

from keyboards.feedback_keyboard import feedback_cancel_keyboard
from services.google_sheets import update_last_activity
from services.config import ADMIN_IDS

router = Router()

class FeedbackStates(StatesGroup):
    waiting_text = State()

@router.callback_query(F.data == "menu_feedback")
async def feedback_start(callback: CallbackQuery, state: FSMContext):
    identifier = str(callback.from_user.id)
    update_last_activity(identifier, "feedback")

    await state.set_state(FeedbackStates.waiting_text)
    await callback.message.answer(
        "Напиши, пожалуйста, отзыв о боте одним сообщением:\n"
        "— что удобно или неудобно;\n"
        "— что стоит добавить;\n"
        "— какие у тебя остались вопросы о компании.\n\n",
        reply_markup=feedback_cancel_keyboard()
    )
    await callback.answer()

@router.message(FeedbackStates.waiting_text)
async def feedback_receive(message: Message, state: FSMContext):
    identifier = str(message.from_user.id)
    update_last_activity(identifier, "feedback_text")

    text = (message.text or "").strip()
    if not text:
        await message.answer("Похоже, это не текст. Напиши, пожалуйста, сообщением 🙂")
        return

    admin_text = (
        "📝 Обратная связь по боту\n\n"
        f"👤 Пользователь: @{message.from_user.username or 'не указан'}\n"
        f"🆔 ID: {message.from_user.id}\n\n"
        f"{text}"
    )

    for admin_id in ADMIN_IDS:
        try:
            await message.bot.send_message(admin_id, admin_text)
        except TelegramForbiddenError:
            continue

    await message.answer("Спасибо! Я передал обратную связь команде 🙌")
    await state.clear()


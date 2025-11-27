from aiogram import Router, F
from aiogram.types import CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton

from services.google_sheets import update_last_activity

router = Router()

ABOUT_URL = "https://nfksi.ru/"

@router.callback_query(F.data == "menu_about")
async def about_page(callback: CallbackQuery):
    identifier = str(callback.from_user.id)
    update_last_activity(identifier, "about")

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Перейти на официальный сайт",
                    url=ABOUT_URL
                )
            ]
        ]
    )

    await callback.message.answer(
        "ℹ️ Раздел «О компании»\n\n"
        "Сейчас подробная информация представлена на официальном сайте.\n"
        "Нажмите кнопку ниже, чтобы перейти.",
        reply_markup=kb,
    )
    await callback.answer()

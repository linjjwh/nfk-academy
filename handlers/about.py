from aiogram import Router, F
from aiogram.types import CallbackQuery

router = Router()

@router.callback_query(F.data == "menu_about")
async def about_page(callback: CallbackQuery):
    await callback.message.answer("ℹ️ Здесь будет лендинг 'О компании'")
    await callback.answer()  # чтобы убрать «час ожидания»

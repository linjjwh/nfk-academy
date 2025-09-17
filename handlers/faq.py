from aiogram import Router, F
from aiogram.types import CallbackQuery

router = Router()

@router.callback_query(F.data == "menu_faq")
async def faq_page(callback: CallbackQuery):
    await callback.message.answer("❓ FAQ")
    await callback.answer()
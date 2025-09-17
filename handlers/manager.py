from aiogram import Router, F
from aiogram.types import CallbackQuery

router = Router()

@router.callback_query(F.data == "menu_manager")
async def manager_page(callback: CallbackQuery):
    await callback.message.answer("👨‍💼 Связь с менеджером")
    await callback.answer()
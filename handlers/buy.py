from aiogram import Router, F
from aiogram.types import CallbackQuery

router = Router()

@router.callback_query(F.data == "menu_buy")
async def buy_page(callback: CallbackQuery):
    await callback.message.answer("💳 Здесь будет форма покупки")
    await callback.answer()
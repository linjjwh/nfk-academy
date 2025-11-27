from aiogram import Router, F
from aiogram.types import CallbackQuery

from keyboards.main_menu import main_menu
from services.google_sheets import update_last_activity

router = Router()

@router.callback_query(F.data == "go_main")
async def go_main(callback: CallbackQuery):
    identifier = str(callback.from_user.id)
    update_last_activity(identifier, "main_menu")

    await callback.message.answer(
        "Главное меню:",
        reply_markup=main_menu()
    )
    await callback.answer()

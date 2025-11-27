from aiogram import Router, F
from aiogram.types import CallbackQuery
from aiogram.fsm.context import FSMContext

from handlers.registration import start_registration
from services.google_sheets import update_last_activity

router = Router()

@router.callback_query(F.data == "menu_manager")
async def manager_start(callback: CallbackQuery, state: FSMContext):
    identifier = str(callback.from_user.id)
    update_last_activity(identifier, "manager")

    await start_registration(callback, state, purpose="manager")
    await callback.answer()

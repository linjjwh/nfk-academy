from aiogram.utils.keyboard import InlineKeyboardBuilder

def feedback_cancel_keyboard():
    kb = InlineKeyboardBuilder()
    kb.button(text="В главное меню", callback_data="go_main")
    kb.adjust(1)
    return kb.as_markup()

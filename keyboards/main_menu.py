from aiogram.utils.keyboard import InlineKeyboardBuilder

def main_menu():
    kb = InlineKeyboardBuilder()
    kb.button(text="📚 Обучение", callback_data="menu_edu")
    kb.button(text="🏦 О компании", callback_data="menu_about")
    kb.button(text="💸 Купить облигации", callback_data="menu_buy")
    kb.button(text="👤 Связь с менеджером", callback_data="menu_manager")
    kb.button(text="❓ FAQ", callback_data="menu_faq")
    kb.button(text="📝 Оставить отзыв о боте", callback_data="menu_feedback")
    kb.adjust(1)
    return kb.as_markup()

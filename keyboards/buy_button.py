from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

buy_keyboard = InlineKeyboardMarkup(inline_keyboard=[
    [
        InlineKeyboardButton(text="Как пройти тест?", callback_data="buy_test_help"),
        InlineKeyboardButton(text="Связь с менеджером", callback_data="menu_manager"),
    ],
    [
        InlineKeyboardButton(text="Завершить покупку", callback_data="buy_finish"),
        InlineKeyboardButton(text="В главное меню", callback_data="go_main")
    ]
])

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

def faq_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Что такое ВТБ Регистратор?", callback_data="faq_q1")],
        [InlineKeyboardButton(text="Почему не биржа, а ВТБ Регистратор?", callback_data="faq_q2")],
        [InlineKeyboardButton(text="Как работает оферта?", callback_data="faq_q3")],
        [InlineKeyboardButton(text="Куда уходят деньги?", callback_data="faq_q4")],
        [InlineKeyboardButton(text="Как продать облигацию?", callback_data="faq_q5")],
        [InlineKeyboardButton(text="Почему нужны Госуслуги?", callback_data="faq_q6")],
        [InlineKeyboardButton(text="Налог на доход?", callback_data="faq_q7")],
        [InlineKeyboardButton(text="Когда приходит купон?", callback_data="faq_q8")],
        [InlineKeyboardButton(text="Как формируется ставка?", callback_data="faq_q9")],
        [InlineKeyboardButton(text="У меня остались вопросы", callback_data="faq_more")],
    ])

def faq_back_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="← Вернуться к вопросам", callback_data="faq_back")]
    ])

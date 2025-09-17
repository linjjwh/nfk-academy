from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo

def edu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(
                text="📚 Пройти обучение",
                web_app=WebAppInfo(url="https://linjjwh.github.io/nfk-academy/")
            )]
        ],
        resize_keyboard=True
    )

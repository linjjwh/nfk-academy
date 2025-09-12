import asyncio

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, StateFilter
from aiogram.fsm.state import StatesGroup, State
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove, WebAppInfo

from config import BOT_TOKEN
from google_sheets import user_exists, update_user_data

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# --- FSM для регистрации ---
class Registration(StatesGroup):
    waiting_for_fio = State()
    waiting_for_phone = State()

# --- Вспомогательная функция ---
def get_identifier(message: Message):
    return message.from_user.username or f"id_{message.from_user.id}"

# Форматирование номера телефона
import re

def format_phone(phone: str) -> str | None:
    # Оставляем только цифры
    digits = re.sub(r"\D", "", phone)

    # Должно быть 10 или 11 цифр
    if len(digits) == 11 and digits.startswith(("7", "8")):
        digits = "7" + digits[1:]
    elif len(digits) == 10:
        digits = "7" + digits
    else:
        return None  # некорректный номер

    # Дополнительно проверяем, что получилось ровно 11 цифр
    if len(digits) != 11:
        return None

    # Форматируем: +7 999 999 99 99
    formatted = f"+7 {digits[1:4]} {digits[4:7]} {digits[7:9]} {digits[9:11]}"
    return formatted

# --- Старт бота ---
@dp.message(Command("start"))
async def cmd_start(message: Message, state: FSMContext):
    identifier = get_identifier(message)

    if user_exists(identifier):
        await message.answer("С возвращением! Продолжите с того места, где вы остановились 💪")
        await send_training_button(message)
        return

    # Начинаем регистрацию
    await message.answer(
        "Привет! Я бот для прохождения обучения по облигациям НФК-СИ 📚\n\n"
        "Сначала давай познакомимся. Пожалуйста, напиши своё ФИО."
    )
    await state.set_state(Registration.waiting_for_fio)


# --- Получаем ФИО ---
@dp.message(StateFilter(Registration.waiting_for_fio))
async def process_fio(message: Message, state: FSMContext):
    await state.update_data(fio=message.text)

    # Кнопка для отправки контакта
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton.model_validate({"text": "📱 Отправить контакт", "request_contact": True})]
        ],
        resize_keyboard=True
    )

    await message.answer(
        "Спасибо! Теперь пришли свой номер телефона или нажми кнопку, чтобы отправить контакт:",
        reply_markup=keyboard
    )
    await state.set_state(Registration.waiting_for_phone)


# --- Получаем телефон через контакт ---
@dp.message(StateFilter(Registration.waiting_for_phone), F.contact)
async def process_contact(message: Message, state: FSMContext):
    phone = message.contact.phone_number
    data = await state.get_data()
    fio = data.get("fio", "")
    identifier = get_identifier(message)

    # Сохраняем в Google Sheets
    update_user_data(identifier, fio, format_phone(phone))

    # Убираем клавиатуру
    await message.answer("Спасибо! Телефон получен ✅\n"
                         "Теперь можно начать обучение 😎", reply_markup=ReplyKeyboardRemove())

    # Показываем WebApp кнопку
    await send_training_button(message)

    # Завершаем FSM
    await state.clear()


# --- Получаем телефон вручную ---
@dp.message(StateFilter(Registration.waiting_for_phone))
async def process_phone_text(message: Message, state: FSMContext):
    raw_phone = message.text
    formatted_phone = format_phone(raw_phone)

    if not formatted_phone:
        await message.answer("Некорректный формат номера телефона 😅\nПопробуйте ещё раз, например: +7 999 999 99 99")
        return  # ждём повторного ввода

    data = await state.get_data()
    fio = data.get("fio", "")
    identifier = get_identifier(message)

    # Сохраняем в Google Sheets
    update_user_data(identifier, fio, formatted_phone)

    # Убираем клавиатуру, если была
    await message.answer("Спасибо! Телефон получен ✅\nТеперь можно начать обучение 😎", reply_markup=ReplyKeyboardRemove())

    # Показываем WebApp кнопку
    await send_training_button(message)

    # Завершаем FSM
    await state.clear()

# --- Кнопка WebApp ---
async def send_training_button(message: Message):
    keyboard = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📚 Пройти обучение", web_app=WebAppInfo(url="https://linjjwh.github.io/nfk-academy/"))]],
        resize_keyboard=True
    )
    await message.answer("Нажми на кнопку, чтобы стать экспертом по облигациям 👇", reply_markup=keyboard)

if __name__ == "__main__":
    asyncio.run(dp.start_polling(bot))

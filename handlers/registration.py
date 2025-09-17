import re
from aiogram import Router, F, types
from aiogram.filters import StateFilter
from aiogram.fsm.state import StatesGroup, State
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove

from services.google_sheets import update_user_data
from keyboards.edu_button import edu_keyboard

router = Router()

# --- FSM для регистрации ---
class Registration(StatesGroup):
    waiting_for_fio = State()
    waiting_for_phone = State()

# --- Вспомогательная функция ---
def get_identifier(message: types.Message | types.CallbackQuery):
    if isinstance(message, types.CallbackQuery):
        message = message.message
    return message.from_user.username or f"id_{message.from_user.id}"

# --- Форматирование номера телефона ---
def format_phone(phone: str) -> str | None:
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 11 and digits.startswith(("7", "8")):
        digits = "7" + digits[1:]
    elif len(digits) == 10:
        digits = "7" + digits
    else:
        return None
    if len(digits) != 11:
        return None
    return f"+7 {digits[1:4]} {digits[4:7]} {digits[7:9]} {digits[9:11]}"

# --- Запуск регистрации (можно вызывать из других модулей) ---
async def start_registration(event: Message | CallbackQuery, state: FSMContext, purpose: str):
    msg = event.message if isinstance(event, CallbackQuery) else event
    await state.update_data(purpose=purpose)  # сохраняем цель регистрации
    await msg.answer("👋 Давайте познакомимся!\nНапишите своё ФИО:")
    await state.set_state(Registration.waiting_for_fio)

# --- Получаем ФИО ---
@router.message(StateFilter(Registration.waiting_for_fio))
async def process_fio(message: Message, state: FSMContext):
    await state.update_data(fio=message.text)
    keyboard = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Отправить контакт", request_contact=True)]],
        resize_keyboard=True
    )
    await message.answer("Спасибо! Теперь пришли номер телефона или нажми кнопку:", reply_markup=keyboard)
    await state.set_state(Registration.waiting_for_phone)

# --- Получаем телефон через контакт ---
@router.message(StateFilter(Registration.waiting_for_phone), F.contact)
async def process_contact(message: Message, state: FSMContext):
    data = await state.get_data()
    fio = data.get("fio", "")
    purpose = data.get("purpose")
    phone = message.contact.phone_number

    identifier = get_identifier(message)
    update_user_data(identifier, fio, format_phone(phone))

    await message.answer("✅ Контакт сохранён. Спасибо!", reply_markup=ReplyKeyboardRemove())
    await state.clear()

    # Действие после регистрации
    await post_registration_action(message, purpose)

# --- Получаем телефон текстом ---
@router.message(StateFilter(Registration.waiting_for_phone))
async def process_phone_text(message: Message, state: FSMContext):
    formatted = format_phone(message.text)
    if not formatted:
        await message.answer("❌ Некорректный номер. Попробуйте ещё раз, например: +7 999 999 99 99")
        return

    data = await state.get_data()
    fio = data.get("fio", "")
    purpose = data.get("purpose")

    identifier = get_identifier(message)
    update_user_data(identifier, fio, formatted)

    await message.answer("✅ Контакт сохранён. Спасибо!", reply_markup=ReplyKeyboardRemove())
    await state.clear()

    # Действие после регистрации
    await post_registration_action(message, purpose)


# --- Общая функция: что делать после регистрации ---
async def post_registration_action(message: Message, purpose: str | None):
    if purpose == "edu":
        await message.answer(
            "📚 Отлично! Теперь нажмите кнопку, чтобы перейти к обучению 👇",
            reply_markup=edu_keyboard()
        )
    elif purpose == "buy":
        await message.answer("💳 Спасибо! Теперь можно перейти к покупке.")
    elif purpose == "manager":
        await message.answer("👨‍💼 С вами скоро свяжется менеджер.")
    else:
        await message.answer("✅ Регистрация завершена.")

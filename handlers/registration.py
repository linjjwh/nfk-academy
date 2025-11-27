import re
from aiogram import Router, F, types
from aiogram.filters import StateFilter
from aiogram.fsm.state import StatesGroup, State
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, CallbackQuery, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove

from services.google_sheets import (
    update_user_data,
    user_exists,
    get_user_data,
    get_edu_progress,
)

from keyboards.edu_button import edu_keyboard
from keyboards.buy_button import buy_keyboard
from handlers.buy_form import Buy

router = Router()


# ============================
#      REGISTRATION FSM
# ============================

class Registration(StatesGroup):
    waiting_for_fio = State()
    waiting_for_phone = State()


# ============================
#      IDENTIFIER (TELEGRAM ID)
# ============================

def get_identifier(message):
    user = message.from_user if isinstance(message, Message) else message.from_user
    return str(user.id)


# ============================
#      PHONE FORMATTER
# ============================

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


# ============================
#         START REGISTRATION
# ============================

async def start_registration(event: Message | CallbackQuery, state: FSMContext, purpose: str):
    identifier = get_identifier(event)

    # уже зарегистрирован → сразу выполняем действие
    if user_exists(identifier):
        await post_registration_action(event, state, purpose)
        return

    msg = event.message if isinstance(event, CallbackQuery) else event

    await state.update_data(purpose=purpose)
    await msg.answer("👋 Давайте познакомимся!\nНапишите своё ФИО:")
    await state.set_state(Registration.waiting_for_fio)


# ============================
#              FSM STEPS
# ============================

@router.message(StateFilter(Registration.waiting_for_fio))
async def process_fio(message: Message, state: FSMContext):
    await state.update_data(fio=message.text)

    kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Отправить контакт", request_contact=True)]],
        resize_keyboard=True
    )

    await message.answer(
        "Спасибо! Теперь пришлите номер телефона или нажмите кнопку ниже 👇",
        reply_markup=kb
    )
    await state.set_state(Registration.waiting_for_phone)


@router.message(StateFilter(Registration.waiting_for_phone), F.contact)
async def process_contact(message: Message, state: FSMContext):
    phone = message.contact.phone_number
    formatted = format_phone(phone)

    if not formatted:
        await message.answer("❌ Номер некорректный. Попробуйте ещё раз.")
        return

    data = await state.get_data()
    identifier = get_identifier(message)

    update_user_data(identifier, data["fio"], formatted)

    await message.answer("✅ Контакт сохранён!", reply_markup=ReplyKeyboardRemove())
    await state.clear()

    await post_registration_action(message, state, data["purpose"])


@router.message(StateFilter(Registration.waiting_for_phone))
async def process_phone_text(message: Message, state: FSMContext):
    formatted = format_phone(message.text)
    if not formatted:
        await message.answer("❌ Неверный номер. Пример: +7 999 999 99 99")
        return

    data = await state.get_data()
    identifier = get_identifier(message)

    update_user_data(identifier, data["fio"], formatted)

    await message.answer("✅ Контакт сохранён!", reply_markup=ReplyKeyboardRemove())
    await state.clear()

    await post_registration_action(message, state, data["purpose"])


# ============================
#         POST REGISTRATION
# ============================

async def post_registration_action(message: Message | CallbackQuery, state: FSMContext, purpose: str | None):
    msg = message.message if isinstance(message, CallbackQuery) else message
    identifier = get_identifier(message)

    # ========= ОБУЧЕНИЕ =========
    if purpose == "edu":
        progress = get_edu_progress(identifier)
        if progress:
            text = "📚 Ваш прогресс:\n"
            for rec in progress:
                text += f"Урок {rec['Урок']}: {rec['Прогресс']}%\n"
        else:
            text = "📚 Добро пожаловать! Прогресс пока отсутствует."

        await msg.answer(text, reply_markup=edu_keyboard())
        return

    # ========= ПОКУПКА ОБЛИГАЦИЙ =========
    elif purpose == "buy":

        instructions = (
            "Инструкция по покупке облигаций АО «НФК-СИ» через ВТБ-Регистратор:\n\n"

            "1. Перейдите на сайт: https://pos.vtbreg.ru/marketplace/v2/market/list\n"
            "2. Нажмите «Войти» и выберите вход через Госуслуги.\n"
            "   Если вы впервые входите, система автоматически создаст ваш профиль.\n"
            "3. После входа вы окажетесь в личном кабинете.\n"
            "4. Откройте меню (три линии в правом верхнем углу) и выберите «Маркет».\n"
            "5. В списке бумаг найдите выпуски, в названии которых указано АО «НФК-СИ».\n"
            "6. Выберите нужный выпуск, нажмите «Подробнее», затем — «Купить».\n\n"

            "Примечание: при первом входе появится тест на определение допустимого уровня риска.\n"
            "Пройдите его, затем снова зайдите в «Маркет» и повторите выбор выпуска.\n\n"

            "7. Укажите количество облигаций.\n"
            "8. Проверьте персональные данные.\n"
            "9. Введите банковские реквизиты для получения выплат.\n"
            "10. Подтвердите анкету кодом из SMS.\n"
            "11. Выберите способ оплаты — обычно удобнее всего СБП.\n"
            "12. Оплатите покупку через ваше банковское приложение.\n"
            "13. После оплаты нажмите «Завершить».\n\n"

            "Готово! Заявка появится в разделе «Заявки», а через несколько рабочих дней облигации будут отображаться в разделе «Портфель»."
        )

        await msg.answer(
            instructions,
            disable_web_page_preview=True,
            reply_markup=buy_keyboard
        )
        return

    # ========= СВЯЗЬ С МЕНЕДЖЕРОМ =========
    elif purpose == "manager":
        user = get_user_data(identifier)

        fio = user["fio"]
        phone = user["phone"]

        # безопасно получаем username
        user_obj = message.from_user if isinstance(message, Message) else message.from_user
        tg = user_obj.username

        ADMIN_ID = 745253253

        await message.bot.send_message(
            ADMIN_ID,
            f"📨 Новая заявка на связь:\n"
            f"ФИО: {fio}\n"
            f"Телефон: {phone}\n"
            f"Telegram: @{tg if tg else 'не указан'}"
        )

        await msg.answer("Спасибо! Менеджер свяжется с вами в ближайшее время. 📞")
        return

from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.state import StatesGroup, State
from aiogram.fsm.context import FSMContext

from services.google_sheets import get_user_data, update_last_activity

router = Router()


class Buy(StatesGroup):
    waiting_for_order = State()
    waiting_for_amount = State()


# ===== ШАГ 1 — получение номера заявки =====
@router.message(Buy.waiting_for_order)
async def process_order_number(message: Message, state: FSMContext):
    identifier = str(message.from_user.id)
    update_last_activity(identifier, "buy_form")

    order_number = message.text.strip()

    if not order_number.isdigit() or len(order_number) != 5:
        await message.answer("Номер заявки состоит из 5 цифр. Введите корректный номер:")
        return

    await state.update_data(order_number=order_number)
    await message.answer("Укажите количество купленных облигаций:")
    await state.set_state(Buy.waiting_for_amount)


# ===== ШАГ 2 — получение количества =====
@router.message(Buy.waiting_for_amount)
async def process_amount(message: Message, state: FSMContext):
    identifier = str(message.from_user.id)
    update_last_activity(identifier, "buy_form")

    amount = message.text.strip()

    if not amount.isdigit():
        await message.answer("Количество должно быть числом. Попробуйте снова:")
        return

    await state.update_data(amount=int(amount))
    data = await state.get_data()

    order_number = data["order_number"]
    amount = data["amount"]

    # ===== Данные пользователя =====
    user = get_user_data(identifier)
    fio = user.get("fio")
    phone = user.get("phone")
    tg = message.from_user.username

    # ===== ID менеджера =====
    ADMIN_ID = 745253253

    # ===== Отправка менеджеру =====
    await message.bot.send_message(
        ADMIN_ID,
        f"🟢 Поступила новая покупка облигаций:\n\n"
        f"ФИО клиента: {fio}\n"
        f"Телефон: {phone}\n"
        f"Telegram: @{tg}\n\n"
        f"Номер заявки: {order_number}\n"
        f"Количество облигаций: {amount}"
    )

    # ===== Ответ пользователю =====
    await message.answer(
        f"Спасибо! Данные сохранены.\n\n"
        f"Номер заявки: {order_number}\n"
        f"Количество облигаций: {amount}\n\n"
        "Менеджер свяжется с вами в ближайшее время! "
        "Он расскажет о подарке за покупку и сможет ответить на ваши вопросы."
    )

    await state.clear()

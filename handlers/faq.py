from aiogram import Router, F
from aiogram.types import CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton

from keyboards.faq_keyboard import faq_keyboard, faq_back_keyboard
from services.google_sheets import update_last_activity

router = Router()


# ======= ГЛАВНОЕ МЕНЮ FAQ =======
@router.callback_query(F.data == "menu_faq")
async def faq_menu(callback: CallbackQuery):
    identifier = str(callback.from_user.id)
    update_last_activity(identifier, "faq")

    await callback.message.answer(
        "Часто задаваемые вопросы:",
        reply_markup=faq_keyboard()
    )
    await callback.answer()


# ======= ОТВЕТЫ НА ВОПРОСЫ =======

@router.callback_query(F.data == "faq_q1")
async def faq_q1(callback: CallbackQuery):
    update_last_activity(str(callback.from_user.id), "faq")
    text = (
        "ВТБ-Регистратор — это специализированный сервис по учёту прав на ценные бумаги. "
        "Он ведёт реестр владельцев облигаций, оформляет сделки и обеспечивает юридическое подтверждение владения. "
        "Через него безопасно покупать и хранить облигации АО \"НФК-СИ\"."
    )
    await callback.message.edit_text(text, reply_markup=faq_back_keyboard())
    await callback.answer()


@router.callback_query(F.data == "faq_q2")
async def faq_q2(callback: CallbackQuery):
    update_last_activity(str(callback.from_user.id), "faq")
    text = (
        "Облигации АО \"НФК-СИ\" являются внебиржевыми — они доступны для покупки напрямую через ВТБ-Регистратор.\n\n"
        "Такой формат размещения позволяет:\n"
        "• снизить издержки (нет биржевых комиссий),\n"
        "• не тратить средства на получение кредитного рейтинга,\n"
        "• предложить инвестору более высокую доходность.\n\n"
        "Право владения официально фиксируется регистратором, что обеспечивает надёжность осуществлённой сделки."
    )
    await callback.message.edit_text(text, reply_markup=faq_back_keyboard())
    await callback.answer()


@router.callback_query(F.data == "faq_q3")
async def faq_q3(callback: CallbackQuery):
    update_last_activity(str(callback.from_user.id), "faq")
    text = (
        "Оферта — это условие, при котором инвестор может вернуть облигации эмитенту и получить номинал + купон. "
        "Если облигации не предъявляются к оферте, выплаты купона продолжаются до следующей установленной даты."
    )
    await callback.message.edit_text(text, reply_markup=faq_back_keyboard())
    await callback.answer()


@router.callback_query(F.data == "faq_q4")
async def faq_q4(callback: CallbackQuery):
    update_last_activity(str(callback.from_user.id), "faq")
    text = (
        "Средства от покупки внебиржевых облигаций дочерней компании АО \"НФК-СИ\" направляются в лизинговые проекты материнской компании «Пионер-Лизинг», которая специализируется на лизинге автотранспорта, спецтехники, промышленного оборудования, недвижимости, а также развивает стартапы и другие направления. "
        "Принцип работы напоминает банковский: средства привлекаются под одну ставку, а используются в деятельности под более высокую. "
    )
    await callback.message.edit_text(text, reply_markup=faq_back_keyboard())
    await callback.answer()


@router.callback_query(F.data == "faq_q5")
async def faq_q5(callback: CallbackQuery):
    update_last_activity(str(callback.from_user.id), "faq")
    text = (
        "Продать облигации АО \"НФК-СИ\" можно через ВТБ-Регистратор:\n\n"
        "1) Разместив их на внутренней доске, где их могут купить другие инвесторы;\n"
        "2) Через оферту, подав заявку на выкуп в установленную дату.\n\n"
        "Получить детальную инструкцию по продаже облигаций можно у менеджера."
    )
    await callback.message.edit_text(text, reply_markup=faq_back_keyboard())
    await callback.answer()


@router.callback_query(F.data == "faq_q6")
async def faq_q6(callback: CallbackQuery):
    update_last_activity(str(callback.from_user.id), "faq")
    text = (
        "ВТБ-Регистратор использует Госуслуги для подтверждения личности. "
        "Это обязательное требование для операций с ценными бумагами — аналог KYC в банках."
    )
    await callback.message.edit_text(text, reply_markup=faq_back_keyboard())
    await callback.answer()


@router.callback_query(F.data == "faq_q7")
async def faq_q7(callback: CallbackQuery):
    update_last_activity(str(callback.from_user.id), "faq")
    text = (
        "Купонный доход облагается ставкой НДФЛ 13% (для резидентов РФ). "
        "Налог удерживается автоматически, ничего декларировать не нужно."
    )
    await callback.message.edit_text(text, reply_markup=faq_back_keyboard())
    await callback.answer()


@router.callback_query(F.data == "faq_q8")
async def faq_q8(callback: CallbackQuery):
    update_last_activity(str(callback.from_user.id), "faq")
    text = (
        "Купон по облигациям АО \"НФК-СИ\" выплачивается ежемесячно. "
        "Дата выплаты зависит от конкретного выпуска. "
        "Деньги поступают на счёт, указанный при покупке на ВТБ-Регистраторе."
    )
    await callback.message.edit_text(text, reply_markup=faq_back_keyboard())
    await callback.answer()


@router.callback_query(F.data == "faq_q9")
async def faq_q9(callback: CallbackQuery):
    update_last_activity(str(callback.from_user.id), "faq")
    text = (
        "Размер ставки определяется советом директоров АО \"НФК-СИ\" и зависит от ключевой ставки ЦБ. "
        "Если ключевая ставка растёт — доходность по облигациям также может увеличиваться."
    )
    await callback.message.edit_text(text, reply_markup=faq_back_keyboard())
    await callback.answer()


# ======= У МЕНЯ ОСТАЛИСЬ ВОПРОСЫ =======

@router.callback_query(F.data == "faq_more")
async def faq_more(callback: CallbackQuery):
    update_last_activity(str(callback.from_user.id), "faq_more")

    text = (
        "Если вы только начинаете знакомиться с инвестициями, вам будет полезно пройти обучение по ценным бумагам.\n\n"
        "Если вопросы касаются компании или покупки облигаций — обратитесь за консультацией к менеджеру."
    )

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📚 Обучение", callback_data="menu_edu")],
        [InlineKeyboardButton(text="👤 Связь с менеджером", callback_data="menu_manager")],
        [InlineKeyboardButton(text="← Вернуться к вопросам", callback_data="faq_back")]
    ])

    await callback.message.edit_text(text, reply_markup=keyboard)
    await callback.answer()


# ======= НАЗАД =======

@router.callback_query(F.data == "faq_back")
async def faq_back(callback: CallbackQuery):
    update_last_activity(str(callback.from_user.id), "faq")

    await callback.message.edit_text(
        "Часто задаваемые вопросы:",
        reply_markup=faq_keyboard()
    )
    await callback.answer()

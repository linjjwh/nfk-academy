import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from services.config import BOT_TOKEN
from middlewares.last_active import LastActivityMiddleware
from handlers import (
    start_router,
    about_router,
    buy_router,
    edu_router,
    faq_router,
    manager_router,
    registration_router,
    menu_router,
    buy_buttons_router,
    buy_form_router
)

logging.basicConfig(level=logging.INFO)


async def main():
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher()

    dp.message.middleware(LastActivityMiddleware())
    dp.callback_query.middleware(LastActivityMiddleware())

    dp.include_router(start_router)
    dp.include_router(about_router)
    dp.include_router(buy_router)
    dp.include_router(edu_router)
    dp.include_router(faq_router)
    dp.include_router(manager_router)
    dp.include_router(registration_router)
    dp.include_router(menu_router)
    dp.include_router(buy_buttons_router)
    dp.include_router(buy_form_router)

    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logging.info("Бот остановлен!")

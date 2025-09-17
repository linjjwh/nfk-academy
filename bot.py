import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from config import BOT_TOKEN
from handlers import (
    about_router,
    buy_router,
    edu_router,
    faq_router,
    manager_router,
    registration_router,
    start_router
)

logging.basicConfig(level=logging.INFO)


async def main():
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher()

    dp.include_router(start_router)
    dp.include_router(about_router)
    dp.include_router(buy_router)
    dp.include_router(edu_router)
    dp.include_router(faq_router)
    dp.include_router(manager_router)
    dp.include_router(registration_router)

    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logging.info("Бот остановлен!")

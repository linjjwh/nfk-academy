from aiogram import BaseMiddleware
from aiogram.types import Update
from datetime import datetime, timedelta
from services.google_sheets import update_last_activity

# память внутри приложения
_last_activity_cache = {}

class LastActivityMiddleware(BaseMiddleware):
    async def __call__(self, handler, event: Update, data: dict):
        user = None

        # достаем user_id из события
        if hasattr(event, "message") and event.message:
            user = event.message.from_user
        elif hasattr(event, "callback_query") and event.callback_query:
            user = event.callback_query.from_user

        if user:
            user_id = str(user.id)
            now = datetime.now()

            last_time = _last_activity_cache.get(user_id)

            # если нет записи или прошло > 6 часов
            if not last_time or (now - last_time) > timedelta(hours=6):
                update_last_activity(user_id, action=None)
                _last_activity_cache[user_id] = now

        return await handler(event, data)

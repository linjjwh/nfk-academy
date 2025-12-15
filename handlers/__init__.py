from .start import router as start_router
from .registration import router as registration_router
from .manager import router as manager_router
from .buy import router as buy_router
from .buy_form import router as buy_form_router
from .menu import router as menu_router
from .about import router as about_router
from .faq import router as faq_router
from .edu import router as edu_router
from .buy_buttons import router as buy_buttons_router
from .feedback import router as feedback_router

routers = [
    start_router,
    registration_router,
    manager_router,
    buy_router,
    buy_form_router,
    menu_router,
    about_router,
    faq_router,
    edu_router,
    buy_buttons_router,
    feedback_router
]

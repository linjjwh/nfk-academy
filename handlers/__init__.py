from .about import router as about_router
from .buy import router as buy_router
from .edu import router as edu_router
from .faq import router as faq_router
from .manager import router as manager_router
from .registration import router as registration_router
from .start import router as start_router

__all__ = [
    "about_router",
    "buy_router",
    "edu_router",
    "faq_router",
    "manager_router",
    "registration_router",
    "start_router"
]
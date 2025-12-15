import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
SPREADSHEET_ID = os.getenv("SPREADSHEET_ID")
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE")
SHEET_NAME = os.getenv("SHEET_NAME")

def _parse_admin_ids(raw: str | None) -> list[int]:
    if not raw:
        return []
    return [int(x.strip()) for x in raw.split(",") if x.strip()]

ADMIN_IDS = _parse_admin_ids(os.getenv("ADMIN_IDS"))

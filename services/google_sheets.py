import gspread
import sys
import os
import json
import time
from google.oauth2.service_account import Credentials
from datetime import datetime
from services.config import SPREADSHEET_ID

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
CACHE_EXPIRY = 30  # секунд

# Кэш
_cache_users = {"data": [], "timestamp": 0}
_cache_edu = {"data": [], "timestamp": 0}
_cache_sales = {"data": [], "timestamp": 0}
_cache_employees = {"data": [], "timestamp": 0}


# ==========
# ЛЕНИВАЯ ЗАГРУЗКА КЛИЕНТА
# ==========

def get_client():
    """Возвращает авторизованный gspread клиент."""
    if "GOOGLE_CREDENTIALS_JSON" in os.environ:
        creds_info = json.loads(os.environ["GOOGLE_CREDENTIALS_JSON"])
        creds = Credentials.from_service_account_info(creds_info, scopes=SCOPES)
    else:
        # Локально
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        CREDS_PATH = os.path.join(BASE_DIR, "credentials.json")
        creds = Credentials.from_service_account_file(CREDS_PATH, scopes=SCOPES)

    return gspread.authorize(creds)


def get_sheet(name: str):
    """Возвращает лист по имени, лениво."""
    client = get_client()
    sheet = client.open_by_key(SPREADSHEET_ID).worksheet(name)
    return sheet


# ==========
# SAFE GET
# ==========

def safe_get_records(sheet):
    values = sheet.get_all_values()

    if not values:
        return []

    headers = values[0]
    data_rows = values[1:]

    # избегаем дубликатов заголовков
    unique_headers = []
    counter = {}

    for h in headers:
        if h not in counter:
            counter[h] = 1
            unique_headers.append(h)
        else:
            counter[h] += 1
            unique_headers.append(f"{h}_{counter[h]}")

    records = []
    for row in data_rows:
        row_dict = {}
        for i, value in enumerate(row):
            if i < len(unique_headers):
                row_dict[unique_headers[i]] = value
        records.append(row_dict)

    return records


# ==========
# КЭШ

def cache_get(cache_obj, loader):
    if time.time() - cache_obj["timestamp"] > CACHE_EXPIRY:
        cache_obj["data"] = loader()
        cache_obj["timestamp"] = time.time()
    return cache_obj["data"]


# ==========
# ПОЛЬЗОВАТЕЛИ

def _load_users():
    return safe_get_records(get_sheet("Пользователи"))

def _load_edu():
    return safe_get_records(get_sheet("Обучение"))

def _load_sales():
    return safe_get_records(get_sheet("Продажи"))

def _load_employees():
    return safe_get_records(get_sheet("Сотрудники"))


def _get_users_records():
    return cache_get(_cache_users, _load_users)

def _get_edu_records():
    return cache_get(_cache_edu, _load_edu)

def _get_sales_records():
    return cache_get(_cache_sales, _load_sales)

def _get_employees_records():
    return cache_get(_cache_employees, _load_employees)


# ==========
# ЮЗЕРЫ

def user_exists(username: str) -> bool:
    records = _get_users_records()
    return any(str(r["Профиль в ТГ"]).strip() == str(username).strip() for r in records)


def update_user_data(username, fio, phone):
    sheet = get_sheet("Пользователи")
    records = safe_get_records(sheet)

    row = None
    for i, record in enumerate(records, start=2):
        if record["Профиль в ТГ"] == username:
            row = i
            break

    now = datetime.now().strftime("%d-%m-%Y %H:%M:%S")

    if row:
        sheet.update_cell(row, 2, fio)
        sheet.update_cell(row, 3, phone)
        sheet.update_cell(row, 4, now)
    else:
        sheet.append_row([username, fio, phone, now])


def get_user_data(username: str) -> dict:
    records = _get_users_records()
    username = str(username).strip()

    for r in records:
        if str(r.get("Профиль в ТГ", "")).strip() == username:
            return {
                "fio": r.get("ФИО клиента"),
                "phone": r.get("Телефон")
            }

    return {"fio": None, "phone": None}


def get_fio_by_username(username):
    records = _get_users_records()
    for record in records:
        if record["Профиль в ТГ"] == username:
            return record.get("ФИО клиента", "")
    return ""


# ==========
# ОБУЧЕНИЕ

def update_edu_progress(username, lesson_id, progress):
    sheet = get_sheet("Обучение")
    lesson_id = int(lesson_id)

    records = safe_get_records(sheet)
    row = None

    for i, record in enumerate(records, start=2):
        try:
            record_lesson = int(str(record.get("Урок")).strip())
            record_user = str(record.get("Профиль в ТГ")).strip()
        except:
            continue

        if record_user == username and record_lesson == lesson_id:
            row = i
            break

    fio = get_fio_by_username(username)
    now = datetime.now().strftime("%d-%m-%Y %H:%M:%S")

    if row:
        sheet.update_cell(row, 4, progress)
        sheet.update_cell(row, 5, now)
    else:
        sheet.append_row([username, fio, lesson_id, progress, now])


def get_edu_progress(username):
    records = _get_edu_records()
    return [r for r in records if r["Профиль в ТГ"] == username]


# ==========
# АКТИВНОСТЬ

def update_last_activity(username: str, action: str | None = None):
    sheet = get_sheet("Пользователи")
    records = sheet.get_all_records()

    now = datetime.now().strftime("%d-%m-%Y %H:%M:%S")

    for i, r in enumerate(records, start=2):
        if str(r["Профиль в ТГ"]) == str(username):

            # обновляем "Последнее обновление"
            sheet.update_cell(i, 4, now)

            if action:
                sheet.update_cell(i, 6, action)

            raw_rating = r.get("Активность", "0")
            try:
                current_rating = int(raw_rating)
            except:
                current_rating = 0

            delta = get_action_points(action)
            new_rating = min(100, current_rating + delta)

            sheet.update_cell(i, 5, new_rating)
            return


def get_action_points(action: str | None):
    mapping = {
        "education": 5,
        "faq": 5,
        "buy": 5,
        "buy_form": 20,
        "manager": 5,
    }
    return mapping.get(action, 5)

import gspread
import sys
import os
import time
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from google.oauth2.service_account import Credentials
from datetime import datetime
from config import SPREADSHEET_ID

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDS_PATH = os.path.join(BASE_DIR, "credentials.json")
creds = Credentials.from_service_account_file(CREDS_PATH, scopes=SCOPES)
client = gspread.authorize(creds)

# основной листы
sheet_users = client.open_by_key(SPREADSHEET_ID).worksheet("Пользователи")
sheet_edu = client.open_by_key(SPREADSHEET_ID).worksheet("Обучение")
sheet_sales = client.open_by_key(SPREADSHEET_ID).worksheet("Продажи")
sheet_employees = client.open_by_key(SPREADSHEET_ID).worksheet("Сотрудники")

# --- Кэш ---
CACHE_EXPIRY = 30  # секунд

_cache_users = {"data": [], "timestamp": 0}
_cache_edu = {"data": [], "timestamp": 0}
_cache_sales = {"data": [], "timestamp": 0}
_cache_employees = {"data": [], "timestamp": 0}


# ==========================
#    КЭШИРОВАНИЕ
# ==========================

def safe_get_records(sheet):
    values = sheet.get_all_values()

    if not values:
        return []

    headers = values[0]
    data_rows = values[1:]

    # фикс дубликатов
    unique_headers = []
    counter = {}

    for h in headers:
        if h not in counter:
            counter[h] = 1
            unique_headers.append(h)
        else:
            counter[h] += 1
            unique_headers.append(f"{h}_{counter[h]}")   # Комментарий → Комментарий_2

    records = []
    for row in data_rows:
        row_dict = {}
        for i, value in enumerate(row):
            if i < len(unique_headers):
                row_dict[unique_headers[i]] = value
        records.append(row_dict)

    return records

def _get_users_records():
    if time.time() - _cache_users["timestamp"] > CACHE_EXPIRY:
        _cache_users["data"] = safe_get_records(sheet_users)
        _cache_users["timestamp"] = time.time()
    return _cache_users["data"]


def _get_edu_records():
    if time.time() - _cache_edu["timestamp"] > CACHE_EXPIRY:
        _cache_edu["data"] = safe_get_records(sheet_edu)
        _cache_edu["timestamp"] = time.time()
    return _cache_edu["data"]


def _get_sales_records():
    if time.time() - _cache_sales["timestamp"] > CACHE_EXPIRY:
        _cache_sales["data"] = safe_get_records(sheet_sales)
        _cache_sales["timestamp"] = time.time()
    return _cache_sales["data"]


def _get_employees_records():
    if time.time() - _cache_employees["timestamp"] > CACHE_EXPIRY:
        _cache_employees["data"] = safe_get_records(sheet_employees)
        _cache_employees["timestamp"] = time.time()
    return _cache_employees["data"]


# ==========================
#   ПОЛЬЗОВАТЕЛИ
# ==========================

def user_exists(username: str) -> bool:
    records = _get_users_records()
    return any(str(r["Профиль в ТГ"]).strip() == str(username).strip() for r in records)


def update_user_data(username, fio, phone):
    records = safe_get_records(sheet_users)
    row = None
    for i, record in enumerate(records, start=2):
        if record["Профиль в ТГ"] == username:
            row = i
            break

    now = datetime.now().strftime("%d-%m-%Y %H:%M:%S")

    if row:
        sheet_users.update_cell(row, 2, fio)
        sheet_users.update_cell(row, 3, phone)
        sheet_users.update_cell(row, 4, now)
    else:
        sheet_users.append_row([username, fio, phone, now])


def get_user_data(username: str) -> dict:
    records = _get_users_records()
    username = str(username).strip()

    for r in records:
        profile = str(r.get("Профиль в ТГ", "")).strip()
        if profile == username:
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


# ==========================
#     ОБУЧЕНИЕ
# ==========================

def update_edu_progress(username, lesson_id, progress):
    lesson_id = int(lesson_id)

    records = safe_get_records(sheet_edu)
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
        sheet_edu.update_cell(row, 4, progress)
        sheet_edu.update_cell(row, 5, now)
    else:
        sheet_edu.append_row([username, fio, lesson_id, progress, now])


def get_edu_progress(username):
    records = _get_edu_records()
    user_records = [r for r in records if r["Профиль в ТГ"] == username]

    for rec in user_records:
        if "Урок" in rec:
            rec["Урок"] = int(rec["Урок"])
    return user_records


# ==========================
#     ПОИСК МЕНЕДЖЕРА
# ==========================

def get_manager_by_user(fio: str, phone: str) -> dict:
    sales = _get_sales_records()
    employees = _get_employees_records()

    manager_name = None

    # --- 1. Ищем продажу клиента ---
    for row in sales:
        if row.get("ФИО клиента") == fio or row.get("Номер телефона") == phone:
            manager_name = row.get("ФИО сотрудника")
            break

    # --- 2. Если менеджер не найден — берём руководителя группы ---
    if not manager_name:
        lead = employees[0]
        return {
            "name": lead.get("ФИО"),
            "tg": lead.get("Телеграм"),
            "phone": lead.get("Контактный телефон")
        }

    # --- 3. Ищем менеджера в списке сотрудников ---
    for emp in employees:
        if emp.get("ФИО") == manager_name:
            return {
                "name": emp.get("ФИО"),
                "tg": emp.get("Телеграм"),
                "phone": emp.get("Контактный телефон")
            }

    # --- 4. Фолбэк: руководитель группы ---
    lead = employees[0]
    return {
        "name": lead.get("ФИО"),
        "tg": lead.get("Телеграм"),
        "phone": lead.get("Контактный телефон")
    }


# ==========================
#   АКТИВНОСТЬ
# ==========================

def update_last_activity(username: str, action: str | None = None):
    records = sheet_users.get_all_records()

    now = datetime.now().strftime("%d-%m-%Y %H:%M:%S")

    for i, r in enumerate(records, start=2):
        if str(r["Профиль в ТГ"]) == str(username):

            # обновляем "Последнее обновление"
            sheet_users.update_cell(i, 4, now)

            # обновляем последнее действие
            if action:
                sheet_users.update_cell(i, 6, action)

            # повышаем рейтинг
            raw_rating = r.get("Активность", "0")
            try:
                current_rating = int(raw_rating)
            except (ValueError, TypeError):
                current_rating = 0

            delta = get_action_points(action)
            new_rating = min(100, current_rating + delta)

            sheet_users.update_cell(i, 5, new_rating)
            return


def get_action_points(action: str | None):
    if action is None:
        return 5  # минимальный бонус за просто вход в бота

    mapping = {
        "education": 5,
        "faq": 5,
        "buy": 5,
        "buy_form": 20,
        "manager": 5,
    }
    return mapping.get(action, 5)

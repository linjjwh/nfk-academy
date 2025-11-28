import gspread
import os
import json
import time
from google.oauth2.service_account import Credentials
from datetime import datetime
from services.config import SPREADSHEET_ID

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
CACHE_EXPIRY = 30

# ---- глобальный клиент и листы ----
_client = None
_sheets = {}
_cache = {
    "users": {"data": [], "timestamp": 0},
    "edu": {"data": [], "timestamp": 0},
    "sales": {"data": [], "timestamp": 0},
    "employees": {"data": [], "timestamp": 0},
}

# ---------------------------
#  КЛИЕНТ – создаётся только ОДИН раз
# ---------------------------
def get_client():
    global _client
    if _client is not None:
        return _client

    if "GOOGLE_CREDENTIALS_JSON" in os.environ:
        creds_info = json.loads(os.environ["GOOGLE_CREDENTIALS_JSON"])
        creds = Credentials.from_service_account_info(creds_info, scopes=SCOPES)
    else:
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        CREDS_PATH = os.path.join(BASE_DIR, "credentials.json")
        creds = Credentials.from_service_account_file(CREDS_PATH, scopes=SCOPES)

    _client = gspread.authorize(creds)
    return _client


# ---------------------------
#   ЛИСТЫ – открываются ТОЛЬКО 1 раз
# ---------------------------
def get_sheet(name: str):
    global _sheets
    if name in _sheets:
        return _sheets[name]

    client = get_client()
    sheet = client.open_by_key(SPREADSHEET_ID).worksheet(name)
    _sheets[name] = sheet
    return sheet


# ---------------------------
# SAFE RECORDS
# ---------------------------
def safe_get_records(sheet):
    values = sheet.get_all_values()
    if not values:
        return []

    headers = values[0]
    unique = []
    counter = {}

    for h in headers:
        if h not in counter:
            counter[h] = 1
            unique.append(h)
        else:
            counter[h] += 1
            unique.append(f"{h}_{counter[h]}")

    data = []
    for row in values[1:]:
        record = {}
        for i, value in enumerate(row):
            if i < len(unique):
                record[unique[i]] = value
        data.append(record)

    return data


# ---------------------------
#   КЭШ
# ---------------------------
def cache_load(cache_key, loader):
    c = _cache[cache_key]
    if time.time() - c["timestamp"] > CACHE_EXPIRY:
        c["data"] = loader()
        c["timestamp"] = time.time()
    return c["data"]

def cache_reset():
    for k in _cache:
        _cache[k]["timestamp"] = 0


# ---------------------------
# LOADERS
# ---------------------------
def load_users():
    return safe_get_records(get_sheet("Пользователи"))

def load_edu():
    return safe_get_records(get_sheet("Обучение"))

def load_sales():
    return safe_get_records(get_sheet("Продажи"))

def load_employees():
    return safe_get_records(get_sheet("Сотрудники"))


# ---------------------------
# GETTERS (кэшированные)
# ---------------------------
def get_users():
    return cache_load("users", load_users)

def get_edu():
    return cache_load("edu", load_edu)

def get_sales():
    return cache_load("sales", load_sales)

def get_employees():
    return cache_load("employees", load_employees)


# ============================================================
# USERS
# ============================================================
def user_exists(username):
    username = str(username).strip()
    return any(str(r["Профиль в ТГ"]).strip() == username for r in get_users())

def get_user_data(username: str) -> dict:
    username = str(username).strip()

    for r in get_users():
        if str(r.get("Профиль в ТГ", "")).strip() == username:
            return {
                "fio": r.get("ФИО клиента"),
                "phone": r.get("Телефон"),
            }

    return {"fio": None, "phone": None}

def get_fio_by_username(username):
    username = str(username).strip()
    for r in get_users():
        if str(r["Профиль в ТГ"]).strip() == username:
            return r.get("ФИО клиента", "")
    return ""


def update_user_data(username, fio, phone):
    sheet = get_sheet("Пользователи")
    username = str(username).strip()

    rows = safe_get_records(sheet)
    row_index = None

    for i, r in enumerate(rows, start=2):
        if str(r["Профиль в ТГ"]).strip() == username:
            row_index = i
            break

    now = datetime.now().strftime("%d-%m-%Y %H:%M:%S")

    if row_index:
        sheet.update_cell(row_index, 2, fio)
        sheet.update_cell(row_index, 3, phone)
        sheet.update_cell(row_index, 4, now)
    else:
        sheet.append_row([username, fio, phone, now])

    cache_reset()


# ============================================================
# EDUCATION
# ============================================================
def update_edu_progress(username, lesson_id, progress):
    sheet = get_sheet("Обучение")
    username = str(username).strip()

    records = safe_get_records(sheet)
    row_index = None

    for i, r in enumerate(records, start=2):
        try:
            if str(r["Профиль в ТГ"]).strip() == username and int(r["Урок"]) == int(lesson_id):
                row_index = i
                break
        except:
            continue

    now = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    fio = get_fio_by_username(username)

    if row_index:
        sheet.update_cell(row_index, 4, progress)
        sheet.update_cell(row_index, 5, now)
    else:
        sheet.append_row([username, fio, lesson_id, progress, now])

    cache_reset()


def get_edu_progress(username):
    return [r for r in get_edu() if r["Профиль в ТГ"] == username]


# ============================================================
# ACTIVITY
# ============================================================
def update_last_activity(username, action=None):
    sheet = get_sheet("Пользователи")
    username = str(username).strip()

    rows = sheet.get_all_records()
    now = datetime.now().strftime("%d-%m-%Y %H:%M:%S")

    for i, r in enumerate(rows, start=2):
        if str(r["Профиль в ТГ"]).strip() == username:
            sheet.update_cell(i, 4, now)

            if action:
                sheet.update_cell(i, 6, action)

            try:
                current = int(r.get("Активность", "0"))
            except:
                current = 0

            new_value = min(100, current + get_action_points(action))
            sheet.update_cell(i, 5, new_value)

            cache_reset()
            return


def get_action_points(action):
    return {
        "education": 5,
        "faq": 5,
        "buy": 5,
        "buy_form": 20,
        "manager": 5,
    }.get(action, 5)

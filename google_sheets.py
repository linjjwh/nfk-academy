import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime

from config import SPREADSHEET_ID, SHEET_NAME

# --- Настройка доступа к Google Sheets ---
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
creds = Credentials.from_service_account_file('credentials.json', scopes=SCOPES)
client = gspread.authorize(creds)
sheet = client.open_by_key(SPREADSHEET_ID).worksheet(SHEET_NAME)

# --- Проверка, есть ли пользователь ---
def user_exists(username):
    records = sheet.get_all_records()
    for record in records:
        if record["Профиль в ТГ"] == username:
            return True
    return False

# --- Получение данных пользователя ---
def get_user_data(username):
    records = sheet.get_all_records()
    for record in records:
        if record["Профиль в ТГ"] == username:
            return record  # вернёт словарь с fio и phone
    return None

# --- Добавление или обновление данных пользователя ---
def update_user_data(username, fio, phone):
    records = sheet.get_all_records()
    row = None
    for i, record in enumerate(records, start=2):  # данные со 2-й строки
        if record["Профиль в ТГ"] == username:
            row = i
            break

    now = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    if row:
        # Обновляем существующую запись
        sheet.update_cell(row, 2, fio)
        sheet.update_cell(row, 3, phone)
        sheet.update_cell(row, 4, now)
    else:
        # Добавляем новую запись
        sheet.append_row([username, fio, phone, now])
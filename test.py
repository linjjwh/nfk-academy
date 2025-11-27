from services.google_sheets import get_edu_progress, user_exists

print(get_edu_progress("testuser"))
print(user_exists("testuser"))
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, menu, orders, admin, reviews

app = FastAPI(title="School Canteen API")

# НАСТРОЙКА CORS (Чтобы фронтенд не блокировался)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # В продакшене замени на ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(reviews.router)

@app.get("/")
def home():
    return {"message": "API системы 'Школьная Столовая' работает!"}
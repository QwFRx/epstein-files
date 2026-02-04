# backend/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Путь к файлу базы данных SQLite
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Соединяем путь к папке с именем файла базы данных
DB_PATH = os.path.join(BASE_DIR, "canteen.db")

# 3. Указываем URL для SQLAlchemy (для Windows нужно 3 или 4 слеша)
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
# Создаем "движок" базы данных. 
# check_same_thread=False нужен только для SQLite, так как FastAPI работает в несколько потоков.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Создаем класс для сессий (каждый запрос к API будет открывать свою сессию)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс, от которого будут наследоваться все модели в models.py
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
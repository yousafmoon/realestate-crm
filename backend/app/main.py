from fastapi import FastAPI
from sqlalchemy import text

from app.database import engine
from app.routers.users import router as users_router
from app.routers.auth import router as auth_router
from app.routers.properties import router as properties_router

app = FastAPI(
    title="Real Estate CRM API",
    description="Real Estate CRM built with Python and FastAPI",
    version="1.0.0",
)

app.include_router(users_router)
app.include_router(auth_router)
app.include_router(properties_router)


@app.get("/")
def home():
    return {
        "message": "Real Estate CRM API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/database-test")
def database_test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        value = result.scalar()

    return {
        "database": "connected",
        "result": value
    }
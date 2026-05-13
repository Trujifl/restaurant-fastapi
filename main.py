import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, SessionLocal

from models import order, product, table, user
from models import cash_closing

from routers import product
from routers import table as table_router
from routers import order as order_router
from routers import auth as auth_router
from routers import user as user_router
from routers import cash_closing as cash_closing_router
from routers import report as report_router

from seed import create_default_admin


app = FastAPI(
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://3.137.206.197"
    ).split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    create_default_admin(db)
finally:
    db.close()

app.include_router(product.router)
app.include_router(table_router.router)
app.include_router(order_router.router)
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(cash_closing_router.router)
app.include_router(report_router.router)


@app.get("/")
def home():
    return {"mensaje": "Bienvenido a la API de comandas del restaurante"}


@app.get("/api/health")
def health():
    return {"ok": True}
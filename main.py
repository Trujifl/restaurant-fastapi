from fastapi import FastAPI
from database import Base, engine
from models import order, product, table, user
from routers import product
from routers import table as table_router
from routers import order as order_router
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

allowed_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(product.router)
app.include_router(table_router.router)
app.include_router(order_router.router)

@app.get("/")
def home():
    return {"mensaje": "Bienvenido a la API de comandas del restaurante"}

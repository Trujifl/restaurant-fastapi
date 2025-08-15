from fastapi import FastAPI
from database import Base, engine
from models import order, product, table, user
from routers import product
from routers import table as table_router
from routers import order as order_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://3.137.206.197"],
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

@app.get("/api/health")
def health():
    return {"ok": True}

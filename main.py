from fastapi import FastAPI
from database import Base, engine
from models import order, product, table, user
from routers import product as product_router
from routers import table as table_router
from routers import order as order_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
api = FastAPI()

api.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

api.include_router(product_router.router)
api.include_router(table_router.router)
api.include_router(order_router.router)

@api.get("/health")
def health():
    return {"ok": True}

@api.get("/")
def api_root():
    return {"message": "Restaurant API is running"}

app.mount("/api", api)

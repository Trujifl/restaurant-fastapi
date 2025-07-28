from fastapi import FastAPI
from database import Base, engine  
from models import order, product, table, user 
from routers import product
from routers import table as table_router
from routers import order as order_router

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(product.router)
app.include_router(table_router.router)
app.include_router(order_router.router)


@app.get("/")
def home():
    return {"mensaje": "Bienvenido a la API de comandas del restaurante"}

0) Quick Start
# en la raíz del repo
docker compose build
docker compose up -d
docker compose logs -f api
Start-Process "http://localhost:8000/docs"

1) Git & VS Code
# Clonar el repo
cd $env:USERPROFILE\Documents
git clone https://github.com/Trujifl/restaurant-fastapi.git
cd restaurant-fastapi
code .

# Guardar cambios
git status
git add .
git commit -m "feat: update API or docs"
git push

2) Docker Desktop / Engine
# Verificar Docker
docker version
docker info

# Arrancar Docker Desktop (si no estuviera corriendo)
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# WSL (requisito de Docker en Windows)
wsl --status

3) Docker Compose (API + SQLite)
# Construir y levantar
docker compose build
docker compose up -d

# Ver servicios
docker compose ps

# Logs en vivo
docker compose logs -f api

# Reiniciar el servicio API
docker compose restart api

# Apagar
docker compose down

# Apagar y borrar volúmenes (¡borra DB local!)
docker compose down -v


Notas

Este proyecto usa restaurant.db (SQLite) montado como volumen:

Host: ./restaurant.db

Contenedor: /app/restaurant.db (definido en docker-compose.yml)

4) Inspección dentro del contenedor
# Shell dentro de la API
docker compose exec api sh

# Python REPL dentro del contenedor
docker compose exec api python

# Ver que FastAPI tenga docs activados
docker compose exec api python -c "import main; print('file:', main.__file__); print('openapi:', main.app.openapi_url); print('docs:', main.app.docs_url)"

# Listar archivos y ver parte de main.py en el contenedor
docker compose exec api sh -c "ls -la /app && echo '---' && sed -n '1,140p' /app/main.py"

5) Reconstrucciones/limpieza útiles
# Rebuild sin caché (fuerza copiar código nuevo)
docker compose build --no-cache
docker compose up -d

# Limpiar imágenes colgantes
docker image prune -f

# Limpiar todo lo que no se usa (cuidado)
docker system prune -af

6) Endpoints útiles (API)
# Home
Invoke-WebRequest http://localhost:8000/ -UseBasicParsing | Select-Object -ExpandProperty Content

# OpenAPI JSON
Invoke-WebRequest http://localhost:8000/openapi.json -UseBasicParsing | Select-Object -ExpandProperty StatusCode

# Abrir Swagger en el navegador
Start-Process "http://localhost:8000/docs"

7) Variables de entorno (archivos)

.env (desarrollo local) – ejemplo:

ALLOWED_ORIGINS=http://localhost:5173
APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=sqlite:///./restaurant.db


.env.docker (docker) – ejemplo:

ALLOWED_ORIGINS=http://localhost:5173
APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=sqlite:////app/restaurant.db

8) Desarrollo local (sin Docker) – opcional
# Backend con hot reload (si prefieres fuera de Docker)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (si usas Vite)
cd frontend
npm install
npm run dev
# API apuntando a http://localhost:8000

9) Alembic (si usas migraciones)
# Crear nueva migración
docker compose exec api alembic revision --autogenerate -m "add/change something"

# Aplicar migraciones
docker compose exec api alembic upgrade head

# Volver a una versión específica (ejemplo)
docker compose exec api alembic downgrade -1

10) Problemas comunes & fixes
# "open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified"
# → Docker Desktop no está corriendo
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# 404 en /docs o /openapi.json
# 1) Asegúrate de tener en main.py:
# app = FastAPI(docs_url="/docs", redoc_url="/redoc", openapi_url="/openapi.json")
# 2) Rebuild sin caché
docker compose build --no-cache
docker compose up -d
Start-Process "http://localhost:8000/docs"

# Verificar qué archivo main.py usa el contenedor
docker compose exec api python -c "import main; print(main.__file__)"

11) Comandos rápidos del día a día
# Arrancar todo
docker compose up -d

# Ver logs
docker compose logs -f api

# Reiniciar API tras cambios
docker compose restart api

# Abrir Swagger
Start-Process "http://localhost:8000/docs"
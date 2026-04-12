# EMERGENCY COMMANDS — Restaurant FastAPI

Guárdalo en tu repo como `scripts/EMERGENCY.md`. Son comandos **individuales** para actuar rápido si falla el deploy automático.

---

## 0) Datos del servidor
- IP: `3.137.206.197`
- Usuario: `ubuntu`
- Proyecto en servidor: `/home/ubuntu/restaurant-fastapi`
- Servicio systemd: `restaurant-api`
- API local en servidor: `http://127.0.0.1:8000/api`

---

## 1) Git — Subir cambios manualmente

```bash
# Ver estado
git status

# Agregar todo y commitear
git add -A
git commit -m "Fix/Update"

# Enviar a GitHub (rama main)
git push -u origin main
```

### Configurar identidad (si Git la reclama)
```bash
git config --global user.name "Trujifl"
git config --global user.email "trujicrypto@gmail.com"
```

---

## 2) Despliegue manual en AWS (sin script)

```bash
# Conectarse
ssh ubuntu@3.137.206.197

# En el servidor:
cd ~/restaurant-fastapi
git pull
python3 -m venv ~/.venvs/restaurant || true
source ~/.venvs/restaurant/bin/activate
pip install -r requirements.txt

# Reiniciar servicio
sudo systemctl restart restaurant-api

# Ver estado breve (primeras líneas)
sudo systemctl status restaurant-api --no-pager -l | sed -n '1,20p'
```

---

## 3) Comprobar salud de la API

```bash
# Desde el servidor
curl -s http://127.0.0.1:8000/api/health

# Desde tu PC (reemplaza IP si usas dominio/proxy)
curl -s http://3.137.206.197:8000/api/health
```

Si responde `{"ok": true}`, está arriba.

---

## 4) Logs y diagnóstico rápido

```bash
# Últimas 100 líneas del servicio
sudo journalctl -u restaurant-api -n 100 --no-pager

# Seguir logs en tiempo real
sudo journalctl -u restaurant-api -f

# Ver errores de uvicorn si los hay
sudo journalctl -u restaurant-api | grep -i error | tail -n 50
```

---

## 5) Control del servicio (systemd)

```bash
# Estado
sudo systemctl status restaurant-api --no-pager -l

# Reiniciar
sudo systemctl restart restaurant-api

# Habilitar al arranque
sudo systemctl enable restaurant-api

# Deshabilitar (no iniciar al boot)
sudo systemctl disable restaurant-api
```

---

## 6) Editar/recargar unidad systemd

```bash
# Editar archivo del servicio
sudo nano /etc/systemd/system/restaurant-api.service

# Recargar y reiniciar
sudo systemctl daemon-reload
sudo systemctl restart restaurant-api
```

**Sugerencia de ExecStart (ejemplo robusto):**
```
ExecStart=/home/ubuntu/.venvs/restaurant/bin/uvicorn --app-dir /home/ubuntu/restaurant-fastapi main:app --host 0.0.0.0 --port 8000
```

> Si montas sub-app en `/api` desde el código (recomendado), NO uses `--root-path` aquí.

---

## 7) Chequeo de dependencias y entorno (servidor)

```bash
# Activar venv
source ~/.venvs/restaurant/bin/activate

# Instalar/actualizar deps
pip install .

# Ver versión de Python y uvicorn
python --version
uvicorn --version
```

---

## 8) Alembic — Migraciones (si cambian los modelos)

```bash
# Crear nueva migración auto-generada
alembic revision --autogenerate -m "descripcion del cambio"

# Aplicar migraciones pendientes
alembic upgrade head

# Deshacer la última (con cuidado)
alembic downgrade -1
```

---

## 9) Endpoints útiles de verificación

```bash
# Documentación
curl -I http://127.0.0.1:8000/docs
curl -I http://127.0.0.1:8000/api/docs

# Raíz API (si configuraste un mensaje)
curl -s http://127.0.0.1:8000/api/
```

---

## 10) Fallos frecuentes y soluciones rápidas

**A) 404 en /api/health**
- Asegúrate de tener en `main.py` una sub-app montada o ruta `/api/health`.
- Prueba local en el server: `curl -s http://127.0.0.1:8000/api/health`.

**B) Servicio no levanta tras reinicio**
- Ver logs: `sudo journalctl -u restaurant-api -n 100 --no-pager`.
- Revisa la ruta de `--app-dir`, el intérprete de Python del venv y permisos del proyecto.

**C) Cambios no llegan al server**
- Ejecuta `git pull` dentro de `~/restaurant-fastapi`.
- Verifica rama: `git branch -vv` y remoto: `git remote -v`.

**D) Problemas CORS desde frontend**
- Confirma `allow_origins` en tu `main.py` (ej. `http://localhost:5173` o tu dominio).

**E) Paquetes faltantes**
- Activa venv y corre `pip install -r requirements.txt`.

---

## 11) Comandos de emergencia ultra-rápidos

```bash
# Despliegue completo en 4 líneas (servidor)
ssh ubuntu@3.137.206.197 "cd ~/restaurant-fastapi && git pull && source ~/.venvs/restaurant/bin/activate && pip install -r requirements.txt && sudo systemctl restart restaurant-api && sleep 2 && curl -s http://127.0.0.1:8000/api/health"
```

```bash
# Solo reiniciar y verificar salud (servidor)
ssh ubuntu@3.137.206.197 "sudo systemctl restart restaurant-api && sleep 2 && curl -s http://127.0.0.1:8000/api/health"
```

---

## 12) Dónde guardar este documento
- En el repo, ruta sugerida: `scripts/EMERGENCY.md`.
- Para abrir rápido:
  ```bash
  nano scripts/EMERGENCY.md
  ```

---

Fin.

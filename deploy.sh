#!/bin/bash

# Subir cambios a GitHub
git add .
git commit -m "Actualización del proyecto"
git push

# Conectarse al servidor y actualizar
ssh ubuntu@3.137.206.197 "
cd ~/restaurant-fastapi && \
git pull && \
sudo systemctl restart restaurant-api && \
sudo systemctl status restaurant-api --no-pager -l
"

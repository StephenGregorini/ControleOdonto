FROM python:3.11-slim
WORKDIR /app
# Copia o arquivo de requisitos e instala
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# COPIA a pasta backend INTEIRA para /app/backend
COPY backend/ ./backend
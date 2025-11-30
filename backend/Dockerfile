# backend/Dockerfile

FROM python:3.11-slim

# Diretório de trabalho dentro do container
WORKDIR /app

# 👉 Repara: agora uso backend/requirements.txt,
# porque o build context é o raiz do repo.
COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o backend pra dentro do container
COPY backend .

# Porta que o Railway injeta via variável PORT
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

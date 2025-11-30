# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copia dependências e instala
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o backend
COPY backend .

# Porta usada pelo Vercel (define a env PORT automaticamente)
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Executa FastAPI com uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]

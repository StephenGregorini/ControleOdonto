FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway injeta a variável $PORT automaticamente
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port",]()

FROM python:3.11-slim

# Define o diretório de trabalho para a aplicação
WORKDIR /app

# Copia apenas o arquivo de requisitos primeiro para aproveitar o cache do Docker
# Assumindo que o contexto do build é a raiz do projeto, e o arquivo está em 'backend/requirements.txt'
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o resto do código da aplicação
# Copia o conteúdo da pasta 'backend' do seu repositório para o diretório de trabalho atual (/app) na imagem
COPY backend/ .

# Expõe a porta que o uvicorn usará
EXPOSE 8000

# Comando para iniciar a aplicação
# Executa uvicorn a partir do WORKDIR (/app), apontando para o módulo main.py (main:app)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
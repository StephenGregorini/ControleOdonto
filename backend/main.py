import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from processor import processar_excel

app = FastAPI(
    title="API de Importação de Clínicas",
    description="Processa arquivos Excel e importa os dados para o Supabase.",
    version="1.0.0"
)

# Configuração do CORS para permitir requisições do frontend (React)
# Em produção, restrinja para o domínio do seu frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todas as origens
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos
    allow_headers=["*"],  # Permite todos os headers
)

@app.get("/", include_in_schema=False)
async def root():
    """Redireciona a raiz para a documentação da API."""
    return RedirectResponse(url="/docs")

@app.get("/status", summary="Verifica o status da API", tags=["Status"])
async def get_status():
    """Endpoint de health check."""
    return {"status": "ok", "message": "API está no ar!"}

@app.post("/upload", summary="Upload e processamento de arquivo Excel", tags=["Importação"])
async def upload_and_process_file(file: UploadFile = File(...)):
    """
    Recebe um arquivo Excel (.xlsx), processa os dados e os envia para o Supabase.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Formato de arquivo inválido. Por favor, envie um arquivo .xlsx ou .xls")

    try:
        contents = await file.read()
        result = processar_excel(contents)
        return JSONResponse(status_code=200, content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro ao processar o arquivo: {str(e)}")
import os
import asyncio
import math
import re
from datetime import datetime, timedelta
import pandas as pd
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from processor import processar_excel
from io import BytesIO, StringIO
import csv
from openpyxl import Workbook
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse

# ==========================
# ENV LOADING
# ==========================

BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BASE_DIR, "..", ".env"), override=False)
load_dotenv(os.path.join(BASE_DIR, ".env.local"), override=True)

# ==========================
# CONFIG SUPABASE
# ==========================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
REDASH_BASE_URL = os.getenv("REDASH_BASE_URL")
REDASH_API_KEY = os.getenv("REDASH_API_KEY")
REDASH_QUERY_ID = os.getenv("REDASH_QUERY_ID") or "1501"

if not SUPABASE_URL:
    raise RuntimeError("⚠️ Defina SUPABASE_URL no .env")

# remover "db." se vier na URL
if "db." in SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.replace("db.", "")

if not SERVICE_ROLE_KEY:
    raise RuntimeError("⚠️ Defina SUPABASE_SERVICE_ROLE_KEY no .env")

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

class LimiteAprovadoPayload(BaseModel):
    limite_aprovado: float | None = None
    observacao: str | None = None
    aprovado_por: str | None = None
    class Config:
        extra = "ignore"

# Registro de uso de limite aprovado
class LimiteUtilizacaoPayload(BaseModel):
    valor_utilizado: float
    observacao: Optional[str] = None
    registrado_por: Optional[str] = None
    data_referencia: Optional[str] = None  # YYYY-MM-DD opcional

    class Config:
        extra = "ignore"


class AntecipacaoPayload(BaseModel):
    clinica_id: str
    cnpj: Optional[str] = None
    data_antecipacao: Optional[str] = None  # YYYY-MM-DD
    valor_liquido: float
    valor_taxa: Optional[float] = None
    valor_a_pagar: Optional[float] = None
    data_reembolso: Optional[str] = None  # YYYY-MM-DD
    observacao: Optional[str] = None
    registrado_por: Optional[str] = None

    class Config:
        extra = "ignore"


class ReembolsoPayload(BaseModel):
    data_reembolso: Optional[str] = None

    class Config:
        extra = "ignore"

# Payload for export endpoints
class ExportPayload(BaseModel):
    months: List[str]
    columns: List[str]
    view_type: str = "consolidado"
    clinica_ids: Optional[List[str]] = None

    class Config:
        extra = "ignore"

# New Pydantic Models for Dashboard Data
class DashboardFiltrosPeriodo(BaseModel):
    min_mes_ref: Optional[str] = None
    max_mes_ref: Optional[str] = None

    class Config:
        extra = "ignore"

class DashboardContext(BaseModel):
    clinica_id: Optional[str] = None
    clinica_nome: Optional[str] = None
    clinica_codigo: Optional[str] = None
    clinica_nome_real: Optional[str] = None
    class Config:
        extra = "ignore"

class DashboardKpis(BaseModel):
    score_atual: Optional[float] = None
    score_mes_anterior: Optional[float] = None
    score_variacao_vs_m1: Optional[float] = None
    categoria_risco: Optional[str] = None

    limite_aprovado: Optional[float] = None
    limite_utilizado: Optional[float] = None
    limite_disponivel: Optional[float] = None

    # NOVOS CAMPOS DO PERÍODO FILTRADO
    valor_total_emitido_periodo: Optional[float] = None
    valor_emitido_ultimo_mes: Optional[float] = None

    inadimplencia_media_periodo: Optional[float] = None
    inadimplencia_ultimo_mes: Optional[float] = None

    taxa_pago_no_vencimento_media_periodo: Optional[float] = None
    taxa_pago_no_vencimento_ultimo_mes: Optional[float] = None

    ticket_medio_periodo: Optional[float] = None
    ticket_medio_ultimo_mes: Optional[float] = None

    tempo_medio_pagamento_media_periodo: Optional[float] = None
    tempo_medio_pagamento_ultimo_mes: Optional[float] = None

    # Limite sugerido
    limite_sugerido: Optional[float] = None
    limite_sugerido_base_media12m: Optional[float] = None
    limite_sugerido_base_media3m: Optional[float] = None
    limite_sugerido_base_ultimo_mes: Optional[float] = None
    limite_sugerido_base_mensal_mix: Optional[float] = None
    limite_sugerido_fator: Optional[float] = None
    limite_sugerido_teto_global: Optional[float] = None
    limite_sugerido_share_portfolio_12m: Optional[float] = None
    class Config:
        extra = "ignore"


class DashboardSeries(BaseModel):
    score_por_mes: Optional[List[Dict[str, Any]]] = None
    valor_emitido_por_mes: Optional[List[Dict[str, Any]]] = None
    inadimplencia_por_mes: Optional[List[Dict[str, Any]]] = None
    taxa_pago_no_vencimento_por_mes: Optional[List[Dict[str, Any]]] = None
    tempo_medio_pagamento_por_mes: Optional[List[Dict[str, Any]]] = None
    parcelas_media_por_mes: Optional[List[Dict[str, Any]]] = None
    class Config:
        extra = "ignore"

class DashboardRankingClinicas(BaseModel):
    clinica_id: Optional[str] = None
    clinica_nome: Optional[str] = None
    clinica_codigo: Optional[str] = None
    clinica_nome_real: Optional[str] = None
    cnpj: Optional[str] = None
    score_credito: Optional[float] = None
    categoria_risco: Optional[str] = None
    limite_aprovado: Optional[float] = None
    limite_utilizado: Optional[float] = None
    limite_disponivel: Optional[float] = None
    limite_sugerido: Optional[float] = None
    valor_total_emitido_periodo: Optional[float] = None
    inadimplencia_media_periodo: Optional[float] = None
    class Config:
        extra = "ignore"

class DashboardData(BaseModel):
    filtros: Dict[str, DashboardFiltrosPeriodo]
    contexto: DashboardContext
    kpis: DashboardKpis
    series: DashboardSeries
    ranking_clinicas: List[DashboardRankingClinicas]
    limite_motor: Optional[Dict[str, Any]] = None

    class Config:
        extra = "ignore"



# ==========================
# FASTAPI APP
# ==========================

app = FastAPI(title="MedSimples · Importação de dados")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://medsimples-controleodonto.up.railway.app",
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_lock = asyncio.Lock()

@app.get("/")
def read_root():
    return {"status": "ok"}



# ==========================
# HELPERS SUPABASE
# ==========================


def supabase_post(table: str, data: dict, on_conflict: str | None = None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    params = {}
    if on_conflict:
        params["on_conflict"] = on_conflict

    r = requests.post(
        url,
        headers={**HEADERS, "Prefer": "return=representation"},
        params=params,
        json=data,
    )

    if r.status_code not in (200, 201):
        raise RuntimeError(f"Erro ao enviar para {table}: {r.status_code} - {r.text}")

    try:
        return r.json()[0]
    except Exception:
        return None


def supabase_patch(table: str, data: dict, match: dict):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    params = {}
    for key, value in match.items():
        params[key] = f"eq.{value}"

    r = requests.patch(
        url,
        headers={**HEADERS, "Prefer": "return=representation"},
        params=params,
        json=data,
    )

    if r.status_code not in (200, 204):
        raise RuntimeError(f"Erro ao atualizar {table}: {r.status_code} - {r.text}")

    try:
        json_data = r.json()
        return json_data[0] if json_data else None
    except Exception:
        return None


def supabase_get(table: str, select: str = "*", extra_params: dict | None = None):
    """GET simples no PostgREST, retornando lista de dicts."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"

    params = {"select": select}
    if extra_params:
        params.update(extra_params)

    r = requests.get(url, headers=HEADERS, params=params)

    if r.status_code not in (200, 206):
        raise RuntimeError(f"Erro ao buscar {table}: {r.status_code} - {r.text}")

    return r.json()


def supabase_get_all(
    table: str,
    select: str = "*",
    extra_params: dict | None = None,
    page_size: int = 1000,
):
    all_rows = []
    offset = 0
    while True:
        params = {"select": select, "limit": str(page_size), "offset": str(offset)}
        if extra_params:
            params.update(extra_params)
        r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, params=params)
        if r.status_code not in (200, 206):
            raise RuntimeError(f"Erro ao buscar {table}: {r.status_code} - {r.text}")
        rows = r.json()
        all_rows.extend(rows)
        if len(rows) < page_size:
            break
        offset += page_size
    return all_rows


def supabase_delete(table: str, extra_params: dict | None = None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    params = {}
    if extra_params:
        params.update(extra_params)
    r = requests.delete(url, headers=HEADERS, params=params)
    if r.status_code not in (200, 204):
        raise RuntimeError(f"Erro ao deletar {table}: {r.status_code} - {r.text}")


def _parse_brl_number(value: str | None):
    if value is None:
        return None
    txt = str(value).strip()
    if not txt:
        return None
    txt = txt.replace(".", "").replace(",", ".")
    try:
        return float(txt)
    except Exception:
        return None


def _parse_number_flexible(value: str | None):
    if value is None:
        return None
    txt = str(value).strip()
    if not txt:
        return None
    if "," in txt and "." in txt:
        txt = txt.replace(".", "").replace(",", ".")
    elif "," in txt:
        txt = txt.replace(",", ".")
    try:
        return float(txt)
    except Exception:
        return None


def _parse_date_br(value: str | None):
    if value is None:
        return None
    txt = str(value).strip()
    if not txt:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(txt, fmt).date().isoformat()
        except Exception:
            continue
    try:
        normalized = txt.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized).date().isoformat()
    except Exception:
        pass
    try:
        serial = float(txt)
        base = datetime(1899, 12, 30)
        return (base + timedelta(days=int(serial))).date().isoformat()
    except Exception:
        return None


def _normalize_header(value: str):
    return (value or "").strip().lower()


def _normalize_cnpj(value: str | None):
    if value is None:
        return ""
    return re.sub(r"\D", "", str(value))


def get_limite_utilizado_atual(clinica_id: str):
    try:
        rows = supabase_get_all(
            "antecipacoes",
            select="valor_liquido,data_reembolso",
            extra_params={
                "clinica_id": f"eq.{clinica_id}",
            },
        )
        total_antecipado = 0.0
        total_reembolsado = 0.0
        for row in rows or []:
            valor = _safe_float(row.get("valor_liquido")) or 0.0
            total_antecipado += valor
            if row.get("data_reembolso"):
                total_reembolsado += valor
        aberto = max(total_antecipado - total_reembolsado, 0.0)
        return aberto
    except Exception:
        return None
    return None


def get_limite_aprovado_atual(clinica_id: str):
    try:
        rows = supabase_get(
            "clinica_limite",
            select="limite_aprovado",
            extra_params={
                "clinica_id": f"eq.{clinica_id}",
                "order": "aprovado_em.desc",
                "limit": "1",
            },
        )
        if rows:
            return _safe_float(rows[0].get("limite_aprovado"))
    except Exception:
        return None
    return None


def to_df(rows, columns=None):
    if not rows:
        return pd.DataFrame(columns=columns or [])
    df = pd.DataFrame(rows)
    return df


# ==========================
# ENDPOINTS BÁSICOS
# ==========================


@app.get("/ping")
def ping():
    return {"status": "ok"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Recebe um arquivo Excel (.xlsx), processa e insere os dados no Supabase.
    """
    try:
        async with upload_lock:
            contents = await file.read()
            resultado = processar_excel(contents, arquivo_nome=file.filename)
            return resultado
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar o arquivo: {e}",
        )


@app.post("/clinicas/{clinica_id}/limite_aprovado")
async def definir_limite_aprovado(clinica_id: str, payload: LimiteAprovadoPayload):

    if payload.limite_aprovado is None:
        # Registro de revogação
        row = {
            "clinica_id": clinica_id,
            "limite_aprovado": None,
            "observacao": "Limite revogado",
            "aprovado_por": payload.aprovado_por,
        }
    else:
        # Registro de aprovação normal
        row = {
            "clinica_id": clinica_id,
            "limite_aprovado": float(payload.limite_aprovado),
            "observacao": payload.observacao or None,
            "aprovado_por": payload.aprovado_por,
        }


    try:
        inserido = supabase_post("clinica_limite", row)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"ok": True, "registro": inserido}


@app.get("/clinicas/{clinica_id}/limites")
async def listar_limites_clinica(clinica_id: str):
    """
    Retorna o histórico de limites aprovados de uma clínica,
    do mais recente para o mais antigo.
    """
    try:
        rows = supabase_get_all(
            "clinica_limite",
            select=(
                "limite_aprovado,"
                "faturamento_base,"
                "score_base,"
                "aprovado_em,"
                "aprovado_por,"
                "observacao"
            ),
            extra_params={
                "clinica_id": f"eq.{clinica_id}",
                "order": "aprovado_em.desc",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar limites da clínica: {e}",
        )

    return rows


@app.post("/clinicas/{clinica_id}/limite_utilizacao")
async def registrar_limite_utilizacao(clinica_id: str, payload: LimiteUtilizacaoPayload):
    raise HTTPException(
        status_code=410,
        detail="Registro manual de uso desativado. Use antecipações.",
    )
    try:
        limite_rows = supabase_get(
            "clinica_limite",
            select="limite_aprovado",
            extra_params={
                "clinica_id": f"eq.{clinica_id}",
                "order": "aprovado_em.desc",
                "limit": "1",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar limite aprovado: {e}")

    limite_aprovado = None
    if limite_rows:
        limite_aprovado = _safe_float(limite_rows[0].get("limite_aprovado"))

    if limite_aprovado is None:
        raise HTTPException(
            status_code=400,
            detail="É necessário aprovar um limite antes de registrar uso.",
        )

    utilizado_atual = get_limite_utilizado_atual(clinica_id) or 0.0
    valor_novo = _safe_float(payload.valor_utilizado) or 0.0
    disponivel = max(limite_aprovado - utilizado_atual, 0.0)

    if valor_novo <= 0:
        raise HTTPException(status_code=400, detail="Valor utilizado inválido.")

    if valor_novo > disponivel:
        raise HTTPException(
            status_code=400,
            detail="Valor utilizado excede o limite disponível.",
        )

    data_referencia = payload.data_referencia or datetime.utcnow().strftime("%Y-%m-%d")
    row = {
        "clinica_id": clinica_id,
        "valor_utilizado": float(valor_novo),
        "data_referencia": data_referencia,
        "observacao": payload.observacao,
        "registrado_por": payload.registrado_por,
    }

    try:
        inserido = supabase_post("limite_utilizacoes", row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao registrar uso: {e}")

    return {"ok": True, "registro": inserido}


@app.get("/clinicas/{clinica_id}/limite_utilizacao")
async def listar_limite_utilizacao(clinica_id: str):
    try:
        rows = supabase_get_all(
            "limite_utilizacoes",
            select="valor_utilizado,data_referencia,criado_em,observacao,registrado_por",
            extra_params={
                "clinica_id": f"eq.{clinica_id}",
                "order": "criado_em.desc",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar uso: {e}")

    return rows


@app.get("/antecipacoes/resumo")
async def resumo_antecipacoes(clinica_id: str | None = None):
    try:
        antecipacoes = supabase_get_all(
            "antecipacoes",
            select="clinica_id,cnpj,valor_liquido,data_reembolso",
        )
        limites = supabase_get_all(
            "clinica_limite",
            select="clinica_id,limite_aprovado,aprovado_em",
        )
        clinicas_rows = supabase_get_all(
            "clinicas",
            select="id,codigo_clinica,nome,cnpj",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar antecipações: {e}")

    df_ant = to_df(antecipacoes, ["clinica_id", "cnpj", "valor_liquido", "data_reembolso"])
    df_lim = to_df(limites, ["clinica_id", "limite_aprovado", "aprovado_em"])
    df_clin = to_df(clinicas_rows, ["id", "codigo_clinica", "nome", "cnpj"])

    if not df_lim.empty:
        df_lim["aprovado_em"] = pd.to_datetime(df_lim["aprovado_em"], errors="coerce")
        df_lim = df_lim.sort_values("aprovado_em").drop_duplicates(
            subset=["clinica_id"], keep="last"
        )

    if not df_ant.empty:
        df_ant["valor_liquido"] = pd.to_numeric(df_ant["valor_liquido"], errors="coerce").fillna(0)
        df_ant["reembolsado"] = df_ant["data_reembolso"].notna()

    resumo = []
    clinicas_map = {}
    if not df_clin.empty:
        for _, row in df_clin.iterrows():
            cid = _safe_str(row.get("id"))
            if not cid:
                continue
            clinicas_map[cid] = {
                "clinica_nome": _safe_str(row.get("codigo_clinica"))
                or _safe_str(row.get("nome")),
                "clinica_nome_real": _safe_str(row.get("nome")),
                "cnpj": _safe_str(row.get("cnpj")),
            }

    limite_map = {}
    if not df_lim.empty:
        for _, row in df_lim.iterrows():
            limite_map[_safe_str(row.get("clinica_id"))] = _safe_float(row.get("limite_aprovado"))

    clinica_ids = set(limite_map.keys()) | set(df_ant["clinica_id"].dropna().astype(str)) if not df_ant.empty else set(limite_map.keys())
    if clinica_id:
        clinica_ids = {clinica_id}

    for cid in clinica_ids:
        df_c = df_ant[df_ant["clinica_id"].astype(str) == str(cid)] if not df_ant.empty else pd.DataFrame()
        total_antecipado = float(df_c["valor_liquido"].sum()) if not df_c.empty else 0.0
        total_reembolsado = float(df_c[df_c["reembolsado"]]["valor_liquido"].sum()) if not df_c.empty else 0.0
        aberto = max(total_antecipado - total_reembolsado, 0.0)
        limite_aprovado = limite_map.get(str(cid))
        saldo = None
        perc = None
        if limite_aprovado is not None:
            saldo = max(limite_aprovado - aberto, 0.0)
            if limite_aprovado > 0:
                perc = saldo / limite_aprovado
        clin_info = clinicas_map.get(str(cid), {})
        resumo.append({
            "clinica_id": str(cid),
            "clinica_nome": clin_info.get("clinica_nome"),
            "clinica_nome_real": clin_info.get("clinica_nome_real"),
            "cnpj": clin_info.get("cnpj"),
            "limite_aprovado": limite_aprovado,
            "total_antecipado": total_antecipado,
            "total_reembolsado": total_reembolsado,
            "em_aberto": aberto,
            "saldo_antecipavel": saldo,
            "percent_antecipavel": perc,
        })

    resumo = sorted(resumo, key=lambda x: (x.get("clinica_nome") or ""))
    return resumo


@app.get("/antecipacoes")
async def listar_antecipacoes(clinica_id: str | None = None):
    try:
        params = {"order": "data_antecipacao.desc"}
        if clinica_id:
            params["clinica_id"] = f"eq.{clinica_id}"
        rows = supabase_get_all(
            "antecipacoes",
            select=(
                "id,clinica_id,cnpj,data_antecipacao,valor_liquido,valor_taxa,valor_a_pagar,"
                "data_reembolso,data_reembolso_programada,data_pagamento_antecipacao,"
                "data_pagamento_reembolso,data_evento,data_solicitacao,valor_bruto,"
                "observacao,registrado_por,criado_em,redash_id"
            ),
            extra_params=params,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar antecipações: {e}")
    return rows


@app.post("/antecipacoes")
async def registrar_antecipacao(payload: AntecipacaoPayload):
    limite_aprovado = get_limite_aprovado_atual(payload.clinica_id)
    if limite_aprovado is None:
        raise HTTPException(
            status_code=400,
            detail="É necessário aprovar um limite antes de registrar antecipação.",
        )

    today = datetime.utcnow().date().isoformat()
    try:
        inadimplente_rows = supabase_get_all(
            "antecipacoes",
            select="id",
            extra_params={
                "clinica_id": f"eq.{payload.clinica_id}",
                "data_reembolso_programada": f"lt.{today}",
                "data_reembolso": "is.null",
                "data_pagamento_reembolso": "is.null",
                "limit": "1",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao validar inadimplência: {e}",
        )
    if inadimplente_rows:
        raise HTTPException(
            status_code=400,
            detail="Clínica inadimplente: há reembolsos em atraso. Regularize antes de antecipar.",
        )

    try:
        existentes = supabase_get_all(
            "antecipacoes",
            select="valor_liquido,data_reembolso",
            extra_params={"clinica_id": f"eq.{payload.clinica_id}"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao validar saldo: {e}")

    df_exist = to_df(existentes, ["valor_liquido", "data_reembolso"])
    total_antecipado = 0.0
    total_reembolsado = 0.0
    if not df_exist.empty:
        df_exist["valor_liquido"] = pd.to_numeric(df_exist["valor_liquido"], errors="coerce").fillna(0)
        total_antecipado = float(df_exist["valor_liquido"].sum())
        total_reembolsado = float(
            df_exist[df_exist["data_reembolso"].notna()]["valor_liquido"].sum()
        )
    em_aberto = max(total_antecipado - total_reembolsado, 0.0)
    saldo = max(limite_aprovado - em_aberto, 0.0)

    valor_liquido = _safe_float(payload.valor_liquido) or 0.0
    if valor_liquido <= 0:
        raise HTTPException(status_code=400, detail="Valor líquido inválido.")
    if valor_liquido > saldo:
        raise HTTPException(
            status_code=400,
            detail="Valor líquido excede o saldo antecipável.",
        )

    data_antecipacao = payload.data_antecipacao or datetime.utcnow().strftime("%Y-%m-%d")
    row = {
        "clinica_id": payload.clinica_id,
        "cnpj": payload.cnpj,
        "data_antecipacao": data_antecipacao,
        "valor_liquido": valor_liquido,
        "valor_taxa": _safe_float(payload.valor_taxa),
        "valor_a_pagar": _safe_float(payload.valor_a_pagar),
        "data_reembolso": payload.data_reembolso,
        "observacao": payload.observacao,
        "registrado_por": payload.registrado_por,
    }

    try:
        inserido = supabase_post("antecipacoes", row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao registrar antecipação: {e}")

    return {"ok": True, "registro": inserido}


@app.patch("/antecipacoes/{antecipacao_id}/reembolso")
async def marcar_reembolso(antecipacao_id: str, payload: ReembolsoPayload):
    data_reembolso = payload.data_reembolso or datetime.utcnow().strftime("%Y-%m-%d")
    try:
        atualizado = supabase_patch(
            "antecipacoes",
            {"data_reembolso": data_reembolso},
            {"id": antecipacao_id},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao marcar reembolso: {e}")
    return {"ok": True, "registro": atualizado}


@app.post("/antecipacoes/import-csv")
async def importar_antecipacoes_csv(
    file: UploadFile = File(...),
    force: bool = False,
):
    try:
        raw = await file.read()
        try:
            text = raw.decode("utf-8-sig")
        except Exception:
            text = raw.decode("latin-1")

        first_line = text.splitlines()[0] if text else ""
        delimiter = ";" if ";" in first_line else ","
        reader = csv.DictReader(text.splitlines(), delimiter=delimiter)

        clinicas_rows = supabase_get_all("clinicas", select="id,cnpj,nome,codigo_clinica")
        clinicas_map = {
            _normalize_cnpj(r.get("cnpj")): _safe_str(r.get("id"))
            for r in (clinicas_rows or [])
            if r.get("cnpj") and r.get("id")
        }
        clinicas_nome_map = {
            _safe_str(r.get("id")): _safe_str(r.get("codigo_clinica"))
            or _safe_str(r.get("nome"))
            for r in (clinicas_rows or [])
            if r.get("id")
        }
        clinicas_nome_real_map = {
            _safe_str(r.get("id")): _safe_str(r.get("nome"))
            for r in (clinicas_rows or [])
            if r.get("id")
        }
        clinicas_cnpj_map = {
            _safe_str(r.get("id")): _safe_str(r.get("cnpj"))
            for r in (clinicas_rows or [])
            if r.get("id") and r.get("cnpj")
        }

        rows = list(reader)
        total_rows = len(rows)
        if not rows:
            raise HTTPException(status_code=400, detail="CSV vazio ou inválido.")

        header_map = {}
        if reader.fieldnames:
            for field in reader.fieldnames:
                header_map[_normalize_header(field)] = field

        def get_value(row, options):
            for opt in options:
                key = header_map.get(_normalize_header(opt))
                if key and key in row:
                    return row.get(key)
            return None

        payloads = []
        errors = []
        skipped = 0

        clinica_ids = set()
        clinica_counts = {}
        min_date = None
        max_date = None
        for idx, row in enumerate(rows, start=2):
            cnpj = _normalize_cnpj(get_value(row, ["cnpj"]))
            clinica_id = clinicas_map.get(cnpj)
            if not clinica_id:
                skipped += 1
                errors.append({"linha": idx, "cnpj": cnpj, "erro": "CNPJ não encontrado"})
                continue
            clinica_ids.add(clinica_id)
            clinica_counts[clinica_id] = clinica_counts.get(clinica_id, 0) + 1
            data_antecipacao = _parse_date_br(
                get_value(row, ["data antecipação", "data antecipacao", "data"])
            )
            if data_antecipacao:
                try:
                    data_obj = datetime.fromisoformat(data_antecipacao).date()
                    if not min_date or data_obj < min_date:
                        min_date = data_obj
                    if not max_date or data_obj > max_date:
                        max_date = data_obj
                except Exception:
                    pass

        limites_map = {}
        aberto_map = {}
        existing_keys = set()
        if clinica_ids:
            ids_in = ",".join(sorted(clinica_ids))

            limite_rows = supabase_get_all(
                "clinica_limite",
                select="clinica_id,limite_aprovado,aprovado_em",
                extra_params={"clinica_id": f"in.({ids_in})", "order": "aprovado_em.desc"},
            )
            for row in limite_rows or []:
                cid = _safe_str(row.get("clinica_id"))
                if cid and cid not in limites_map:
                    limites_map[cid] = _safe_float(row.get("limite_aprovado"))

            if not force:
                missing_clinicas = []
                for cid in sorted(clinica_ids):
                    if limites_map.get(cid) is None:
                        missing_clinicas.append(
                            {
                                "clinica_id": cid,
                                "clinica_nome": clinicas_nome_map.get(cid),
                                "clinica_nome_real": clinicas_nome_real_map.get(cid),
                                "cnpj": clinicas_cnpj_map.get(cid),
                                "linhas": clinica_counts.get(cid, 0),
                            }
                        )
                if missing_clinicas:
                    raise HTTPException(
                        status_code=400,
                        detail={
                            "message": "Existem clínicas no CSV sem limite aprovado. Aprove o limite antes de importar.",
                            "missing_clinicas": missing_clinicas,
                        },
                    )

            antecipacoes_rows = supabase_get_all(
                "antecipacoes",
                select="clinica_id,valor_liquido,data_reembolso",
                extra_params={"clinica_id": f"in.({ids_in})"},
            )
            df_ant = to_df(
                antecipacoes_rows, ["clinica_id", "valor_liquido", "data_reembolso"]
            )
            if not df_ant.empty:
                df_ant["valor_liquido"] = pd.to_numeric(
                    df_ant["valor_liquido"], errors="coerce"
                ).fillna(0)
                df_ant["reembolsado"] = df_ant["data_reembolso"].notna()
                for cid, group in df_ant.groupby("clinica_id"):
                    total_antecipado = float(group["valor_liquido"].sum())
                    total_reembolsado = float(
                        group[group["reembolsado"]]["valor_liquido"].sum()
                    )
                    aberto_map[_safe_str(cid)] = max(
                        total_antecipado - total_reembolsado, 0.0
                    )

            existente_params = {"clinica_id": f"in.({ids_in})"}
            if min_date and max_date:
                existente_params["and"] = (
                    f"(data_antecipacao.gte.{min_date},data_antecipacao.lte.{max_date})"
                )
            existente_rows = supabase_get_all(
                "antecipacoes",
                select="clinica_id,data_antecipacao,valor_liquido,valor_taxa,valor_a_pagar,data_reembolso",
                extra_params=existente_params,
            )

            def make_dup_key(
                clinica_id_val,
                data_val,
                valor_liq_val,
                valor_taxa_val,
                valor_pagar_val,
                data_reemb_val,
            ):
                def num(v):
                    f = _safe_float(v)
                    if f is None:
                        return "0.00"
                    return f"{round(f, 2):.2f}"

                return "|".join(
                    [
                        _safe_str(clinica_id_val) or "",
                        _safe_str(data_val) or "",
                        num(valor_liq_val),
                        num(valor_taxa_val),
                        num(valor_pagar_val),
                        _safe_str(data_reemb_val) or "",
                    ]
                )

            for row in existente_rows or []:
                existing_keys.add(
                    make_dup_key(
                        row.get("clinica_id"),
                        row.get("data_antecipacao"),
                        row.get("valor_liquido"),
                        row.get("valor_taxa"),
                        row.get("valor_a_pagar"),
                        row.get("data_reembolso"),
                    )
                )

        for idx, row in enumerate(rows, start=2):
            cnpj = _normalize_cnpj(get_value(row, ["cnpj"]))
            clinica_id = clinicas_map.get(cnpj)
            if not clinica_id:
                continue

            data_antecipacao = _parse_date_br(
                get_value(row, ["data antecipação", "data antecipacao", "data", "data pagamento da antecipação"])
            )
            data_reembolso = _parse_date_br(
                get_value(row, ["data reembolso", "data pagamento do reembolso"])
            )
            data_reembolso_programada = _parse_date_br(
                get_value(row, ["data pagamento original / reembolso programada", "data pagamento original", "reembolso programada"])
            )
            data_solicitacao = _parse_date_br(
                get_value(row, ["data solicitacao da antecipação", "data solicitacao"])
            )
            data_evento = _parse_date_br(get_value(row, ["data evento"]))
            valor_liquido = _parse_brl_number(
                get_value(row, ["moneydetails_net", "net", "moneydetails net"])
            )
            valor_taxa = _parse_brl_number(
                get_value(row, ["moneydetails_fee", "fee", "taxa"])
            )
            valor_a_pagar = _parse_brl_number(
                get_value(row, ["moneydetails_tobepaid", "to be paid", "a pagar"])
            )
            valor_bruto = _parse_brl_number(
                get_value(row, ["valor bruto", "cost_value"])
            )

            if valor_liquido is None or valor_liquido <= 0:
                skipped += 1
                errors.append({"linha": idx, "cnpj": cnpj, "erro": "Valor líquido inválido"})
                continue

            dup_key = make_dup_key(
                clinica_id,
                data_antecipacao,
                valor_liquido,
                valor_taxa,
                valor_a_pagar,
                data_reembolso,
            )
            if dup_key in existing_keys:
                skipped += 1
                errors.append({"linha": idx, "cnpj": cnpj, "erro": "Duplicado"})
                continue
            existing_keys.add(dup_key)

            if not force:
                limite_aprovado = limites_map.get(clinica_id)
                if limite_aprovado is None:
                    skipped += 1
                    errors.append({"linha": idx, "cnpj": cnpj, "erro": "Sem limite aprovado"})
                    continue
                aberto_atual = aberto_map.get(clinica_id, 0.0)
                saldo = max(limite_aprovado - aberto_atual, 0.0)
                if valor_liquido > saldo and not data_reembolso:
                    skipped += 1
                    errors.append({"linha": idx, "cnpj": cnpj, "erro": "Excede saldo antecipável"})
                    continue
                if not data_reembolso:
                    aberto_map[clinica_id] = aberto_atual + valor_liquido

                payloads.append(
                    {
                        "clinica_id": clinica_id,
                        "cnpj": cnpj,
                        "data_antecipacao": data_antecipacao or datetime.utcnow().date().isoformat(),
                        "valor_liquido": valor_liquido,
                        "valor_taxa": valor_taxa,
                        "valor_a_pagar": valor_a_pagar,
                        "data_reembolso": data_reembolso,
                        "data_reembolso_programada": data_reembolso_programada,
                        "data_pagamento_antecipacao": data_antecipacao,
                        "data_pagamento_reembolso": data_reembolso,
                        "data_evento": data_evento,
                        "data_solicitacao": data_solicitacao,
                        "valor_bruto": valor_bruto,
                        "observacao": "import_csv",
                        "registrado_por": "import_csv",
                    }
                )

        inserted = 0
        chunk_size = 500
        for i in range(0, len(payloads), chunk_size):
            chunk = payloads[i : i + chunk_size]
            supabase_post("antecipacoes", chunk)
            inserted += len(chunk)

        return {
            "ok": True,
            "total_rows": total_rows,
            "inserted": inserted,
            "skipped": skipped,
            "errors": errors[:20],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao importar CSV: {e}")


@app.post("/antecipacoes/import-redash")
async def importar_antecipacoes_redash(
    force: bool = False,
    replace: bool = False,
    registered_by: str | None = None,
):
    if not REDASH_BASE_URL or not REDASH_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Defina REDASH_BASE_URL e REDASH_API_KEY no ambiente.",
        )

    url = f"{REDASH_BASE_URL.rstrip('/')}/api/queries/{REDASH_QUERY_ID}/results.csv"
    try:
        r = requests.get(url, params={"api_key": REDASH_API_KEY}, timeout=30)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao acessar Redash: {e}")
    if r.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao acessar Redash: {r.status_code} - {r.text}",
        )

    text = r.text or ""
    first_line = text.splitlines()[0] if text else ""
    delimiter = ";" if ";" in first_line else ","
    reader = csv.DictReader(StringIO(text), delimiter=delimiter)
    rows = list(reader)
    total_rows = len(rows)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV do Redash vazio.")

    header_map = {}
    if reader.fieldnames:
        for field in reader.fieldnames:
            header_map[_normalize_header(field)] = field

    def get_value(row, options):
        for opt in options:
            key = header_map.get(_normalize_header(opt))
            if key and key in row:
                return row.get(key)
        return None

    clinicas_rows = supabase_get_all("clinicas", select="id,cnpj,nome,codigo_clinica")
    cnpj_to_ids = {}
    for row in clinicas_rows or []:
        cnpj_norm = _normalize_cnpj(row.get("cnpj"))
        cid = _safe_str(row.get("id"))
        if not cnpj_norm or not cid:
            continue
        cnpj_to_ids.setdefault(cnpj_norm, []).append(cid)

    dup_cnpjs = [
        {"cnpj": cnpj, "clinica_ids": ids}
        for cnpj, ids in cnpj_to_ids.items()
        if len(ids) > 1
    ]
    if dup_cnpjs:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Existem CNPJs duplicados na tabela de clínicas. Corrija para importar corretamente.",
                "duplicados": dup_cnpjs[:20],
            },
        )

    clinicas_map = {cnpj: ids[0] for cnpj, ids in cnpj_to_ids.items()}
    clinicas_nome_map = {
        _safe_str(r.get("id")): _safe_str(r.get("codigo_clinica")) or _safe_str(r.get("nome"))
        for r in (clinicas_rows or [])
        if r.get("id")
    }
    clinicas_nome_real_map = {
        _safe_str(r.get("id")): _safe_str(r.get("nome"))
        for r in (clinicas_rows or [])
        if r.get("id")
    }
    clinicas_cnpj_map = {
        _safe_str(r.get("id")): _safe_str(r.get("cnpj"))
        for r in (clinicas_rows or [])
        if r.get("id") and r.get("cnpj")
    }

    payloads = []
    errors = []
    skipped = 0
    clinica_ids = set()
    clinica_counts = {}
    min_date = None
    max_date = None

    for idx, row in enumerate(rows, start=2):
        cnpj = _normalize_cnpj(get_value(row, ["cnpj"]))
        clinica_id = clinicas_map.get(cnpj)
        if not clinica_id:
            skipped += 1
            errors.append({"linha": idx, "cnpj": cnpj, "erro": "CNPJ não encontrado"})
            continue
        expected_cnpj = _normalize_cnpj(clinicas_cnpj_map.get(clinica_id))
        if expected_cnpj and expected_cnpj != cnpj:
            skipped += 1
            errors.append(
                {
                    "linha": idx,
                    "cnpj": cnpj,
                    "erro": f"CNPJ não confere com clínica ({clinica_id})",
                }
            )
            continue
        clinica_ids.add(clinica_id)
        clinica_counts[clinica_id] = clinica_counts.get(clinica_id, 0) + 1
        data_antecipacao = _parse_date_br(
            get_value(
                row,
                [
                    "data antecipação",
                    "data antecipacao",
                    "data_pagamento_antecipacao",
                    "data pagamento antecipacao",
                    "data pagamento da antecipação",
                    "data",
                ],
            )
        )
        if data_antecipacao:
            try:
                data_obj = datetime.fromisoformat(data_antecipacao).date()
                if not min_date or data_obj < min_date:
                    min_date = data_obj
                if not max_date or data_obj > max_date:
                    max_date = data_obj
            except Exception:
                pass

    limites_map = {}
    aberto_map = {}
    existing_keys = set()
    existing_redash_refs = set()
    make_dup_key = None
    if clinica_ids:
        ids_in = ",".join(sorted(clinica_ids))
        limite_rows = supabase_get_all(
            "clinica_limite",
            select="clinica_id,limite_aprovado,aprovado_em",
            extra_params={"clinica_id": f"in.({ids_in})", "order": "aprovado_em.desc"},
        )
        for row in limite_rows or []:
            cid = _safe_str(row.get("clinica_id"))
            if cid and cid not in limites_map:
                limites_map[cid] = _safe_float(row.get("limite_aprovado"))

        if not force:
            missing_clinicas = []
            for cid in sorted(clinica_ids):
                if limites_map.get(cid) is None:
                    missing_clinicas.append(
                        {
                            "clinica_id": cid,
                            "clinica_nome": clinicas_nome_map.get(cid),
                            "clinica_nome_real": clinicas_nome_real_map.get(cid),
                            "cnpj": clinicas_cnpj_map.get(cid),
                            "linhas": clinica_counts.get(cid, 0),
                        }
                    )
            if missing_clinicas:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Existem clínicas no Redash sem limite aprovado. Aprove o limite antes de importar.",
                        "missing_clinicas": missing_clinicas,
                    },
                )

        if replace:
            supabase_delete(
                "antecipacoes",
                extra_params={
                    "or": "(registrado_por.eq.import_redash,redash_id.not.is.null,observacao.like.redash:%)"
                },
            )

        antecipacoes_rows = supabase_get_all(
            "antecipacoes",
            select="clinica_id,valor_liquido,data_reembolso",
            extra_params={"clinica_id": f"in.({ids_in})"},
        )
        df_ant = to_df(
            antecipacoes_rows, ["clinica_id", "valor_liquido", "data_reembolso"]
        )
        if not df_ant.empty:
            df_ant["valor_liquido"] = pd.to_numeric(
                df_ant["valor_liquido"], errors="coerce"
            ).fillna(0)
            df_ant["reembolsado"] = df_ant["data_reembolso"].notna()
            for cid, group in df_ant.groupby("clinica_id"):
                total_antecipado = float(group["valor_liquido"].sum())
                total_reembolsado = float(
                    group[group["reembolsado"]]["valor_liquido"].sum()
                )
                aberto_map[_safe_str(cid)] = max(
                    total_antecipado - total_reembolsado, 0.0
                )

        if not replace:
            existente_params = {"clinica_id": f"in.({ids_in})"}
            if min_date and max_date:
                existente_params["and"] = (
                    f"(data_antecipacao.gte.{min_date},data_antecipacao.lte.{max_date})"
                )
            existente_rows = supabase_get_all(
                "antecipacoes",
                select=(
                    "clinica_id,data_antecipacao,valor_liquido,valor_taxa,valor_a_pagar,"
                    "data_reembolso,observacao,redash_id"
                ),
                extra_params=existente_params,
            )

            def make_dup_key(
                clinica_id_val,
                data_val,
                valor_liq_val,
                valor_taxa_val,
                valor_pagar_val,
                data_reemb_val,
            ):
                def num(v):
                    f = _safe_float(v)
                    if f is None:
                        return "0.00"
                    return f"{round(f, 2):.2f}"

                return "|".join(
                    [
                        _safe_str(clinica_id_val) or "",
                        _safe_str(data_val) or "",
                        num(valor_liq_val),
                        num(valor_taxa_val),
                        num(valor_pagar_val),
                        _safe_str(data_reemb_val) or "",
                    ]
                )

            for row in existente_rows or []:
                existing_keys.add(
                    make_dup_key(
                        row.get("clinica_id"),
                        row.get("data_antecipacao"),
                        row.get("valor_liquido"),
                        row.get("valor_taxa"),
                        row.get("valor_a_pagar"),
                        row.get("data_reembolso"),
                    )
                )
                redash_id = _safe_str(row.get("redash_id"))
                if redash_id:
                    existing_redash_refs.add(redash_id)
                else:
                    obs = _safe_str(row.get("observacao"))
                    if obs.startswith("redash:"):
                        existing_redash_refs.add(obs.split("redash:", 1)[-1])

    for idx, row in enumerate(rows, start=2):
        cnpj = _normalize_cnpj(get_value(row, ["cnpj"]))
        clinica_id = clinicas_map.get(cnpj)
        if not clinica_id:
            continue
        expected_cnpj = _normalize_cnpj(clinicas_cnpj_map.get(clinica_id))
        if expected_cnpj and expected_cnpj != cnpj:
            skipped += 1
            errors.append(
                {
                    "linha": idx,
                    "cnpj": cnpj,
                    "erro": f"CNPJ não confere com clínica ({clinica_id})",
                }
            )
            continue

        data_antecipacao = _parse_date_br(
            get_value(
                row,
                [
                    "data antecipação",
                    "data antecipacao",
                    "data_pagamento_antecipacao",
                    "data pagamento antecipacao",
                    "data pagamento da antecipação",
                    "data",
                ],
            )
        )
        data_reembolso = _parse_date_br(
            get_value(
                row,
                [
                    "data reembolso",
                    "data_reembolso",
                    "data_pagamento_reembolso",
                    "data pagamento reembolso",
                    "data pagamento do reembolso",
                ],
            )
        )
        data_reembolso_programada = _parse_date_br(
            get_value(
                row,
                [
                    "data pagamento original / reembolso programada",
                    "data_pagamento_original",
                    "data pagamento original",
                    "data_reembolso_programada",
                    "reembolso programada",
                ],
            )
        )
        data_solicitacao = _parse_date_br(
            get_value(
                row,
                [
                    "data solicitacao da antecipação",
                    "data_solicitacao_antecipacao",
                    "data_solicitacao",
                    "data solicitacao",
                ],
            )
        )
        data_evento = _parse_date_br(
            get_value(row, ["data evento", "data_evento"])
        )
        valor_liquido = _parse_number_flexible(
            get_value(row, ["moneydetails_net", "moneydetails net", "moneydetails_net"])
        )
        valor_taxa = _parse_number_flexible(
            get_value(row, ["moneydetails_fee", "moneydetails fee", "moneydetails_fee"])
        )
        valor_a_pagar = _parse_number_flexible(
            get_value(
                row,
                ["moneydetails_tobepaid", "moneydetails to be paid", "moneydetails_tobepaid"],
            )
        )
        valor_bruto = _parse_number_flexible(
            get_value(row, ["valor bruto", "valor_bruto", "cost_value"])
        )
        redash_ref = _safe_str(
            get_value(
                row,
                [
                    "id antecipação",
                    "id antecipacao",
                    "id_antecipacao",
                    "requestid",
                    "receita_id",
                ],
            )
        )

        if valor_liquido is None or valor_liquido <= 0:
            skipped += 1
            errors.append({"linha": idx, "cnpj": cnpj, "erro": "Valor líquido inválido"})
            continue

        if not replace:
            if redash_ref:
                if redash_ref in existing_redash_refs:
                    skipped += 1
                    errors.append(
                        {
                            "linha": idx,
                            "cnpj": cnpj,
                            "redash_id": redash_ref,
                            "erro": "Duplicado (Redash)",
                        }
                    )
                    continue
                existing_redash_refs.add(redash_ref)
            else:
                dup_key = make_dup_key(
                    clinica_id,
                    data_antecipacao,
                    valor_liquido,
                    valor_taxa,
                    valor_a_pagar,
                    data_reembolso,
                )
                if dup_key in existing_keys:
                    skipped += 1
                    errors.append(
                        {
                            "linha": idx,
                            "cnpj": cnpj,
                            "redash_id": redash_ref,
                            "erro": "Duplicado",
                        }
                    )
                    continue
                existing_keys.add(dup_key)

        if not force:
            limite_aprovado = limites_map.get(clinica_id)
            if limite_aprovado is None:
                skipped += 1
                errors.append({"linha": idx, "cnpj": cnpj, "erro": "Sem limite aprovado"})
                continue
            aberto_atual = aberto_map.get(clinica_id, 0.0)
            saldo = max(limite_aprovado - aberto_atual, 0.0)
            if valor_liquido > saldo and not data_reembolso:
                skipped += 1
                errors.append({"linha": idx, "cnpj": cnpj, "erro": "Excede saldo antecipável"})
                continue
            if not data_reembolso:
                aberto_map[clinica_id] = aberto_atual + valor_liquido

        observacao = f"redash:{redash_ref}" if redash_ref else "redash"
        payloads.append(
            {
                "clinica_id": clinica_id,
                "cnpj": cnpj,
                "data_antecipacao": data_antecipacao or datetime.utcnow().date().isoformat(),
                "valor_liquido": valor_liquido,
                "valor_taxa": valor_taxa,
                "valor_a_pagar": valor_a_pagar,
                "data_reembolso": data_reembolso,
                "data_reembolso_programada": data_reembolso_programada,
                "data_pagamento_antecipacao": data_antecipacao,
                "data_pagamento_reembolso": data_reembolso,
                "data_evento": data_evento,
                "data_solicitacao": data_solicitacao,
                "valor_bruto": valor_bruto,
                "redash_id": redash_ref or None,
                "observacao": observacao,
                "registrado_por": registered_by or "import_redash",
            }
        )

    inserted = 0
    chunk_size = 500
    for i in range(0, len(payloads), chunk_size):
        chunk = payloads[i : i + chunk_size]
        supabase_post("antecipacoes", chunk)
        inserted += len(chunk)

    return {
        "ok": True,
        "total_rows": total_rows,
        "inserted": inserted,
        "skipped": skipped,
        "errors": errors[:20],
    }


@app.get("/antecipacoes/redash-status")
async def antecipacoes_redash_status():
    try:
        rows = supabase_get(
            "antecipacoes",
            select="criado_em,registrado_por",
            extra_params={
                "or": "(redash_id.not.is.null,observacao.like.redash:*)",
                "order": "criado_em.desc",
                "limit": "1",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao consultar status do Redash: {e}",
        )
    last_sync = None
    last_user = None
    if rows:
        last_sync = rows[0].get("criado_em")
        last_user = rows[0].get("registrado_por")
    return {"last_sync": last_sync, "last_user": last_user}



@app.get("/historico")
async def listar_historico():
    """
    Lista o histórico de importações, já juntando com a tabela `clinicas`
    e enriquecendo com:
      - total_registros (espelho de total_linhas)
      - total_boletos_emitidos (soma de qtde da clínica)
      - total_inadimplencia (média da taxa de inadimplência da clínica)
    """

    # 1) Buscar importações + clínica
    try:
        importacoes = supabase_get_all(
            "importacoes",
            select=(
                "id,clinica_id,arquivo_nome,total_linhas,status,criado_em,"
                "clinicas:clinica_id(id,nome,codigo_clinica,cnpj)"
            ),
            extra_params={"order": "criado_em.desc"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar histórico: {e}",
        )

    if not importacoes:
        return []

    # 2) Coletar IDs de clínica presentes no histórico
    clinica_ids = sorted(
        {row.get("clinica_id") for row in importacoes if row.get("clinica_id")}
    )

    totais_boletos_por_clinica: dict[str, int] = {}
    media_inadimplencia_por_clinica: dict[str, float] = {}

    if clinica_ids:
        ids_in = ",".join(clinica_ids)

        # 2.1 Boletos emitidos
        try:
            boletos_rows = supabase_get_all(
                "boletos_emitidos",
                select="clinica_id,qtde",
                extra_params={"clinica_id": f"in.({ids_in})"},
            )
        except Exception:
            boletos_rows = []

        # Agregar boletos (soma)
        for row in boletos_rows or []:
            cid = row.get("clinica_id")
            if not cid:
                continue
            qtde = row.get("qtde") or 0
            try:
                qtde = int(qtde)
            except Exception:
                qtde = 0
            totais_boletos_por_clinica[cid] = (
                totais_boletos_por_clinica.get(cid, 0) + qtde
            )

        # 2.2 Inadimplência REAL
        try:
            dash_rows = supabase_get_all(
                "vw_dashboard_final",
                select="clinica_id,mes_ref_date,valor_total_emitido,taxa_pago_no_vencimento,taxa_inadimplencia",
                extra_params={"clinica_id": f"in.({ids_in})"},
            )
        except Exception:
            dash_rows = []

        df_dash = to_df(dash_rows)

        if not df_dash.empty:
            # Ignorar mês atual
            hoje_utc = datetime.utcnow()
            primeiro_dia_mes_atual = hoje_utc.replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            ).date()
            if "mes_ref_date" in df_dash.columns:
                df_dash["mes_ref_date"] = pd.to_datetime(
                    df_dash["mes_ref_date"], errors="coerce"
                )
                df_dash = df_dash[
                    df_dash["mes_ref_date"].dt.date < primeiro_dia_mes_atual
                ]

            # Tipos numéricos e preenchimento de nulos
            for col in [
                "valor_total_emitido",
                "taxa_pago_no_vencimento",
                "taxa_inadimplencia",
            ]:
                if col in df_dash.columns:
                    df_dash[col] = pd.to_numeric(df_dash[col], errors="coerce")

            df_dash = df_dash.fillna(
                {
                    "valor_total_emitido": 0,
                    "taxa_pago_no_vencimento": 0,
                    "taxa_inadimplencia": 0,
                }
            )

            # Cálculo da inadimplência real
            df_dash["taxa_pago_no_vencimento"] = df_dash[
                "taxa_pago_no_vencimento"
            ].clip(0, 1)
            df_dash["taxa_inad_dos_atrasados"] = df_dash["taxa_inadimplencia"].clip(0, 1)
            df_dash["valor_nao_pago_no_venc"] = df_dash["valor_total_emitido"] * (
                1 - df_dash["taxa_pago_no_vencimento"]
            )
            df_dash["valor_inad_real"] = (
                df_dash["valor_nao_pago_no_venc"]
                * df_dash["taxa_inad_dos_atrasados"]
            )

            # Agregar por clínica (média ponderada)
            agg_df = df_dash.groupby("clinica_id").agg(
                valor_inad_real_total=("valor_inad_real", "sum"),
                valor_total_emitido_total=("valor_total_emitido", "sum"),
            )

            for cid, row in agg_df.iterrows():
                emitido = row["valor_total_emitido_total"]
                inad = row["valor_inad_real_total"]
                if emitido > 0:
                    media_inadimplencia_por_clinica[str(cid)] = inad / emitido

    # 3) Enriquecer cada registro do histórico com os totais reais
    historico_enriquecido = []
    for imp in importacoes:
        cid = imp.get("clinica_id")
        imp["total_registros"] = imp.get("total_linhas") or 0
        imp["total_boletos_emitidos"] = totais_boletos_por_clinica.get(cid, 0)
        imp["total_inadimplencia"] = media_inadimplencia_por_clinica.get(cid, 0) or 0
        historico_enriquecido.append(imp)

    return historico_enriquecido


# ==========================
# DASHBOARD · RESUMO GERAL
# ==========================


@app.get("/dashboard/resumo-geral")
async def dashboard_resumo_geral():
    """
    Retorna um resumo consolidado para o dashboard interno:
    - total de boletos
    - valor total
    - ticket médio
    - taxa pago no vencimento (último mês)
    - inadimplência (último mês)
    - tempo médio de pagamento (último mês)
    - séries por mês para gráficos
    """

    try:
        # --- Tabelas base ---
        boletos_rows = supabase_get_all(
            "boletos_emitidos", select="clinica_id,mes_ref,qtde,valor_total"
        )
        inad_rows = supabase_get_all("inadimplencia", select="clinica_id,mes_ref,taxa")
        taxa_venc_rows = supabase_get_all("taxa_pago_no_vencimento", select="clinica_id,mes_ref,taxa")
        tempo_rows = supabase_get_all("tempo_medio_pagamento", select="clinica_id,mes_ref,dias")
        ticket_rows = supabase_get_all("valor_medio_boleto", select="clinica_id,mes_ref,valor")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao carregar dados do Supabase: {e}"
        )

    # ----------------------
    # DataFrames
    # ----------------------
    df_boletos = to_df(boletos_rows, ["clinica_id", "mes_ref", "qtde", "valor_total"])
    df_inad = to_df(inad_rows, ["clinica_id", "mes_ref", "taxa"])
    df_taxa_venc = to_df(taxa_venc_rows, ["clinica_id", "mes_ref", "taxa"])
    df_tempo = to_df(tempo_rows, ["clinica_id", "mes_ref", "dias"])
    df_ticket = to_df(ticket_rows, ["clinica_id", "mes_ref", "valor"])

    # Garantir tipos numéricos
    if not df_boletos.empty:
        df_boletos["qtde"] = pd.to_numeric(df_boletos["qtde"], errors="coerce").fillna(
            0
        )
        df_boletos["valor_total"] = pd.to_numeric(
            df_boletos.get("valor_total", 0), errors="coerce"
        ).fillna(0)

    if not df_inad.empty:
        df_inad["taxa"] = pd.to_numeric(df_inad["taxa"], errors="coerce").fillna(0)

    if not df_taxa_venc.empty:
        df_taxa_venc["taxa"] = pd.to_numeric(
            df_taxa_venc["taxa"], errors="coerce"
        ).fillna(0)

    if not df_tempo.empty:
        df_tempo["dias"] = pd.to_numeric(df_tempo["dias"], errors="coerce").fillna(0)

    if not df_ticket.empty:
        df_ticket["valor"] = pd.to_numeric(df_ticket["valor"], errors="coerce").fillna(
            0
        )

    # ----------------------
    # KPI gerais
    # ----------------------
    total_boletos = int(df_boletos["qtde"].sum()) if not df_boletos.empty else 0
    valor_total_boletos = (
        float(df_boletos["valor_total"].sum()) if not df_boletos.empty else 0.0
    )
    ticket_medio_global = (
        (valor_total_boletos / total_boletos) if total_boletos > 0 else None
    )

    def weighted_avg(df_slice, value_col, weight_col="valor_total"):
        if df_slice.empty or value_col not in df_slice.columns:
            return None
        values = pd.to_numeric(df_slice[value_col], errors="coerce")
        weights = (
            pd.to_numeric(df_slice.get(weight_col, 0), errors="coerce")
            .fillna(0)
        )
        mask = values.notna()
        values = values[mask]
        weights = weights[mask]
        if values.empty:
            return None
        total_weight = weights.sum()
        if total_weight and total_weight > 0:
            return float((values * weights).sum() / total_weight)
        return float(values.mean())

    # último mês de referência (pelo boletos_emitidos)
    periodo_referencia = None
    if not df_boletos.empty and "mes_ref" in df_boletos.columns:
        df_boletos_sorted = df_boletos.sort_values("mes_ref")
        periodo_referencia = df_boletos_sorted["mes_ref"].iloc[-1]

    # função helper pra pegar valor do último mês de uma df qualquer
    def valor_ultimo_mes(df, coluna_valor):
        if df.empty:
            return None
        try:
            df_sorted = df.sort_values("mes_ref")
            return float(df_sorted[coluna_valor].iloc[-1])
        except Exception:
            return None

    # Inadimplência REAL (ponderada)
    df_inad_real = pd.DataFrame()
    if not df_boletos.empty:
        df_inad_real = df_boletos.merge(
            df_taxa_venc[["clinica_id", "mes_ref", "taxa"]],
            on=["clinica_id", "mes_ref"],
            how="left",
        ).merge(
            df_inad[["clinica_id", "mes_ref", "taxa"]],
            on=["clinica_id", "mes_ref"],
            how="left",
            suffixes=("_pago", "_inad"),
        )
        df_inad_real["taxa_pago_no_vencimento"] = (
            df_inad_real["taxa_pago"].fillna(0).clip(0, 1)
        )
        df_inad_real["taxa_inadimplencia"] = (
            df_inad_real["taxa_inad"].fillna(0).clip(0, 1)
        )
        df_inad_real["taxa_inadimplencia_real"] = (
            (1 - df_inad_real["taxa_pago_no_vencimento"])
            * df_inad_real["taxa_inadimplencia"]
        )

    taxa_inad_ultimo = None
    if not df_inad_real.empty:
        df_inad_real_sorted = df_inad_real.sort_values("mes_ref")
        ultimo_mes = df_inad_real_sorted["mes_ref"].iloc[-1]
        taxa_inad_ultimo = weighted_avg(
            df_inad_real_sorted[df_inad_real_sorted["mes_ref"] == ultimo_mes],
            "taxa_inadimplencia_real",
            "valor_total",
        )
    taxa_pago_venc_ultimo = valor_ultimo_mes(df_taxa_venc, "taxa")
    tempo_medio_ultimo = valor_ultimo_mes(df_tempo, "dias")
    ticket_medio_ultimo = valor_ultimo_mes(df_ticket, "valor")

    # ----------------------
    # Séries por mês (pra gráfico)
    # ----------------------
    series_boletos = []
    if not df_boletos.empty:
        grp = (
            df_boletos.groupby("mes_ref", as_index=False)[["qtde", "valor_total"]].sum()
        )
        grp = grp.sort_values("mes_ref")
        series_boletos = grp.to_dict(orient="records")

    series_inad = []
    if not df_inad_real.empty:
        grp = (
            df_inad_real.groupby("mes_ref")
            .apply(lambda g: weighted_avg(g, "taxa_inadimplencia_real", "valor_total"))
            .reset_index(name="taxa")
            .sort_values("mes_ref")
        )
        series_inad = grp.to_dict(orient="records")

    series_taxa_venc = []
    if not df_taxa_venc.empty:
        grp = (
            df_taxa_venc.groupby("mes_ref", as_index=False)["taxa"]
            .mean()
            .sort_values("mes_ref")
        )
        series_taxa_venc = grp.to_dict(orient="records")

    series_tempo = []
    if not df_tempo.empty:
        grp = (
            df_tempo.groupby("mes_ref", as_index=False)["dias"]
            .mean()
            .sort_values("mes_ref")
        )
        series_tempo = grp.to_dict(orient="records")

    return {
        "periodo_referencia": periodo_referencia,
        "kpis": {
            "total_boletos": total_boletos,
            "valor_total_boletos": valor_total_boletos,
            "ticket_medio_global": ticket_medio_global,
            "taxa_inadimplencia_ultimo": taxa_inad_ultimo,
            "taxa_pago_no_vencimento_ultimo": taxa_pago_venc_ultimo,
            "tempo_medio_pagamento_ultimo": tempo_medio_ultimo,
            "ticket_medio_ultimo": ticket_medio_ultimo,
        },
        "series": {
            "boletos_por_mes": series_boletos,
            "inadimplencia_por_mes": series_inad,
            "taxa_pago_no_vencimento": series_taxa_venc,
            "tempo_medio_pagamento": series_tempo,
        },
    }


# ==========================
# DASHBOARD · CRÉDITO & RISCO (vw_dashboard_final)
# ==========================

from pandas import Timestamp

def _write_data_to_sheet(ws, data, title=None):
    if title:
        ws.append([title])
        ws.append([]) # Add a blank row for spacing

    if isinstance(data, dict):
        for key, value in data.items():
            ws.append([key, str(value)]) # Write key-value pairs
    elif isinstance(data, list) and data:
        # Assuming list of dictionaries, write header first
        headers = list(data[0].keys())
        ws.append(headers)
        for row_data in data:
            ws.append([row_data.get(header, "") for header in headers])
    ws.append([]) # Add a blank row after each section


def _safe_float(v):
    try:
        if v is None:
            return None
        f = float(v)
        if pd.isna(f):
            return None
        return float(f)
    except Exception:
        return None


def _safe_str(v):
    if v is None:
        return None
    return str(v)


def _format_mes_ref(dt: Timestamp | None):
    if dt is None or pd.isna(dt):
        return None
    try:
        return dt.strftime("%Y-%m")
    except Exception:
        return None


def _cutoff_mes_fechado_por_importacao(df_importacoes: pd.DataFrame, clinica_id: str):
    """
    Retorna o último mês fechado com base no mês da última importação.
    Regra: o mês fechado é o mês imediatamente anterior ao mês do upload.
    """
    if df_importacoes is None or df_importacoes.empty or not clinica_id:
        return None
    df_clin = df_importacoes[df_importacoes["clinica_id"] == clinica_id].copy()
    if df_clin.empty:
        return None
    df_clin["criado_em"] = pd.to_datetime(df_clin["criado_em"], errors="coerce")
    df_clin = df_clin.dropna(subset=["criado_em"])
    if df_clin.empty:
        return None
    ultimo_upload = df_clin["criado_em"].max()
    mes_upload = pd.Timestamp(ultimo_upload).to_period("M").to_timestamp()
    return mes_upload - pd.Timedelta(days=1)


def _mes_upload_por_importacao(df_importacoes: pd.DataFrame, clinica_id: str):
    if df_importacoes is None or df_importacoes.empty or not clinica_id:
        return None
    df_clin = df_importacoes[df_importacoes["clinica_id"] == clinica_id].copy()
    if df_clin.empty:
        return None
    df_clin["criado_em"] = pd.to_datetime(df_clin["criado_em"], errors="coerce")
    df_clin = df_clin.dropna(subset=["criado_em"])
    if df_clin.empty:
        return None
    ultimo_upload = df_clin["criado_em"].max()
    return _format_mes_ref(pd.Timestamp(ultimo_upload))
    

# ==========================
# FUNÇÃO AUXILIAR — ÚLTIMO MÊS FECHADO
# ==========================
def identificar_ultimo_mes_fechado(df_importacoes, clinica_id):
    """
    Retorna o último mês realmente fechado para uma clínica com base
    na data de importação.
    """
    df = df_importacoes[df_importacoes["clinica_id"] == clinica_id].copy()
    if df.empty:
        return None

    df["criado_em"] = pd.to_datetime(df["criado_em"], errors="coerce")
    df["mes_ref_date"] = pd.to_datetime(
        df["mes_ref"].astype(str) + "-01",
        format="%Y-%m-%d",
        errors="coerce",
    )

    df.dropna(subset=["criado_em", "mes_ref_date"], inplace=True)
    
    if df.empty:
        return None

    # Mês está fechado se foi importado após o fim do próprio mês
    end_of_month = df["mes_ref_date"] + pd.offsets.MonthEnd(0)
    df["fechado"] = df["criado_em"].dt.date >= (end_of_month + pd.Timedelta(days=1)).dt.date

    df_fechado = df[df["fechado"] == True]
    if df_fechado.empty:
        return None

    return df_fechado["mes_ref_date"].max()


@app.get("/dashboard/clinicas")
async def listar_clinicas_dashboard():
    """
    Lista clínicas presentes na view `vw_dashboard_final`
    para uso no filtro do dashboard de crédito & risco.
    """
    try:
        rows = supabase_get_all(
            "vw_dashboard_final",
            select="clinica_id,clinica_nome,cnpj",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao carregar clínicas do dashboard: {e}",
        )

    df = to_df(
        rows,
        columns=["clinica_id", "clinica_nome", "cnpj"],
    )

    if df.empty:
        return []

    df = df.drop_duplicates(subset=["clinica_id"])

    clinicas = []
    clinicas_info_map = {}
    try:
        clinicas_rows = supabase_get_all(
            "clinicas",
            select="id,cnpj,nome,codigo_clinica",
        )
        for row in clinicas_rows or []:
            cid = _safe_str(row.get("id"))
            if not cid:
                continue
            clinicas_info_map[cid] = {
                "codigo_clinica": _safe_str(row.get("codigo_clinica")) or _safe_str(row.get("nome")),
                "nome": _safe_str(row.get("nome")),
                "cnpj": _safe_str(row.get("cnpj")),
            }
    except Exception:
        clinicas_info_map = {}
    for _, row in df.iterrows():
        cid = _safe_str(row.get("clinica_id"))
        info = clinicas_info_map.get(cid, {})
        clinicas.append(
            {
                "id": cid,
                "nome": info.get("nome"),
                "codigo_clinica": info.get("codigo_clinica")
                or _safe_str(row.get("clinica_nome"))
                or _safe_str(row.get("cnpj")),
                "cnpj": info.get("cnpj") or _safe_str(row.get("cnpj")),
            }
        )

    clinicas = sorted(clinicas, key=lambda x: (x.get("codigo_clinica") or "").lower())
    return clinicas


def _fator_limite_score(s):
    s = _safe_float(s)
    if s is None:
        return 0.15
    if s >= 0.80:
        return 0.90
    if s >= 0.70:
        return 0.75
    if s >= 0.60:
        return 0.60
    if s >= 0.50:
        return 0.45
    if s >= 0.40:
        return 0.35
    if s >= 0.20:
        return 0.25
    return 0.15

def _clamp01(x):
    try:
        x = float(x)
    except Exception:
        return 0.0
    if math.isnan(x):
        return 0.0
    return max(0.0, min(1.0, x))

def _calc_score_row(row):
    inad_real = row.get("taxa_inadimplencia_real")
    pago_venc = row.get("taxa_pago_no_vencimento")
    dias = row.get("tempo_medio_pagamento_dias")
    parc = row.get("parc_media_parcelas_pond")
    risk_inad = _clamp01(inad_real / 0.03) if inad_real is not None else 0.0
    risk_atraso = _clamp01((1.0 - float(pago_venc)) / 0.25) if pago_venc is not None else 0.0
    risk_dias = _clamp01((float(dias) - 5.0) / 60.0) if dias is not None else 0.0
    risk_parc = _clamp01((float(parc) - 1.0) / 11.0) if parc is not None else 0.0
    score = 1.0 - (0.50 * risk_inad + 0.25 * risk_atraso + 0.15 * risk_dias + 0.10 * risk_parc)
    return max(0.0, min(1.0, score))

def _categoria_from_score(s):
    s = _safe_float(s)
    if s is None: return None
    if s >= 0.80: return "A"
    if s >= 0.60: return "B"
    if s >= 0.40: return "C"
    if s >= 0.20: return "D"
    return "E"

def _calculate_limite_sugerido(
    clinica_id: str,
    df_full: pd.DataFrame,
    cutoff_dt: "Timestamp | None" = None,
):
    """
    Calcula o limite de crédito sugerido e seus componentes para uma única clínica.
    Retorna uma tupla com todos os componentes calculados.
    """
    LIMITE_TETO_GLOBAL = 3_000_000.0
    
    resultados = {
        "limite_sugerido": None, "base_media12m": None, "base_media3m": None,
        "base_ultimo_mes": None, "base_mensal_mix": None, "fator": None, "share_portfolio_12m": None,
    }

    df_clin_all = df_full[df_full["clinica_id"] == clinica_id].copy()
    if cutoff_dt is not None and not pd.isna(cutoff_dt):
        df_clin_all = df_clin_all[df_clin_all["mes_ref_date"] <= cutoff_dt].copy()
    if df_clin_all.empty:
        return tuple(resultados.values())

    last_dt_clin = df_clin_all["mes_ref_date"].max()

    if pd.isna(last_dt_clin):
        return tuple(resultados.values())

    dt_inicio_12m = last_dt_clin - pd.DateOffset(months=11)
    df_clin_12m = df_clin_all[df_clin_all["mes_ref_date"] >= dt_inicio_12m].copy()
    total_emit_12m = _safe_float(df_clin_12m["valor_total_emitido"].sum())
    n_meses_12m = int(df_clin_12m["mes_ref_date"].nunique() or 0)
    if n_meses_12m > 0 and total_emit_12m is not None:
        resultados["base_media12m"] = total_emit_12m / n_meses_12m

    dt_inicio_3m = last_dt_clin - pd.DateOffset(months=2)
    df_last3 = df_clin_all[(df_clin_all["mes_ref_date"] >= dt_inicio_3m) & (df_clin_all["mes_ref_date"] <= last_dt_clin)].copy()
    if not df_last3.empty:
        resultados["base_media3m"] = _safe_float(df_last3["valor_total_emitido"].mean())

    df_ultimo_mes = df_clin_all[df_clin_all["mes_ref_date"] == last_dt_clin].copy()
    if not df_ultimo_mes.empty:
        resultados["base_ultimo_mes"] = _safe_float(df_ultimo_mes["valor_total_emitido"].sum())

    componentes, pesos = [], []
    if resultados["base_media12m"] is not None: componentes.append(resultados["base_media12m"]); pesos.append(0.50)
    if resultados["base_media3m"] is not None: componentes.append(resultados["base_media3m"]); pesos.append(0.30)
    if resultados["base_ultimo_mes"] is not None: componentes.append(resultados["base_ultimo_mes"]); pesos.append(0.20)
    
    if componentes and sum(pesos) > 0:
        resultados["base_mensal_mix"] = sum(c * p for c, p in zip(componentes, pesos)) / sum(pesos)

    if not df_ultimo_mes.empty:
        score_para_limite = _safe_float(df_ultimo_mes["score_ajustado"].mean())
        resultados["fator"] = _fator_limite_score(score_para_limite)

    df_port_12m = df_full[df_full["mes_ref_date"] >= dt_inicio_12m].copy()
    if not df_port_12m.empty and total_emit_12m is not None:
        total_emit_portfolio_12m = _safe_float(df_port_12m["valor_total_emitido"].sum())
        if total_emit_portfolio_12m and total_emit_portfolio_12m > 0:
            resultados["share_portfolio_12m"] = _safe_float(total_emit_12m / total_emit_portfolio_12m)

    base_para_limite = resultados["base_mensal_mix"] or 0.0
    fator_limite = resultados["fator"] or 0.0
    bruto = base_para_limite * fator_limite

    if bruto > 0:
        bases_validas = [b for b in [resultados["base_media12m"], resultados["base_media3m"], resultados["base_ultimo_mes"]] if b is not None and b > 0]
        maior_base = max(bases_validas) if bases_validas else 0
        teto_dinamico = 1.5 * maior_base
        resultados["limite_sugerido"] = min(bruto, teto_dinamico, LIMITE_TETO_GLOBAL)

    return tuple(resultados.values())

@app.get("/dashboard", response_model=DashboardData)
async def dashboard_completo(
    clinica_id: str | None = None,
    meses: int = 12,
    inicio: str | None = None,
    fim: str | None = None,
    mes_ref_custom: str | None = None,
):
    try:
        rows = supabase_get_all("vw_dashboard_final", select="*")
        df = to_df(rows)
        if df.empty:
            return {"filtros": {}, "contexto": {}, "kpis": {}, "series": {}, "ranking_clinicas": []}

        df["mes_ref_date"] = pd.to_datetime(df.get("mes_ref_date", df.get("mes_ref")), errors="coerce")
        df = df.dropna(subset=["mes_ref_date"])
        df["mes_ref_period"] = df["mes_ref_date"].dt.to_period("M")

        numeric_cols = ["valor_total_emitido", "taxa_pago_no_vencimento", "taxa_inadimplencia", "tempo_medio_pagamento_dias", "parc_media_parcelas_pond", "valor_medio_boleto", "limite_aprovado"]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
        
        df["taxa_pago_no_vencimento"] = df["taxa_pago_no_vencimento"].clip(0, 1).fillna(0)
        df["taxa_inadimplencia"] = df["taxa_inadimplencia"].clip(0, 1).fillna(0)
        df["valor_nao_pago_no_venc"] = df["valor_total_emitido"].fillna(0) * (1 - df["taxa_pago_no_vencimento"])
        df["valor_inad_real"] = df["valor_nao_pago_no_venc"] * df["taxa_inadimplencia"]
        df["taxa_inadimplencia_real"] = (df["valor_inad_real"] / df["valor_total_emitido"]).where(df["valor_total_emitido"] > 0, 0)
        df["taxa_inadimplencia"] = df["taxa_inadimplencia_real"]
        df["score_ajustado"] = df.apply(_calc_score_row, axis=1)
        df["categoria_risco_ajustada"] = df["score_ajustado"].apply(_categoria_from_score)
        
        min_dt, max_dt = df["mes_ref_date"].min(), df["mes_ref_date"].max()

        try:
            importacoes_rows = supabase_get_all(
                "importacoes",
                select="clinica_id,criado_em",
            )
        except Exception:
            importacoes_rows = []
        df_importacoes = to_df(importacoes_rows, ["clinica_id", "criado_em"])

        clinicas_info_map = {}
        try:
            clinicas_rows = supabase_get_all(
                "clinicas",
                select="id,cnpj,nome,codigo_clinica",
            )
        except Exception:
            clinicas_rows = []
        for row in clinicas_rows or []:
            cid = _safe_str(row.get("id"))
            if not cid:
                continue
            clinicas_info_map[cid] = {
                "codigo_clinica": _safe_str(row.get("codigo_clinica")) or _safe_str(row.get("nome")),
                "nome": _safe_str(row.get("nome")),
                "cnpj": _safe_str(row.get("cnpj")),
            }

        try:
            antecipacoes_rows = supabase_get_all(
                "antecipacoes",
                select="clinica_id,valor_liquido,data_reembolso",
            )
        except Exception:
            antecipacoes_rows = []
        df_ant = to_df(antecipacoes_rows, ["clinica_id", "valor_liquido", "data_reembolso"])
        utilizacao_por_clinica = {}
        if not df_ant.empty:
            df_ant["valor_liquido"] = pd.to_numeric(
                df_ant["valor_liquido"], errors="coerce"
            ).fillna(0)
            df_ant["reembolsado"] = df_ant["data_reembolso"].notna()
            for cid, group in df_ant.groupby("clinica_id"):
                total_antecipado = float(group["valor_liquido"].sum())
                total_reembolsado = float(
                    group[group["reembolsado"]]["valor_liquido"].sum()
                )
                utilizacao_por_clinica[_safe_str(cid)] = max(
                    total_antecipado - total_reembolsado, 0.0
                )

        hoje_utc = datetime.utcnow().date()
        first_day_month = hoje_utc.replace(day=1)
        last_complete_end = pd.to_datetime(first_day_month) - pd.Timedelta(days=1)
        end_dt_base = min(max_dt, last_complete_end)
        if mes_ref_custom:
            try:
                custom_dt = pd.to_datetime(str(mes_ref_custom) + "-01", errors="raise")
                if custom_dt <= max_dt:
                    end_dt_base = custom_dt
            except Exception:
                pass

        if inicio and fim:
            dt_inicio = pd.to_datetime(inicio + "-01")
            dt_fim = pd.to_datetime(fim + "-01") + pd.offsets.MonthEnd(0)
            dt_fim = min(dt_fim, end_dt_base)
        else:
            dt_fim = end_dt_base
            dt_inicio = dt_fim - pd.DateOffset(months=meses - 1)

        periodo_inicio = pd.Period(dt_inicio, freq="M")
        periodo_fim = pd.Period(dt_fim, freq="M")
        df_recorte_all = df[
            (df["mes_ref_period"] >= periodo_inicio)
            & (df["mes_ref_period"] <= periodo_fim)
        ].copy()

        def _weighted_avg(df_slice, value_col, weight_col="valor_total_emitido"):
            if df_slice.empty or value_col not in df_slice.columns:
                return None
            values = pd.to_numeric(df_slice[value_col], errors="coerce")
            if weight_col in df_slice.columns:
                weights = pd.to_numeric(df_slice[weight_col], errors="coerce").fillna(0)
            else:
                weights = pd.Series([0] * len(values), index=values.index)
            mask = values.notna()
            values = values[mask]
            weights = weights[mask]
            if values.empty:
                return None
            total_weight = weights.sum()
            if total_weight and total_weight > 0:
                return float((values * weights).sum() / total_weight)
            return float(values.mean())

        def _mean(df_slice, col):
            if df_slice.empty or col not in df_slice.columns:
                return None
            values = pd.to_numeric(df_slice[col], errors="coerce")
            if values.dropna().empty:
                return None
            return float(values.mean())

        if not df_recorte_all.empty:
            df_recorte_all = df_recorte_all.copy()

        nome_clinica = "Todas as clínicas"
        codigo_clinica = None
        nome_real = None
        if clinica_id:
            nomes = df[df["clinica_id"] == clinica_id]["clinica_nome"].dropna().unique().tolist()
            nome_clinica = nomes[0] if nomes else "Clínica selecionada"
            info = clinicas_info_map.get(str(clinica_id), {})
            codigo_clinica = info.get("codigo_clinica") or nome_clinica
            nome_real = info.get("nome")
        
        if clinica_id:
            df_ctx = df_recorte_all[df_recorte_all["clinica_id"] == clinica_id].copy()
        else:
            df_ctx = df_recorte_all.copy()

        kpis = {}
        if not df_ctx.empty:
            max_ctx_dt = df_ctx["mes_ref_date"].max()
            df_ctx_ultimo = df_ctx[df_ctx["mes_ref_date"] == max_ctx_dt]
            kpis["score_atual"] = _safe_float(df_ctx_ultimo["score_ajustado"].mean())
            kpis["categoria_risco"] = _categoria_from_score(kpis["score_atual"])
            kpis["valor_total_emitido_periodo"] = _safe_float(df_ctx["valor_total_emitido"].sum())
            kpis["valor_emitido_ultimo_mes"] = _safe_float(df_ctx_ultimo["valor_total_emitido"].sum())
            kpis["inadimplencia_media_periodo"] = _weighted_avg(df_ctx, "taxa_inadimplencia_real")
            kpis["inadimplencia_ultimo_mes"] = _weighted_avg(df_ctx_ultimo, "taxa_inadimplencia_real")
            kpis["taxa_pago_no_vencimento_media_periodo"] = _weighted_avg(df_ctx, "taxa_pago_no_vencimento")
            kpis["taxa_pago_no_vencimento_ultimo_mes"] = _weighted_avg(df_ctx_ultimo, "taxa_pago_no_vencimento")
            kpis["ticket_medio_periodo"] = _mean(df_ctx, "valor_medio_boleto")
            kpis["ticket_medio_ultimo_mes"] = _mean(df_ctx_ultimo, "valor_medio_boleto")
            kpis["tempo_medio_pagamento_media_periodo"] = _mean(df_ctx, "tempo_medio_pagamento_dias")
            kpis["tempo_medio_pagamento_ultimo_mes"] = _mean(df_ctx_ultimo, "tempo_medio_pagamento_dias")
            kpis["parcelas_media_periodo"] = _mean(df_ctx, "parc_media_parcelas_pond")
            kpis["parcelas_media_ultimo_mes"] = _mean(df_ctx_ultimo, "parc_media_parcelas_pond")

            df_series_base = df_ctx.copy()
            df_series_base["mes_ref"] = df_series_base["mes_ref_period"].astype(str)
            score_por_mes_df = (
                df_series_base.groupby("mes_ref", as_index=False)["score_ajustado"]
                .mean()
                .sort_values("mes_ref")
            )
            if not score_por_mes_df.empty:
                kpis["score_mes_anterior"] = (
                    score_por_mes_df["score_ajustado"].iloc[-2]
                    if len(score_por_mes_df) > 1
                    else None
                )
                kpis["score_variacao_vs_m1"] = (
                    kpis["score_atual"] - kpis["score_mes_anterior"]
                    if kpis.get("score_atual") is not None and kpis.get("score_mes_anterior") is not None
                    else None
                )
        
        limit_motor = None
        if clinica_id:
            hoje_utc = datetime.utcnow().date()
            first_day = hoje_utc.replace(day=1)
            cutoff_dt = _cutoff_mes_fechado_por_importacao(df_importacoes, clinica_id)
            if cutoff_dt is None:
                cutoff_dt = pd.to_datetime(first_day) - pd.Timedelta(days=1)
            if pd.isna(cutoff_dt) or cutoff_dt > max_dt:
                cutoff_dt = max_dt
            df_clin_cut = df[
                (df["clinica_id"] == clinica_id) & (df["mes_ref_date"] <= cutoff_dt)
            ].copy()
            last_dt_clin = df_clin_cut["mes_ref_date"].max() if not df_clin_cut.empty else None
            mes_upload_ref = _mes_upload_por_importacao(df_importacoes, clinica_id)
            (
                limite_sugerido, base_media12m, base_media3m, base_ultimo_mes,
                base_mensal_mix, fator, share_portfolio_12m
            ) = _calculate_limite_sugerido(clinica_id, df, cutoff_dt)
            limit_motor = {
                "mes_ref_base": _format_mes_ref(last_dt_clin),
                "mes_ref_regra": _format_mes_ref(pd.Timestamp(cutoff_dt)),
                "mes_upload_referencia": mes_upload_ref,
                "regra_limite": "mes_anterior_ao_upload",
                "limite_sugerido": limite_sugerido,
                "limite_sugerido_base_media12m": base_media12m,
                "limite_sugerido_base_media3m": base_media3m,
                "limite_sugerido_base_ultimo_mes": base_ultimo_mes,
                "limite_sugerido_base_mensal_mix": base_mensal_mix,
                "limite_sugerido_fator": fator,
                "limite_sugerido_teto_global": 3_000_000.0,
                "limite_sugerido_share_portfolio_12m": share_portfolio_12m,
            }
            kpis.update(limit_motor)
            limite_utilizado = _safe_float(utilizacao_por_clinica.get(clinica_id))
            kpis["limite_utilizado"] = limite_utilizado
            if kpis.get("limite_aprovado") is not None:
                usado = limite_utilizado or 0.0
                kpis["limite_disponivel"] = max(float(kpis["limite_aprovado"]) - usado, 0.0)
        else:
            kpis["limite_sugerido_teto_global"] = 3_000_000.0

        series_data = {}
        if not df_ctx.empty:
            df_series_base = df_ctx.copy()
            df_series_base["mes_ref"] = df_series_base["mes_ref_period"].astype(str)

            score_por_mes = (
                df_series_base.groupby("mes_ref", as_index=False)["score_ajustado"]
                .mean()
                .sort_values("mes_ref")
            )
            series_data["score_por_mes"] = [
                {"mes_ref": r["mes_ref"], "score_credito": _safe_float(r["score_ajustado"])}
                for _, r in score_por_mes.iterrows()
            ]

            valor_emitido = (
                df_series_base.groupby("mes_ref", as_index=False)["valor_total_emitido"]
                .sum()
                .sort_values("mes_ref")
            )
            if "valor_medio_boleto" in df_series_base.columns:
                valor_medio = (
                    df_series_base.groupby("mes_ref", as_index=False)["valor_medio_boleto"]
                    .mean()
                    .rename(columns={"valor_medio_boleto": "valor_medio_boleto"})
                )
                valor_emitido = valor_emitido.merge(valor_medio, on="mes_ref", how="left")
            if "qtde_boletos" in df_series_base.columns:
                qtde_boletos = (
                    df_series_base.groupby("mes_ref", as_index=False)["qtde_boletos"]
                    .sum()
                )
                valor_emitido = valor_emitido.merge(qtde_boletos, on="mes_ref", how="left")
            series_data["valor_emitido_por_mes"] = [
                {
                    "clinica_id": clinica_id if clinica_id else None,
                    "mes_ref": r["mes_ref"],
                    "valor_total_emitido": _safe_float(r["valor_total_emitido"]),
                    "valor_medio_boleto": _safe_float(r.get("valor_medio_boleto")) if "valor_medio_boleto" in valor_emitido.columns else None,
                    "qtde_boletos": _safe_float(r.get("qtde_boletos")) if "qtde_boletos" in valor_emitido.columns else None,
                }
                for _, r in valor_emitido.iterrows()
            ]

            inad_por_mes = (
                df_series_base.groupby("mes_ref")
                .apply(lambda g: _weighted_avg(g, "taxa_inadimplencia_real"))
                .reset_index(name="taxa_inadimplencia")
                .sort_values("mes_ref")
            )
            series_data["inadimplencia_por_mes"] = [
                {"mes_ref": r["mes_ref"], "taxa_inadimplencia": _safe_float(r["taxa_inadimplencia"])}
                for _, r in inad_por_mes.iterrows()
            ]

            pago_venc_por_mes = (
                df_series_base.groupby("mes_ref")
                .apply(lambda g: _weighted_avg(g, "taxa_pago_no_vencimento"))
                .reset_index(name="taxa_pago_no_vencimento")
                .sort_values("mes_ref")
            )
            series_data["taxa_pago_no_vencimento_por_mes"] = [
                {"mes_ref": r["mes_ref"], "taxa_pago_no_vencimento": _safe_float(r["taxa_pago_no_vencimento"])}
                for _, r in pago_venc_por_mes.iterrows()
            ]

            tempo_por_mes = (
                df_series_base.groupby("mes_ref", as_index=False)["tempo_medio_pagamento_dias"]
                .mean()
                .sort_values("mes_ref")
            )
            series_data["tempo_medio_pagamento_por_mes"] = [
                {"mes_ref": r["mes_ref"], "tempo_medio_pagamento_dias": _safe_float(r["tempo_medio_pagamento_dias"])}
                for _, r in tempo_por_mes.iterrows()
            ]

            parcelas_por_mes = (
                df_series_base.groupby("mes_ref", as_index=False)["parc_media_parcelas_pond"]
                .mean()
                .sort_values("mes_ref")
            )
            series_data["parcelas_media_por_mes"] = [
                {"mes_ref": r["mes_ref"], "media_parcelas_pond": _safe_float(r["parc_media_parcelas_pond"])}
                for _, r in parcelas_por_mes.iterrows()
            ]
        ranking_data = []
        hoje_utc = datetime.utcnow().date()
        first_day = hoje_utc.replace(day=1)
        for cid in df_recorte_all["clinica_id"].dropna().unique():
            cid = _safe_str(cid)
            df_clin_periodo = df_recorte_all[df_recorte_all["clinica_id"] == cid].copy()
            if df_clin_periodo.empty:
                continue
            last_dt_periodo = df_clin_periodo["mes_ref_date"].max()
            df_clin_ultimo = df_clin_periodo[df_clin_periodo["mes_ref_date"] == last_dt_periodo]
            row = df_clin_ultimo.iloc[0]
            cutoff_rank = _cutoff_mes_fechado_por_importacao(df_importacoes, cid)
            if cutoff_rank is None:
                cutoff_rank = pd.to_datetime(first_day) - pd.Timedelta(days=1)
            if pd.isna(cutoff_rank) or cutoff_rank > max_dt:
                cutoff_rank = max_dt
            (limite_sugerido_rank, _, _, _, _, _, _) = _calculate_limite_sugerido(cid, df, cutoff_rank)
            info = clinicas_info_map.get(cid, {})
            ranking_data.append({
                "clinica_id": cid,
                "clinica_nome": _safe_str(row.get("clinica_nome")),
                "clinica_codigo": info.get("codigo_clinica") or _safe_str(row.get("clinica_nome")),
                "clinica_nome_real": info.get("nome"),
                "cnpj": _safe_str(row.get("cnpj")),
                "score_credito": _safe_float(df_clin_ultimo["score_ajustado"].mean()),
                "categoria_risco": _categoria_from_score(_safe_float(df_clin_ultimo["score_ajustado"].mean())),
                "limite_aprovado": _safe_float(row.get("limite_aprovado")),
                "limite_utilizado": _safe_float(utilizacao_por_clinica.get(cid, 0)),
                "limite_disponivel": (
                    max(
                        (_safe_float(row.get("limite_aprovado")) or 0)
                        - (_safe_float(utilizacao_por_clinica.get(cid, 0)) or 0),
                        0.0,
                    )
                    if row.get("limite_aprovado") is not None
                    else None
                ),
                "limite_sugerido": limite_sugerido_rank,
                "valor_total_emitido_periodo": _safe_float(df_clin_periodo["valor_total_emitido"].sum()),
                "inadimplencia_media_periodo": _weighted_avg(df_clin_periodo, "taxa_inadimplencia_real"),
            })
        ranking_data = sorted(ranking_data, key=lambda x: (x["score_credito"] or 0), reverse=True)

        meses_faltantes = []
        disponivel_min = None
        disponivel_max = None
        if not df_ctx.empty:
            disponivel_min = _format_mes_ref(df_ctx["mes_ref_date"].min())
            disponivel_max = _format_mes_ref(df_ctx["mes_ref_date"].max())
            meses_solicitados = pd.period_range(
                periodo_inicio,
                periodo_fim,
                freq="M",
            )
            meses_existentes = set(df_ctx["mes_ref_period"].astype(str))
            meses_faltantes = [str(p) for p in meses_solicitados if str(p) not in meses_existentes]

        return jsonable_encoder({
            "filtros": {
                "periodo": {
                    "min_mes_ref": _format_mes_ref(dt_inicio),
                    "max_mes_ref": _format_mes_ref(dt_fim),
                    "solicitado_min": _format_mes_ref(dt_inicio),
                    "solicitado_max": _format_mes_ref(dt_fim),
                    "disponivel_min": disponivel_min,
                    "disponivel_max": disponivel_max,
                    "meses_faltantes": meses_faltantes,
                    "todos_meses": sorted({_format_mes_ref(m) for m in df["mes_ref_date"].unique() if m is not None}),
                }
            },
            "contexto": {
                "clinica_id": clinica_id,
                "clinica_nome": nome_clinica,
                "clinica_codigo": codigo_clinica,
                "clinica_nome_real": nome_real,
            },
            "kpis": kpis,
            "series": series_data,
            "ranking_clinicas": ranking_data,
            "limite_motor": limit_motor,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro inesperado: {e}")

async def _generate_export_df(payload: ExportPayload) -> pd.DataFrame:
    try:
        rows = supabase_get_all("vw_dashboard_final", select="*")
        df = to_df(rows)
        if df.empty: return pd.DataFrame()
        importacoes_rows = supabase_get_all(
            "importacoes",
            select="clinica_id,criado_em",
        )
        df_importacoes = to_df(importacoes_rows, ["clinica_id", "criado_em"])

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar dados: {e}")

    df["mes_ref_date"] = pd.to_datetime(df.get("mes_ref_date", df.get("mes_ref")), errors="coerce")
    
    numeric_cols = ["valor_total_emitido", "taxa_pago_no_vencimento", "taxa_inadimplencia", "tempo_medio_pagamento_dias", "parc_media_parcelas_pond", "valor_medio_boleto", "limite_aprovado"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    df["taxa_pago_no_vencimento"] = df["taxa_pago_no_vencimento"].clip(0, 1).fillna(0)
    df["taxa_inadimplencia"] = df["taxa_inadimplencia"].clip(0, 1).fillna(0)
    df["valor_nao_pago_no_venc"] = df["valor_total_emitido"].fillna(0) * (1 - df["taxa_pago_no_vencimento"])
    df["valor_inad_real"] = df["valor_nao_pago_no_venc"] * df["taxa_inadimplencia"]
    df["taxa_inadimplencia_real"] = (df["valor_inad_real"] / df["valor_total_emitido"]).where(df["valor_total_emitido"] > 0, 0)
    df["taxa_inadimplencia"] = df["taxa_inadimplencia_real"]
    df["score_ajustado"] = df.apply(_calc_score_row, axis=1)
    df["categoria_risco"] = df["score_ajustado"].apply(_categoria_from_score)
    
    hoje_utc = datetime.utcnow().date()
    first_day = hoje_utc.replace(day=1)
    cutoff_dt = pd.to_datetime(first_day) - pd.Timedelta(days=1)
    if pd.isna(cutoff_dt) or cutoff_dt > df["mes_ref_date"].max():
        cutoff_dt = df["mes_ref_date"].max()

    max_dt = df["mes_ref_date"].max()
    limites_sugeridos = {}
    valor_ultimo_mes_fechado = {}
    for cid in df["clinica_id"].unique():
        cutoff_clin = _cutoff_mes_fechado_por_importacao(df_importacoes, cid) or cutoff_dt
        if pd.isna(cutoff_clin) or cutoff_clin > max_dt:
            cutoff_clin = max_dt
        limites_sugeridos[cid] = _calculate_limite_sugerido(cid, df, cutoff_clin)[0]
        df_clin = df[(df["clinica_id"] == cid) & (df["mes_ref_date"] <= cutoff_clin)].copy()
        if df_clin.empty:
            valor_ultimo_mes_fechado[cid] = None
        else:
            last_dt = df_clin["mes_ref_date"].max()
            valor_ultimo_mes_fechado[cid] = _safe_float(
                df_clin[df_clin["mes_ref_date"] == last_dt]["valor_total_emitido"].sum()
            )
    df["limite_sugerido"] = df["clinica_id"].map(limites_sugeridos)
    df["valor_emitido_ultimo_mes_fechado"] = df["clinica_id"].map(valor_ultimo_mes_fechado)

    df["mes_ref"] = df["mes_ref_date"].dt.strftime('%Y-%m')
    df_filtered = df[df["mes_ref"].isin(payload.months)].copy()

    if payload.clinica_ids:
        df_filtered = df_filtered[df_filtered["clinica_id"].isin(payload.clinica_ids)]

    if df_filtered.empty:
        return pd.DataFrame()

    if payload.view_type == 'consolidado':
        agg_funcs = {
            'valor_total_emitido': 'sum', 'valor_inad_real': 'sum', 'score_ajustado': 'mean',
            'limite_aprovado': 'last', 'limite_sugerido': 'last', 'tempo_medio_pagamento_dias': 'mean',
            'valor_medio_boleto': 'mean', 'parc_media_parcelas_pond': 'mean',
        }
        valid_agg_funcs = {k: v for k, v in agg_funcs.items() if k in df_filtered.columns}
        df_filtered = df_filtered.sort_values('mes_ref_date')
        grouped = df_filtered.groupby(['clinica_id', 'clinica_nome', 'cnpj'], as_index=False)
        df_agg = grouped.agg(valid_agg_funcs)

        if 'valor_total_emitido' in df_agg and 'valor_inad_real' in df_agg:
             df_agg["taxa_inadimplencia_real"] = (df_agg["valor_inad_real"] / df_agg["valor_total_emitido"]).where(df_agg["valor_total_emitido"] > 0, 0)

        if 'categoria_risco' in payload.columns and 'clinica_id' in df_filtered.columns:
            latest_categoria = df_filtered.loc[df_filtered.groupby('clinica_id')['mes_ref_date'].idxmax()][['clinica_id', 'categoria_risco']]
            df_agg = pd.merge(df_agg, latest_categoria, on='clinica_id', how='left')

        df_final = df_agg
    else:
        df_final = df_filtered.sort_values(['clinica_nome', 'mes_ref_date'])

    if (
        "limite_sugerido" in payload.columns
        and "limite_sugerido" not in df_final.columns
        and "clinica_id" in df_final.columns
    ):
        df_final["limite_sugerido"] = df_final["clinica_id"].map(limites_sugeridos)
    if (
        "valor_emitido_ultimo_mes_fechado" in payload.columns
        and "valor_emitido_ultimo_mes_fechado" not in df_final.columns
        and "clinica_id" in df_final.columns
    ):
        df_final["valor_emitido_ultimo_mes_fechado"] = df_final["clinica_id"].map(valor_ultimo_mes_fechado)

    final_columns = [col for col in payload.columns if col in df_final.columns]
    return df_final[final_columns]
    
@app.post("/export/preview", response_model=List[Dict[str, Any]])
async def export_preview(payload: ExportPayload):
    # The payload from frontend now has `view_type` instead of `type`
    df = await _generate_export_df(payload)
    if df.empty:
        return []
    df_sample = df.head(10)
    # Format numbers for better preview
    for col in df_sample.columns:
        if pd.api.types.is_numeric_dtype(df_sample[col]):
            df_sample[col] = df_sample[col].apply(lambda x: f"{x:,.2f}" if pd.notnull(x) else "")
    df_sample = df_sample.fillna("")
    return df_sample.to_dict(orient="records")


@app.post("/export-dashboard", response_class=StreamingResponse)
async def export_dashboard(payload: ExportPayload):
    df = await _generate_export_df(payload)

    if df.empty:
        raise HTTPException(status_code=404, detail="Nenhum dado encontrado para exportar com os filtros selecionados.")

    output = BytesIO()
    df.to_excel(output, index=False, sheet_name='Dados')
    output.seek(0)
    
    filename = f"relatorio_credito_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

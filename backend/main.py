import os
import math
from datetime import datetime
import pandas as pd
import requests
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from processor import processar_excel
from io import BytesIO
from openpyxl import Workbook
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse

# ==========================
# CONFIG SUPABASE
# ==========================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

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
    cnpj: Optional[str] = None
    score_credito: Optional[float] = None
    categoria_risco: Optional[str] = None
    limite_aprovado: Optional[float] = None
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


def get_limite_utilizado_atual(clinica_id: str):
    try:
        rows = supabase_get(
            "limite_utilizacoes",
            select="valor_utilizado",
            extra_params={
                "clinica_id": f"eq.{clinica_id}",
            },
        )
        total = 0.0
        for row in rows or []:
            valor = _safe_float(row.get("valor_utilizado")) or 0.0
            total += valor
        return total if total > 0 else 0.0
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
        rows = supabase_get(
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
    data_referencia = payload.data_referencia or datetime.utcnow().strftime("%Y-%m-%d")
    row = {
        "clinica_id": clinica_id,
        "valor_utilizado": float(payload.valor_utilizado),
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
        rows = supabase_get(
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
        importacoes = supabase_get(
            "importacoes",
            select=(
                "id,clinica_id,arquivo_nome,total_linhas,status,criado_em,"
                "clinicas:clinica_id(id,nome,cnpj,external_id)"
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
            boletos_rows = supabase_get(
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
            dash_rows = supabase_get(
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
        boletos_rows = supabase_get(
            "boletos_emitidos", select="clinica_id,mes_ref,qtde,valor_total"
        )
        inad_rows = supabase_get("inadimplencia", select="clinica_id,mes_ref,taxa")
        taxa_venc_rows = supabase_get("taxa_pago_no_vencimento", select="clinica_id,mes_ref,taxa")
        tempo_rows = supabase_get("tempo_medio_pagamento", select="clinica_id,mes_ref,dias")
        ticket_rows = supabase_get("valor_medio_boleto", select="clinica_id,mes_ref,valor")
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
        rows = supabase_get(
            "vw_dashboard_final",
            select="clinica_id,clinica_nome,cnpj,external_id",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao carregar clínicas do dashboard: {e}",
        )

    df = to_df(
        rows,
        columns=["clinica_id", "clinica_nome", "cnpj", "external_id"],
    )

    if df.empty:
        return []

    df = df.drop_duplicates(subset=["clinica_id"])

    clinicas = []
    for _, row in df.iterrows():
        clinicas.append(
            {
                "id": _safe_str(row.get("clinica_id")),
                "nome": _safe_str(row.get("clinica_nome"))
                or _safe_str(row.get("external_id"))
                or _safe_str(row.get("cnpj")),
                "cnpj": _safe_str(row.get("cnpj")),
                "external_id": _safe_str(row.get("external_id")),
            }
        )

    clinicas = sorted(clinicas, key=lambda x: (x["nome"] or "").lower())
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
        rows = supabase_get("vw_dashboard_final", select="*")
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
            importacoes_rows = supabase_get(
                "importacoes",
                select="clinica_id,criado_em",
            )
        except Exception:
            importacoes_rows = []
        df_importacoes = to_df(importacoes_rows, ["clinica_id", "criado_em"])

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
        if clinica_id:
            nomes = df[df["clinica_id"] == clinica_id]["clinica_nome"].dropna().unique().tolist()
            nome_clinica = nomes[0] if nomes else "Clínica selecionada"
        
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
            limite_utilizado = get_limite_utilizado_atual(clinica_id)
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
            ranking_data.append({
                "clinica_id": cid,
                "clinica_nome": _safe_str(row.get("clinica_nome")),
                "cnpj": _safe_str(row.get("cnpj")),
                "score_credito": _safe_float(df_clin_ultimo["score_ajustado"].mean()),
                "categoria_risco": _categoria_from_score(_safe_float(df_clin_ultimo["score_ajustado"].mean())),
                "limite_aprovado": _safe_float(row.get("limite_aprovado")),
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
            "contexto": {"clinica_id": clinica_id, "clinica_nome": nome_clinica},
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
        rows = supabase_get("vw_dashboard_final", select="*")
        df = to_df(rows)
        if df.empty: return pd.DataFrame()
        importacoes_rows = supabase_get(
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

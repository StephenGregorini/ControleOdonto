import os
import re
import math
import requests
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from io import BytesIO

# ==========================
# CARREGAR ENV
# ==========================

BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BASE_DIR, "..", ".env"), override=False)
load_dotenv(os.path.join(BASE_DIR, ".env.local"), override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL:
    raise RuntimeError("⚠️ Defina SUPABASE_URL no .env")

if "db." in SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.replace("db.", "")

if not SERVICE_ROLE_KEY:
    raise RuntimeError("⚠️ Defina SERVICE_ROLE_KEY no .env")

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}


# ==========================
# HELPERS
# ==========================

def to_str(v):
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d")
    if pd.isna(v):
        return None
    return str(v).strip()


def _to_python_scalar(v):
    if hasattr(v, "item"):
        try:
            return v.item()
        except Exception:
            pass
    return v


def fix_percentual(v):
    if pd.isna(v):
        return None

    v = _to_python_scalar(v)

    if isinstance(v, str):
        v = v.strip().replace("%", "").replace(",", ".")
        if not v:
            return None
        try:
            v = float(v)
        except Exception:
            return None

    try:
        v = float(v)
    except Exception:
        return None

    if math.isnan(v):
        return None

    if v > 10_000_000_000:
        return v / 1_000_000_000_000
    return v


def fix_int(v):
    if pd.isna(v):
        return None

    v = _to_python_scalar(v)

    if isinstance(v, bool):
        return int(v)

    if isinstance(v, int):
        return v

    if isinstance(v, float):
        if math.isnan(v):
            return None
        arredondado = round(v)
        if abs(v - arredondado) < 1e-9:
            return int(arredondado)
        return None

    if isinstance(v, str):
        raw = v.strip().replace(",", ".")
        if not raw:
            return None
        if raw.count(".") > 1 and re.fullmatch(r"\d{1,3}(\.\d{3})+(\.0+)?", raw):
            raw = raw.replace(".", "")
        try:
            numero = float(raw)
        except Exception:
            return None
        if math.isnan(numero):
            return None
        arredondado = round(numero)
        if abs(numero - arredondado) < 1e-9:
            return int(arredondado)
        return None

    return None


def _faixa_from_limites(a, b):
    lo, hi = sorted((int(a), int(b)))

    if hi <= 7:
        return "0-7"
    if hi <= 15 and lo <= 8:
        return "8-15"
    if lo <= 1 and 16 <= hi <= 30:
        return "16-30"
    if lo >= 16 and hi <= 30:
        return "16-30"
    if hi > 30:
        return ">30"
    return None


def _faixa_from_datetime(dt):
    faixa = _faixa_from_limites(dt.day, dt.month)
    if faixa:
        return faixa
    return _faixa_from_limites(dt.month, dt.day)


def _parse_faixa_datetime(raw):
    texto = str(raw).strip()
    if re.fullmatch(r"\d{4}[-/]\d{1,2}[-/]\d{1,2}", texto):
        return pd.to_datetime(texto, errors="coerce", dayfirst=False)
    return pd.to_datetime(texto, errors="coerce", dayfirst=True)


def fix_faixa(v):
    if pd.isna(v):
        return None

    v = _to_python_scalar(v)

    if isinstance(v, datetime):
        faixa = _faixa_from_datetime(v)
        return faixa or str(v.date())

    if isinstance(v, (int, float)) and not isinstance(v, bool):
        if isinstance(v, float) and math.isnan(v):
            return None

        if float(v).is_integer() and v > 20_000:
            dt = pd.to_datetime(v, unit="D", origin="1899-12-30", errors="coerce")
            if not pd.isna(dt):
                faixa = _faixa_from_datetime(dt.to_pydatetime())
                if faixa:
                    return faixa

        if float(v).is_integer():
            iv = int(v)
            if iv > 30:
                return ">30"
            return str(iv)
        return str(v)

    raw = str(v).strip()
    if not raw:
        return None

    normalizado = raw.lower()
    normalizado = normalizado.replace("–", "-").replace("—", "-").replace("--", "-")
    normalizado = re.sub(r"\s+", " ", normalizado).strip()

    if "30" in normalizado and (
        ">" in normalizado or "+" in normalizado or "maior" in normalizado or "acima" in normalizado
    ):
        return ">30"

    if re.fullmatch(r"\d+(\.0+)?", normalizado):
        num = float(normalizado)
        if num.is_integer() and num > 20_000:
            dt = pd.to_datetime(num, unit="D", origin="1899-12-30", errors="coerce")
            if not pd.isna(dt):
                faixa = _faixa_from_datetime(dt.to_pydatetime())
                if faixa:
                    return faixa

    nums = [int(n) for n in re.findall(r"\d+", normalizado)]

    if len(nums) >= 3:
        dt = _parse_faixa_datetime(raw)
        if not pd.isna(dt):
            faixa = _faixa_from_datetime(dt.to_pydatetime())
            if faixa:
                return faixa

    tem_separador_faixa = (
        "-" in normalizado
        or "/" in normalizado
        or " a " in f" {normalizado} "
        or "até" in normalizado
    )

    if tem_separador_faixa and len(nums) == 2:
        faixa = _faixa_from_limites(nums[0], nums[1])
        if faixa:
            return faixa

    dt = _parse_faixa_datetime(raw)
    if not pd.isna(dt):
        faixa = _faixa_from_datetime(dt.to_pydatetime())
        if faixa:
            return faixa

    return raw


def normalize_mesref(v):
    try:
        return pd.to_datetime(v).strftime("%Y-%m")
    except:
        return to_str(v)


def json_safe(o):
    o = _to_python_scalar(o)
    try:
        if pd.isna(o):
            return None
    except Exception:
        pass
    if isinstance(o, float) and math.isnan(o):
        return None
    return o


# ==========================
# NORMALIZAÇÃO E DEDUPE
# ==========================

def normalize_for_conflict(item, cols):
    for key in cols:
        v = item.get(key)
        if isinstance(v, str):
            item[key] = v.strip()
        elif pd.isna(v):
            item[key] = None


def dedupe(registros, conflict_cols):
    seen = set()
    out = []
    for row in registros:
        key = tuple(row.get(c) for c in conflict_cols)
        if key not in seen:
            seen.add(key)
            out.append(row)
    return out


# ==========================
# SUPABASE
# ==========================

def supabase_upsert(table, data, conflict):
    url = f"{SUPABASE_URL}/rest/v1/{table}?on_conflict={conflict}"
    r = requests.post(url, headers=HEADERS, json=data)

    if r.status_code not in (200, 201):
        raise RuntimeError(
            f"Erro ao enviar para {table}: {r.status_code} - {r.text}"
        )

    try:
        return r.json()
    except:
        return None


def supabase_insert(table, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    r = requests.post(url, headers=HEADERS, json=data)
    if r.status_code not in (200, 201):
        raise RuntimeError(
            f"Erro ao enviar para {table}: {r.status_code} - {r.text}"
        )
    try:
        return r.json()
    except Exception:
        return None


def get_or_create_clinica(cnpj, codigo_clinica):
    url = f"{SUPABASE_URL}/rest/v1/clinicas?cnpj=eq.{cnpj}"
    r = requests.get(url, headers=HEADERS)

    if r.status_code == 200:
        data = r.json()
        if len(data) > 0:
            return data[0]["id"]

    payload = {
        "cnpj": cnpj,
        "codigo_clinica": codigo_clinica,
        "nome": codigo_clinica or cnpj
    }

    resp = supabase_insert("clinicas", payload)
    if resp:
        return resp[0]["id"]

    raise RuntimeError("Não foi possível criar clínica.")


# ==========================
# PARSE BLOCO
# ==========================

def parse_block(title, header, rows):
    tl = title.lower().strip()

    if re.search(r"boleto[s]?\s*emit", tl):
        return ("boletos_emitidos", [
            {
                "mes_ref": normalize_mesref(r[0]),
                "qtde": fix_int(r[1]),
                "valor_total": json_safe(r[2]) if len(r) > 2 else None
            }
            for r in rows
        ])

    if "pagamento no vencimento" in tl or "taxa de pagamento" in tl:
        return ("taxa_pago_no_vencimento", [
            {"mes_ref": normalize_mesref(r[0]), "taxa": fix_percentual(r[1])}
            for r in rows
        ])

    if "taxa de atraso" in tl:
        dados = []
        for r in rows:
            if len(r) >= 4:
                dados.append({
                    "mes_ref": normalize_mesref(r[0]),
                    "faixa": fix_faixa(r[1]),
                    "qtde": fix_int(r[2]),
                    "percentual": fix_percentual(r[3])
                })
            elif len(r) >= 2:
                # Fallback: algumas planilhas trazem só MesRef + Taxa
                dados.append({
                    "mes_ref": normalize_mesref(r[0]),
                    "faixa": "total",
                    "qtde": None,
                    "percentual": fix_percentual(r[1])
                })
        return ("taxa_atraso_faixa", dados)

    if "inadimpl" in tl:
        return ("inadimplencia", [
            {"mes_ref": normalize_mesref(r[0]), "taxa": fix_percentual(r[1])}
            for r in rows
        ])

    if "tempo médio" in tl or "medio" in tl:
        return ("tempo_medio_pagamento", [
            {"mes_ref": normalize_mesref(r[0]), "dias": fix_int(r[1])}
            for r in rows
        ])

    if "valor médio" in tl:
        return ("valor_medio_boleto", [
            {"mes_ref": normalize_mesref(r[0]), "valor": json_safe(r[1])}
            for r in rows
        ])

    if "parcel" in tl:
        return ("parcelamentos_detalhe", [
            {
                "mes_ref": normalize_mesref(r[0]),
                "qtde_parcelas": fix_int(r[1]),
                "qtde": fix_int(r[2]),
                "percentual": fix_percentual(r[3])
            }
            for r in rows
        ])

    return (None, [])


# ==========================
# PARSE EXCEL
# ==========================

def parse_excel_from_bytes(contents: bytes):
    xls = pd.ExcelFile(BytesIO(contents))

    cnpj = None
    codigo_clinica = None

    for sheet in xls.sheet_names:
        df = xls.parse(sheet, header=None)
        for i in range(min(10, len(df))):
            if str(df.iloc[i, 0]).strip() == "CNPJ":
                cnpj = to_str(df.iloc[i + 1, 0])
                codigo_clinica = to_str(df.iloc[i + 1, 1])
                break
        if cnpj:
            break

    if not cnpj:
        raise RuntimeError("Não foi possível localizar CNPJ no arquivo.")

    result = {
        "estabelecimento": {"cnpj": cnpj, "codigo_clinica": codigo_clinica},
        "boletos_emitidos": [],
        "taxa_pago_no_vencimento": [],
        "taxa_atraso_faixa": [],
        "inadimplencia": [],
        "tempo_medio_pagamento": [],
        "valor_medio_boleto": [],
        "parcelamentos_detalhe": []
    }

    for sheet in xls.sheet_names:
        df = xls.parse(sheet, header=None)

        i = 0
        nrows = len(df)

        while i < nrows - 1:
            titulo = df.iloc[i, 0]

            if isinstance(titulo, str) and titulo.strip() not in ("", "CNPJ"):
                # ...
                header = df.iloc[i + 1] if (i + 1) < nrows else None

                is_header_ok = False
                if header is not None:
                    is_header_ok = any(isinstance(c, str) and "MesRef" in c for c in header)

                # ✅ evita estourar quando nrows < 3
                has_row_i2 = (i + 2) < nrows

                # caso especial original (título + "header" + dados)
                is_header_missing_but_valid = (
                    (not is_header_ok)
                    and has_row_i2
                    and isinstance(df.iloc[i + 2, 0], datetime)
                )

                # ✅ NOVO: caso ainda mais comum (título + dados direto, sem header)
                is_title_plus_data_only = (
                    (not is_header_ok)
                    and (i + 1) < nrows
                    and isinstance(df.iloc[i + 1, 0], datetime)
                )

                if is_header_ok or is_header_missing_but_valid or is_title_plus_data_only:

                    rows = []

                    # ✅ se for "título + dados direto", começa no i+1
                    j = (i + 1) if is_title_plus_data_only else (i + 2)

                    while j < nrows:
                        row = df.iloc[j]
                        if all(pd.isna(x) for x in row):
                            break
                        rows.append(row.to_list())
                        j += 1

                    tipo, dados = parse_block(titulo, header, rows)
                    if tipo:
                        result[tipo].extend(dados)

                    i = j
                    continue

            i += 1

    return result

# ==========================
# TABELAS & CHAVES
# ==========================

TABELAS_CONFLITO = {
    "boletos_emitidos": "clinica_id,mes_ref",
    "taxa_pago_no_vencimento": "clinica_id,mes_ref",
    "taxa_atraso_faixa": "clinica_id,mes_ref,faixa",
    "inadimplencia": "clinica_id,mes_ref",
    "tempo_medio_pagamento": "clinica_id,mes_ref",
    "valor_medio_boleto": "clinica_id,mes_ref",
    "parcelamentos_detalhe": "clinica_id,mes_ref,qtde_parcelas",
}


# ==========================
# REGISTRAR IMPORTAÇÃO
# ==========================

def registrar_importacao(clinica_id, arquivo_nome, parsed, contagem):
    url = f"{SUPABASE_URL}/rest/v1/importacoes"

    # Extrair o mes_ref do arquivo importado
    mes_ref = None

    # tenta pegar dos boletos
    if parsed.get("boletos_emitidos") and len(parsed["boletos_emitidos"]) > 0:
        mes_ref = parsed["boletos_emitidos"][0].get("mes_ref")

    # fallback caso boletos estejam vazios
    if not mes_ref:
        # procura em qualquer outra tabela
        for key in parsed:
            if isinstance(parsed[key], list) and len(parsed[key]) > 0:
                if "mes_ref" in parsed[key][0]:
                    mes_ref = parsed[key][0]["mes_ref"]
                    break

    payload = {
        "clinica_id": clinica_id,
        "arquivo_nome": arquivo_nome,
        "total_linhas": sum(contagem.values()),
        "status": "concluido",
        "log": contagem,
        "mes_ref": mes_ref  # 🔥 AGORA SALVAMOS O MES_REF
    }

    requests.post(url, headers=HEADERS, json=payload)


# ==========================
# PROCESSAMENTO FINAL
# ==========================

def processar_excel(contents: bytes, arquivo_nome="arquivo.xlsx"):
    parsed = parse_excel_from_bytes(contents)

    clinica = parsed["estabelecimento"]

    clinica_id = get_or_create_clinica(
        clinica["cnpj"],
        clinica["codigo_clinica"]
    )

    contagem = {}

    for tabela, conflict in TABELAS_CONFLITO.items():

        registros = parsed[tabela]
        contagem[tabela] = len(registros)

        if not registros:
            continue

        conflict_cols = [c.strip() for c in conflict.split(",")]

        for item in registros:
            item["clinica_id"] = clinica_id
            normalize_for_conflict(item, conflict_cols)

        registros = dedupe(registros, conflict_cols)

        supabase_upsert(tabela, registros, conflict)

    # SALVAR NO HISTÓRICO
    registrar_importacao(
        clinica_id=clinica_id,
        arquivo_nome=arquivo_nome,
        parsed=parsed,
        contagem=contagem
    )

    return {
        "clinica": clinica,
        "clinica_id": clinica_id,
        "registros": contagem,
        "arquivo": arquivo_nome,
        "status": "ok"
    }

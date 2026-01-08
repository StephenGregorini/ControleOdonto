import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal, InvalidOperation

import requests


def _load_env_file(path: str):
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


_load_env_file(".env")
_load_env_file(".env.local")
_load_env_file(os.path.join("backend", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ANON_KEY) no ambiente."
    )

if "db." in SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.replace("db.", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


def supabase_get(table: str, select: str = "*", extra_params: dict | None = None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    params = {"select": select}
    if extra_params:
        params.update(extra_params)
    r = requests.get(url, headers=HEADERS, params=params)
    if r.status_code not in (200, 206):
        raise RuntimeError(f"Erro ao buscar {table}: {r.status_code} - {r.text}")
    return r.json()


def supabase_upsert(table: str, data: list[dict], on_conflict: str = "id"):
    if not data:
        return []
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    params = {"on_conflict": on_conflict}
    r = requests.post(
        url,
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=representation"},
        params=params,
        json=data,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Erro ao atualizar {table}: {r.status_code} - {r.text}")
    return r.json()


def normalize_cnpj(value: str | None) -> str:
    if value is None:
        return ""
    txt = str(value).strip()
    if not txt:
        return ""
    try:
        if re.match(r"^-?\\d+(\\.\\d+)?(e[+-]?\\d+)?$", txt, re.IGNORECASE):
            num = Decimal(txt)
            txt = str(int(num))
    except (InvalidOperation, ValueError):
        pass
    digits = re.sub(r"\\D", "", txt)
    if digits and len(digits) < 14:
        digits = digits.zfill(14)
    return digits


def col_to_index(ref: str) -> int:
    col = "".join(ch for ch in ref if ch.isalpha())
    idx = 0
    for ch in col:
        idx = idx * 26 + (ord(ch.upper()) - 64)
    return idx - 1


def read_xlsx_rows(path: str):
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        shared = []
        if "xl/sharedStrings.xml" in names:
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            ns = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            for si in root.findall("a:si", ns):
                text = "".join(t.text or "" for t in si.findall(".//a:t", ns))
                shared.append(text)

        sheet = "xl/worksheets/sheet1.xml"
        root = ET.fromstring(z.read(sheet))
        ns = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

        rows = []
        max_col = 0
        for row in root.findall(".//a:sheetData/a:row", ns):
            cells = row.findall("a:c", ns)
            if not cells:
                continue
            row_dict = {}
            for c in cells:
                ref = c.get("r")
                if not ref:
                    continue
                col_idx = col_to_index(ref)
                max_col = max(max_col, col_idx)
                t = c.get("t")
                v = c.find("a:v", ns)
                if t == "s" and v is not None:
                    idx = int(v.text)
                    val = shared[idx] if idx < len(shared) else ""
                elif t == "inlineStr":
                    is_el = c.find("a:is", ns)
                    t_el = is_el.find("a:t", ns) if is_el is not None else None
                    val = t_el.text if t_el is not None else ""
                else:
                    val = v.text if v is not None else ""
                row_dict[col_idx] = val
            row_list = [row_dict.get(i, "") for i in range(max_col + 1)]
            rows.append(row_list)

    if not rows:
        return [], []

    header = rows[0]
    data_rows = rows[1:]
    return header, data_rows


def normalize_header(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower())


def main():
    if len(sys.argv) < 2:
        print("Uso: python3 import_nomes_clinicas_xlsx.py nome_clinicas_controle_odonto.xlsx [--dry-run]")
        sys.exit(1)

    path = sys.argv[1]
    dry_run = "--dry-run" in sys.argv

    header, rows = read_xlsx_rows(path)
    if not header:
        raise RuntimeError("Cabeçalho não encontrado no XLSX.")

    header_map = {normalize_header(col): idx for idx, col in enumerate(header) if col}
    cnpj_idx = header_map.get("cnpj")
    nome_idx = header_map.get("nomeclinica") or header_map.get("nome")

    if cnpj_idx is None or nome_idx is None:
        raise RuntimeError("Colunas esperadas não encontradas. Esperado: CNPJ e Nome_Clinica.")

    clinicas = supabase_get("clinicas", select="id,cnpj,nome,codigo_clinica")
    clinicas_map = {}
    clinicas_nome = {}
    for row in clinicas or []:
        cnpj_norm = normalize_cnpj(row.get("cnpj"))
        if cnpj_norm:
            clinicas_map[cnpj_norm] = row.get("id")
            clinicas_nome[cnpj_norm] = row.get("nome")

    updates = []
    missing = []
    duplicates = 0
    skipped = 0
    seen = set()

    for row in rows:
        cnpj_raw = row[cnpj_idx] if cnpj_idx < len(row) else ""
        nome_raw = row[nome_idx] if nome_idx < len(row) else ""
        cnpj = normalize_cnpj(cnpj_raw)
        nome = str(nome_raw or "").strip()

        if not cnpj or not nome:
            skipped += 1
            continue

        if cnpj in seen:
            duplicates += 1
            continue
        seen.add(cnpj)

        clinica_id = clinicas_map.get(cnpj)
        if not clinica_id:
            missing.append(cnpj)
            continue

        if clinicas_nome.get(cnpj) == nome:
            skipped += 1
            continue

        updates.append({"id": clinica_id, "nome": nome})

    print(
        f"Total linhas: {len(rows)} | Atualizações: {len(updates)} | "
        f"Ignoradas: {skipped} | Duplicadas: {duplicates} | Sem CNPJ: {len(missing)}"
    )

    if missing:
        print("CNPJs não encontrados (primeiros 20):")
        print(", ".join(missing[:20]))

    if dry_run:
        print("Dry-run habilitado. Nenhuma atualização enviada.")
        return

    chunk_size = 500
    for i in range(0, len(updates), chunk_size):
        chunk = updates[i : i + chunk_size]
        supabase_upsert("clinicas", chunk, on_conflict="id")
        print(f"Enviado lote {i // chunk_size + 1}")

    print("✅ Nomes atualizados com sucesso.")


if __name__ == "__main__":
    main()

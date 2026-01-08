import csv
import os
import sys
from datetime import datetime
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
    raise RuntimeError("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ANON_KEY) no ambiente.")

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


def supabase_insert(table: str, data: list[dict]):
    if not data:
        return []
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    r = requests.post(
        url,
        headers={**HEADERS, "Prefer": "return=representation"},
        json=data,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Erro ao inserir em {table}: {r.status_code} - {r.text}")
    return r.json()


def parse_brl_number(value: str | None):
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


def parse_date_br(value: str | None):
    if not value:
        return None
    txt = str(value).strip()
    if not txt:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(txt, fmt).date().isoformat()
        except Exception:
            continue
    return None


def load_clinicas_map():
    rows = supabase_get("clinicas", select="id,cnpj")
    mapping = {}
    for row in rows or []:
        cnpj = (row.get("cnpj") or "").strip()
        if cnpj:
            mapping[cnpj] = row.get("id")
    return mapping


def read_csv(path: str):
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            yield row


def main():
    if len(sys.argv) < 2:
        print("Uso: python3 import_antecipacoes_csv.py import.csv [--dry-run]")
        sys.exit(1)

    path = sys.argv[1]
    dry_run = "--dry-run" in sys.argv

    clinicas_map = load_clinicas_map()
    payloads = []
    skipped = 0

    for row in read_csv(path):
        cnpj = (row.get("CNPJ") or "").strip()
        clinica_id = clinicas_map.get(cnpj)
        if not clinica_id:
            skipped += 1
            continue

        data_antecipacao = parse_date_br(row.get("Data Antecipação"))
        data_reembolso = parse_date_br(row.get("Data Reembolso"))
        valor_liquido = parse_brl_number(row.get("MoneyDetails_Net"))
        valor_taxa = parse_brl_number(row.get("MoneyDetails_Fee"))
        valor_a_pagar = parse_brl_number(row.get("MoneyDetails_ToBePaid"))

        if valor_liquido is None:
            skipped += 1
            continue

        payloads.append(
            {
                "clinica_id": clinica_id,
                "cnpj": cnpj,
                "data_antecipacao": data_antecipacao or datetime.utcnow().date().isoformat(),
                "valor_liquido": valor_liquido,
                "valor_taxa": valor_taxa,
                "valor_a_pagar": valor_a_pagar,
                "data_reembolso": data_reembolso,
            }
        )

    print(f"Linhas válidas: {len(payloads)} | Ignoradas: {skipped}")

    if dry_run:
        print("Dry-run habilitado. Nenhum dado foi enviado.")
        return

    # Inserir em lotes para evitar payload grande
    chunk_size = 500
    for i in range(0, len(payloads), chunk_size):
        chunk = payloads[i : i + chunk_size]
        supabase_insert("antecipacoes", chunk)
        print(f"Enviado lote {i // chunk_size + 1}")

    print("✅ Importação concluída.")


if __name__ == "__main__":
    main()

import json
import zipfile
import xml.etree.ElementTree as ET
from migrate_excel import parse_excel_budget

cats, txs, svs = parse_excel_budget(r"c:\Budget\Monthly Budget.xlsm")

# Format into TypeScript mock-data.ts
with open(r"c:\Budget\src\lib\mock-data.ts", "w", encoding="utf-8") as f:
    f.write('import { Category, Tag, Transaction, MonthlySavings } from "./types";\n\n')
    
    # Categories & Tags
    cat_list = []
    tag_list = []
    cat_id_counter = 1
    tag_id_counter = 1
    
    cat_id_map = {}
    for cat_name, tag_names in cats.items():
        c_id = f"cat-{cat_id_counter}"
        cat_id_map[cat_name] = c_id
        cat_list.append({"id": c_id, "name": cat_name})
        cat_id_counter += 1
        
        for t_name in tag_names:
            t_id = f"tag-{tag_id_counter}"
            tag_list.append({"id": t_id, "category_id": c_id, "name": t_name})
            tag_id_counter += 1

    f.write(f"export const INITIAL_CATEGORIES: Category[] = {json.dumps(cat_list, indent=2)};\n\n")
    f.write(f"export const INITIAL_TAGS: Tag[] = {json.dumps(tag_list, indent=2)};\n\n")

    # Transactions
    formatted_txs = []
    tx_counter = 1
    for t in txs:
        c_id = cat_id_map.get(t["category"], "cat-1")
        # Find matching tag
        t_match = next((tg for tg in tag_list if tg["category_id"] == c_id and tg["name"] == t["tag"]), None)
        t_id = t_match["id"] if t_match else "tag-1"
        
        formatted_txs.append({
            "id": f"tx-{tx_counter}",
            "date": t["date"],
            "category_id": c_id,
            "category_name": t["category"],
            "tag_id": t_id,
            "tag_name": t["tag"],
            "description": t["description"],
            "amount": t["amount"],
            "is_one_off": t["is_one_off"]
        })
        tx_counter += 1

    f.write(f"export const INITIAL_TRANSACTIONS: Transaction[] = {json.dumps(formatted_txs, indent=2)};\n\n")

    # Savings
    formatted_svs = []
    s_counter = 1
    for s in svs:
        formatted_svs.append({
            "id": f"sav-{s_counter}",
            "month": s["month"],
            "main_checking": s["main_checking"],
            "gx_bank": s["gx_bank"],
            "gx_rate": s["gx_rate"],
            "ryt_bank": s["ryt_bank"],
            "ryt_rate": s["ryt_rate"],
            "epf_locked": s["epf_locked"]
        })
        s_counter += 1

    f.write(f"export const INITIAL_SAVINGS: MonthlySavings[] = {json.dumps(formatted_svs, indent=2)};\n")

print("Generated src/lib/mock-data.ts successfully")

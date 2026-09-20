import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import os

def excel_serial_to_date(serial_str):
    try:
        val = float(serial_str)
        return (datetime(1899, 12, 30) + timedelta(days=val)).strftime('%Y-%m-%d')
    except Exception:
        return serial_str

def parse_excel_budget(excel_path):
    with zipfile.ZipFile(excel_path, 'r') as z:
        ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        
        # Shared strings
        shared_strings = []
        if "xl/sharedStrings.xml" in z.namelist():
            ss_tree = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in ss_tree.findall('.//main:si', ns):
                shared_strings.append("".join([t.text for t in si.findall('.//main:t', ns) if t.text]))

        def get_val(c):
            t = c.attrib.get('t')
            v = c.find('main:v', ns)
            val = v.text if v is not None else ""
            if t == 's' and val.isdigit():
                val = shared_strings[int(val)]
            return val

        # 1. Parse Lookup sheet (Categories & Tags)
        categories = {}
        lookup_tree = ET.fromstring(z.read("xl/worksheets/sheet4.xml"))
        rows = lookup_tree.findall('.//main:row', ns)
        
        header_map = {}
        for c in rows[0].findall('main:c', ns):
            col_letter = ''.join([ch for ch in c.attrib.get('r') if ch.isalpha()])
            val = get_val(c).strip()
            if val and val != "Main Category":
                header_map[col_letter] = val
                categories[val] = []

        for r in rows[1:]:
            for c in r.findall('main:c', ns):
                col_letter = ''.join([ch for ch in c.attrib.get('r') if ch.isalpha()])
                if col_letter in header_map:
                    tag_name = get_val(c).strip()
                    if tag_name and tag_name not in categories[header_map[col_letter]]:
                        categories[header_map[col_letter]].append(tag_name)

        # 2. Parse Transactions
        tx_tree = ET.fromstring(z.read("xl/worksheets/sheet3.xml"))
        tx_rows = tx_tree.findall('.//main:row', ns)
        transactions = []
        for r in tx_rows[1:]:
            c_dict = {}
            for c in r.findall('main:c', ns):
                col_letter = ''.join([ch for ch in c.attrib.get('r') if ch.isalpha()])
                c_dict[col_letter] = get_val(c).strip()
            
            date_raw = c_dict.get('A')
            cat = c_dict.get('C')
            tag = c_dict.get('D')
            desc = c_dict.get('E', '')
            amt_raw = c_dict.get('F')
            one_off = c_dict.get('G', '').upper() == 'Y'

            if date_raw and amt_raw:
                try:
                    amount = float(amt_raw)
                    date_iso = excel_serial_to_date(date_raw)
                    transactions.append({
                        "date": date_iso,
                        "category": cat,
                        "tag": tag,
                        "description": desc,
                        "amount": amount,
                        "is_one_off": one_off
                    })
                except Exception:
                    pass

        # 3. Parse Savings
        savings_tree = ET.fromstring(z.read("xl/worksheets/sheet2.xml"))
        s_rows = savings_tree.findall('.//main:row', ns)
        savings = []
        for r in s_rows[1:]:
            c_dict = {}
            for c in r.findall('main:c', ns):
                col_letter = ''.join([ch for ch in c.attrib.get('r') if ch.isalpha()])
                c_dict[col_letter] = get_val(c).strip()
            
            month_raw = c_dict.get('A')
            if month_raw:
                month_iso = excel_serial_to_date(month_raw)
                try:
                    main_chk = float(c_dict.get('B') or 0)
                    gx_bank = float(c_dict.get('C') or 0)
                    gx_rate = float(c_dict.get('D') or 0.0355)
                    ryt_bank = float(c_dict.get('E') or 0)
                    ryt_rate = float(c_dict.get('F') or 0)
                    epf_locked = float(c_dict.get('G') or 0)
                    savings.append({
                        "month": month_iso,
                        "main_checking": main_chk,
                        "gx_bank": gx_bank,
                        "gx_rate": gx_rate,
                        "ryt_bank": ryt_bank,
                        "ryt_rate": ryt_rate,
                        "epf_locked": epf_locked
                    })
                except Exception:
                    pass

        return categories, transactions, savings

def generate_sql(categories, transactions, savings, output_sql_path):
    with open(output_sql_path, "w", encoding="utf-8") as f:
        f.write("-- ========================================================\n")
        f.write("-- Safe Migration & Seed Script for Supabase (Personal Budget)\n")
        f.write("-- ========================================================\n\n")

        f.write("-- STEP 1: Relax user_id NOT NULL constraint so data can seed even before user auth is created\n")
        f.write("ALTER TABLE public.transactions ALTER COLUMN user_id DROP NOT NULL;\n")
        f.write("ALTER TABLE public.monthly_savings ALTER COLUMN user_id DROP NOT NULL;\n\n")

        f.write("-- STEP 2: Configure RLS policies to allow reading & writing with anon / local client\n")
        f.write("DROP POLICY IF EXISTS \"Categories and tags are viewable by authenticated users\" ON public.categories;\n")
        f.write("DROP POLICY IF EXISTS \"Tags are viewable by authenticated users\" ON public.tags;\n")
        f.write("DROP POLICY IF EXISTS \"Allow public read categories\" ON public.categories;\n")
        f.write("DROP POLICY IF EXISTS \"Allow public read tags\" ON public.tags;\n")
        f.write("DROP POLICY IF EXISTS \"Users can manage their own transactions\" ON public.transactions;\n")
        f.write("DROP POLICY IF EXISTS \"Allow all transactions access\" ON public.transactions;\n")
        f.write("DROP POLICY IF EXISTS \"Users can manage their monthly savings\" ON public.monthly_savings;\n")
        f.write("DROP POLICY IF EXISTS \"Allow all savings access\" ON public.monthly_savings;\n\n")

        f.write("CREATE POLICY \"Allow public read categories\" ON public.categories FOR SELECT USING (true);\n")
        f.write("CREATE POLICY \"Allow public read tags\" ON public.tags FOR SELECT USING (true);\n")
        f.write("CREATE POLICY \"Allow all transactions access\" ON public.transactions FOR ALL USING (true) WITH CHECK (true);\n")
        f.write("CREATE POLICY \"Allow all savings access\" ON public.monthly_savings FOR ALL USING (true) WITH CHECK (true);\n\n")

        f.write("-- STEP 3: Insert Categories & Tags\n")
        f.write("DO $$\n")
        f.write("DECLARE\n")
        f.write("  cat_id uuid;\n")
        f.write("BEGIN\n")
        
        colors = {
            "Food": "#f97316",
            "Transport": "#06b6d4",
            "Home_Bills": "#3b82f6",
            "Self_care": "#ec4899",
            "Subscription": "#8b5cf6",
            "Health": "#ef4444",
            "Own_Interest": "#eab308",
            "Entertainment": "#a855f7",
            "Shopping": "#10b981",
            "Others": "#6b7280"
        }

        for cat, tags in categories.items():
            color = colors.get(cat, "#3b82f6")
            f.write(f"  INSERT INTO public.categories (name, color) VALUES ('{cat}', '{color}')\n")
            f.write(f"  ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color\n")
            f.write(f"  RETURNING id INTO cat_id;\n\n")
            for t in tags:
                clean_t = t.replace("'", "''")
                f.write(f"  INSERT INTO public.tags (category_id, name) VALUES (cat_id, '{clean_t}')\n")
                f.write(f"  ON CONFLICT (category_id, name) DO NOTHING;\n")
            f.write("\n")

        f.write("END $$;\n\n")

        f.write("-- STEP 4: Insert Transactions (uses primary user ID if one exists, otherwise NULL)\n")
        f.write("DO $$\n")
        f.write("DECLARE\n")
        f.write("  target_user_id uuid := NULL;\n")
        f.write("BEGIN\n")
        f.write("  -- Check if there is an auth user created, otherwise proceed with NULL\n")
        f.write("  SELECT id INTO target_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;\n\n")
        f.write("  -- Clear any existing transactions to prevent duplicate seeding\n")
        f.write("  TRUNCATE TABLE public.transactions;\n\n")

        for tx in transactions:
            cat = tx['category'].replace("'", "''")
            tag = tx['tag'].replace("'", "''")
            desc = tx['description'].replace("'", "''")
            amt = tx['amount']
            dt = tx['date']
            one_off = "true" if tx['is_one_off'] else "false"
            f.write(f"  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)\n")
            f.write(f"  SELECT target_user_id, '{dt}', c.id, t.id, {amt}, '{desc}', {one_off}\n")
            f.write(f"  FROM public.categories c\n")
            f.write(f"  JOIN public.tags t ON t.category_id = c.id\n")
            f.write(f"  WHERE c.name = '{cat}' AND t.name = '{tag}';\n")

        f.write("\n  -- Insert Monthly Savings\n")
        f.write("  DELETE FROM public.monthly_savings;\n")
        for s in savings:
            m = s['month']
            chk = s['main_checking']
            gx = s['gx_bank']
            gxr = s['gx_rate']
            ryt = s['ryt_bank']
            rytr = s['ryt_rate']
            epf = s['epf_locked']
            f.write(f"  INSERT INTO public.monthly_savings (user_id, month, main_checking, gx_bank, gx_rate, ryt_bank, ryt_rate, epf_locked)\n")
            f.write(f"  VALUES (target_user_id, '{m}', {chk}, {gx}, {gxr}, {ryt}, {rytr}, {epf});\n")

        f.write("END $$;\n\n")
        f.write("-- Verification query:\n")
        f.write("SELECT 'Categories:' AS entity, count(*) FROM public.categories\n")
        f.write("UNION ALL\n")
        f.write("SELECT 'Tags:' AS entity, count(*) FROM public.tags\n")
        f.write("UNION ALL\n")
        f.write("SELECT 'Transactions:' AS entity, count(*) FROM public.transactions\n")
        f.write("UNION ALL\n")
        f.write("SELECT 'Monthly Savings:' AS entity, count(*) FROM public.monthly_savings;\n")

if __name__ == "__main__":
    excel_file = r"c:\Budget\Monthly Budget.xlsm"
    out_sql = r"c:\Budget\scripts\seed_data.sql"
    cats, txs, svs = parse_excel_budget(excel_file)
    generate_sql(cats, txs, svs, out_sql)
    print(f"Generated robust seed script: {out_sql}")

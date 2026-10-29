# Genera public/ospedali-it.json dall'elenco ufficiale del Ministero della Salute
# (posti letto per stabilimento ospedaliero e per struttura, anno 2023).
# Uso: python build_ospedali.py  (i due CSV vanno scaricati in questa cartella)
import csv, io, json, re, pathlib

D = pathlib.Path(__file__).parent
OUT = pathlib.Path(r"C:\Users\leona\Desktop\lemo-training\public\ospedali.json")

ACR = {"IRCCS","ASL","ASST","AOU","AO","PO","SPA","SRL","USL","ULSS","ASP","ASUR","INRCA","IDI","IOR","IEO","CTO","INI","SS",
       "AUSL","ATS","CIC","UO","II","III","IV","XXIII","FPO","RSA","USSL","AOR","AORN","ARNAS","ISMETT","IRST","CRO","CROB",
       "INMI","ICS","GVM","KOS","CDC","IFO","HSR","SPDC"}
SMALL = {"di","del","della","dello","dei","degli","delle","e","ed","da","dal","dalla","in","a","al","alla","con","per","su",
         "sul","sulla","la","il","lo","le","gli"}
ACC = {"a":"à","e":"è","i":"ì","o":"ò","u":"ù"}
CO = (r"(?:\bS\.?\s?P\.?\s?A\b\.?|\bS\.?\s?R\.?\s?L\b\.?|\bS\.?\s?A\.?\s?S\b\.?|\bS\.?\s?C\.?\s?A\.?\s?R\.?\s?L\b\.?"
      r"|\bSOC\.?\s?COOP\b\.?|\bS\.?\s?N\.?\s?C\b\.?|\bONLUS\b)")
ABBR = [(r"\bP\.\s?O\.\s?'?", "Presidio Ospedaliero "), (r"\bPO\b", "Presidio Ospedaliero"),
        (r"\bAz\.\s?Osp(?:edaliera|\.)\s?", "Azienda Ospedaliera "), (r"\bAz\.\s?", "Azienda "), (r"\bOsp\.\s?", "Ospedale "),
        (r"\bFond\.\s?", "Fondazione "), (r"\bIst\.\s?", "Istituto "), (r"\bUniv\.\s?", "Universitaria "),
        (r"\bNeurol\.\s?", "Neurologico "), (r"\bP\. Ospedaliero", "Presidio Ospedaliero"), (r"\bEmerg\.", "Emergenza")]
ALIAS = {"Azienda Ospedaliero-Universitaria Pisana": "Cisanello Santa Chiara",
         "Azienda Ospedaliera Universitaria Senese": "Le Scotte Santa Maria alle Scotte",
         "Fondazione del Piemonte per l'Oncologia": "IRCCS Candiolo FPO",
         "Ospedale F. Spaziani Frosinone": "ASL Frosinone"}

def clean_raw(s):
    s = s.replace("`", "'").strip()
    s = re.sub(r"([AEIOU])'(?=$|[\s\-,)])", lambda m: ACC[m.group(1).lower()].upper(), s)
    s = re.sub(CO, "", s, flags=re.I)
    s = re.sub(r"\s*-\s*", " - ", s)
    s = re.sub(r"\s{2,}", " ", s).strip(" -,'\"")
    return re.sub(r"'\s*$", "", s)

def title(s):
    out = []
    for k, w in enumerate(s.split(" ")):
        core = re.sub(r"[^\w.]", "", w)
        if core.upper() in ACR or re.fullmatch(r"([A-Z]\.){2,}[A-Z]?\.?", core):
            out.append(w.upper()); continue
        lw = w.lower()
        if k > 0 and lw in SMALL: out.append(lw); continue
        out.append(re.sub(r"(^|[-'\".(/])([a-zà-ù])", lambda m: m.group(1) + m.group(2).upper(), lw))
    return " ".join(out)

def fix(s):
    for a, b in ABBR: s = re.sub(a, b, s)
    s = re.sub(r"([aeiou])'(?=$|[\s,)\-])", lambda m: ACC[m.group(1)], s)
    s = re.sub(r"\b(S|Ss|G|M|F|A|C|E|V|L|P)\.(?=[A-Z][a-z])", r"\1. ", s)
    s = re.sub(r"\b(?:[A-Z]\.\s?){2,}[A-Z]?\.?", lambda m: m.group(0).replace(" ", ""), s)
    s = re.sub(r"\bI\.R\.C\.C\.S\.?", "IRCCS", s); s = re.sub(r"\bC\.R\.O\.B\.?", "CROB", s)
    s = s.replace(" – ", " - ").replace("Ospedaliero - Universitaria", "Ospedaliero-Universitaria")
    if not s.startswith("L'"): s = re.sub(r"\bL'(?=[A-Z])", "l'", s)
    return re.sub(r"\s{2,}", " ", s).strip(" -")

def comune(s):
    s = re.sub(r"\s+", " ", s.strip()).lower()
    s = re.sub(r"(^|[\s\-'])([a-zà-ù])", lambda m: m.group(1) + m.group(2).upper(), s)
    s = re.sub(r"(?<=\s)(Di|Del|Della|De|A|In|Sul|Sulla|Al|Nel|Dei|Delle|E)(?=\s)", lambda m: m.group(1).lower(), s)
    return re.sub(r"([aeiou])'(?=$|\s)", lambda m: ACC[m.group(1)], s)

def rows(name):
    raw = (D / name).read_bytes().decode("latin-1")
    r = list(csv.reader(io.StringIO(raw), delimiter=";"))
    return r[0], r[1:]

found = {}
h, data = rows("stab2023.csv"); i = {k: n for n, k in enumerate(h)}
for r in data:
    if len(r) < len(h): continue
    found.setdefault((r[i["Codice struttura"]], r[i["Subcodice"]]), (r[i["Denominazione Struttura/Stabilimento"]], r[i["Comune"]], r[i["Sigla Provincia"]]))
h, data = rows("strutt2023.csv"); i = {k: n for n, k in enumerate(h)}
for r in data:
    if len(r) < len(h): continue
    found.setdefault((r[i["Codice struttura"]], "S"), (r[i["Denominazione struttura"]], r[i["Comune"]], r[i["Sigla provincia"]]))

seen, out = set(), []
for n, c, p in found.values():
    name, city = fix(title(clean_raw(n))), comune(c)
    if (name.lower(), city) in seen: continue
    seen.add((name.lower(), city))
    e = {"n": name, "c": city, "p": p.strip()}
    for k, v in ALIAS.items():
        if name.lower().startswith(k.lower()): e["a"] = v
    out.append(e)
# Spagna: Catalogo Nacional de Hospitales 2025 (Ministerio de Sanidad), foglio "DIRECTORIO DE HOSPITALES"
import openpyxl
ws = openpyxl.load_workbook(D / "CNH_2025.xlsx", read_only=True)["DIRECTORIO DE HOSPITALES"]
it = ws.iter_rows(values_only=True); hdr = next(it); j = {k: n for n, k in enumerate(hdr)}
es_seen = set()
for r in it:
    n, c, pr = (r[j["Nombre Centro"]] or "").strip(), (r[j["Municipio"]] or "").strip(), (r[j["Provincia"]] or "").strip()
    if not n or (n.lower(), c) in es_seen: continue
    es_seen.add((n.lower(), c))
    out.append({"n": re.sub(r"\s{2,}", " ", n), "c": c, "p": pr, "x": "ES"})
out.sort(key=lambda e: e["n"].lower())
OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(out), "voci (", sum(1 for e in out if e.get("x") == "ES"), "spagnole ) ->", OUT, OUT.stat().st_size, "byte")
print([e["n"] for e in out if "Gesù" in e["n"]][:1], [e["n"] for e in out if "Careggi" in e["n"]])

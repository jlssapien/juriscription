# Methodology — Dataset Metadata Report

This document explains how the metadata in `dataset-metadata.md` was produced, so the analysis can be reproduced or updated.

---

## 1. Identify the Data Source

The front page of the site (`/drugs`) fetches `frontier-2025/public/drugs-index.json` at runtime. To trace where that file comes from, read the build scripts:

- `scripts/build_search_index.py` — writes `drugs-index.json` from the four JSON data files
- `scripts/convert_drugs.py` — writes `data/eu.json`, `data/us.json`, `data/uk.json` from the master CSV

The upstream source is `updated data/normalised_combined.csv`.

---

## 2. Count Records per Source File

```python
import json
from pathlib import Path

base = Path('data')
for f in ['eu.json', 'us.json', 'uk.json', 'manual.json']:
    d = json.loads((base / f).read_text())
    print(f'{f}: {len(d)} records')
```

Also count the final browser index:

```python
idx = json.loads(Path('frontier-2025/public/drugs-index.json').read_text())
print('Total index records:', len(idx))
print('Index file size (MB):', round(Path('frontier-2025/public/drugs-index.json').stat().st_size / 1024 / 1024, 1))
```

---

## 3. Count Raw CSV Rows by Source

```python
import csv
from collections import Counter
from pathlib import Path

csv_path = Path('updated data/normalised_combined.csv')
sources = Counter()
with open(csv_path, encoding='utf-8') as f:
    for row in csv.DictReader(f):
        sources[row['source_dataset']] += 1

print(dict(sources))
print('Total:', sum(sources.values()))
```

---

## 4. Legal Status Breakdown

Run against the browser index (UK/US records carry status codes; EU records do not):

```python
statuses = {}
for d in idx:
    l = d.get('l', '')
    if l:
        statuses[l] = statuses.get(l, 0) + 1
print(statuses)
```

---

## 5. Count Unique Routes of Administration

Routes are pipe-separated strings (`"ORAL | INHALATION"`), so split before counting:

```python
routes = set()
for d in idx:
    for term in (d.get('f') or '').split(' | '):
        t = term.strip()
        if t:
            routes.add(t)
print('Unique routes:', len(routes))
```

---

## 6. EU Country Authorisation Counts

Run against the raw CSV rather than the index (the index collapses EU entries into a single record with a `countries` array; the CSV retains one row per country):

```python
from collections import Counter

eu_countries = Counter()
with open(csv_path, encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['source_dataset'] == 'EMA_Art57':
            c = (row.get('authorisation_country') or '').strip()
            if c:
                eu_countries[c] += 1

print(eu_countries.most_common(10))
print('Total EU countries:', len(eu_countries))
```

---

## 7. Top Marketing Authorisation Holders

```python
companies = {}
for d in idx:
    c = d.get('c', '')
    if c:
        companies[c] = companies.get(c, 0) + 1

top = sorted(companies.items(), key=lambda x: -x[1])[:5]
print(top)
```

Note: company names are truncated to 40 characters in the index by `build_search_index.py`. For full names, query `data/eu.json`, `data/us.json`, or `data/uk.json` directly.

---

## Running the Scripts

All scripts are in `scripts/` and should be run from the `MedChecks Website/` directory:

```bash
# Regenerate eu/us/uk.json from the CSV
python3 scripts/convert_drugs.py

# Regenerate drugs-index.json from the JSON data files
python3 scripts/build_search_index.py
```

Dependencies are listed in `scripts/requirements.txt`.

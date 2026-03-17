# Methodology — FDA → MHRA Dataset Metadata Report

This document explains how the figures in `fda-to-mhra-metadata.md` were produced.

---

## 1. Identify the Data Source

The FDA → MHRA page fetches `frontier-2025/public/fda-to-mhra-index.json` at runtime. Tracing the build:

- `scripts/build_match_indexes.py` converts `fda_to_mhra_matches.csv` → `fda-to-mhra-index.json`
- The source CSV lives at `../Identifying most similar drugs/outputs/fda_to_mhra_matches.csv` (relative to the `MedChecks Website/` directory)

---

## 2. Load the Index and Get Basic Counts

```python
import json
from pathlib import Path

data = json.loads(Path('frontier-2025/public/fda-to-mhra-index.json').read_text())
print('Total records:', len(data))

unique_fda  = len(set(d.get('a', '') for d in data))
unique_mhra = len(set(d.get('d', '') for d in data))
print('Unique FDA source products:', unique_fda)
print('Unique MHRA matched products:', unique_mhra)

size_mb = round(Path('frontier-2025/public/fda-to-mhra-index.json').stat().st_size / 1024 / 1024, 1)
print('Index file size (MB):', size_mb)
```

---

## 3. Confidence Band Breakdown

```python
from collections import Counter
import statistics

conf = Counter(d.get('k', '') for d in data)
print('Confidence breakdown:', dict(conf))

# Mean total score per band
from collections import defaultdict
by_conf = defaultdict(list)
for d in data:
    by_conf[d.get('k', '')].append(d.get('t', 0))

for band, scores in sorted(by_conf.items()):
    print(f'  {band}: mean={statistics.mean(scores):.3f}, n={len(scores)}')
```

---

## 4. Score Distributions

Exclude NONE records (no score data) before computing stats:

```python
scored = [d for d in data if d.get('k') != 'NONE']

total_scores = [d['t'] for d in scored if 't' in d]
inn_scores   = [d['g'] for d in scored if 'g' in d]
str_scores   = [d['h'] for d in scored if 'h' in d]

print(f'Total score — mean: {statistics.mean(total_scores):.3f}, median: {statistics.median(total_scores):.3f}')
print(f'INN score   — mean: {statistics.mean(inn_scores):.3f}, median: {statistics.median(inn_scores):.3f}')
print(f'Strength    — mean: {statistics.mean(str_scores):.3f}, median: {statistics.median(str_scores):.3f}')
```

---

## 5. "Right Drug, Wrong Dose" — INN Match, Zero Strength

```python
# Records where the molecule matches perfectly but the dose does not
inn_no_strength = [d for d in data if d.get('g') == 1.0 and d.get('h') == 0.0]
print(f'Count: {len(inn_no_strength)} ({100 * len(inn_no_strength) / len(data):.1f}%)')

# Which ingredients drive this most?
top_ingredients = Counter(d.get('b', '') for d in inn_no_strength).most_common(10)
print(top_ingredients)
```

---

## 6. Unmatched FDA Products (NONE Confidence)

```python
none_conf  = [d for d in data if d.get('k') == 'NONE']
none_names = sorted(set(d.get('a', '') for d in none_conf))
print(f'Unique unmatched FDA products: {len(none_names)}')
print('Sample:', none_names[:20])
```

---

## 7. FDA Products with the Most MHRA Matches

```python
from collections import defaultdict

fda_groups = defaultdict(list)
for d in data:
    fda_groups[d.get('a', '')].append(d)

most_matched = sorted(fda_groups.items(), key=lambda x: -len(x[1]))[:10]
for name, matches in most_matched:
    print(f'  {name}: {len(matches)} matches')
```

---

## 8. MHRA "Gravity Wells" — Most Frequently Matched-To Products

```python
mhra_targets = Counter(d.get('d', '') for d in data)
print(mhra_targets.most_common(10))
```

Note: the top result will be `"No match found"` (n=8,587) — this is the sentinel value for NONE confidence records.

---

## 9. Top MHRA Products in HIGH Confidence Matches

```python
high = [d for d in data if d.get('k') == 'HIGH']
high_mhra = Counter(d.get('d', '') for d in high)
print(high_mhra.most_common(8))
```

---

## Running the Build Script

To regenerate `fda-to-mhra-index.json` from the source CSV, run from `MedChecks Website/`:

```bash
python3 scripts/build_match_indexes.py
```

This also regenerates `mhra-to-fda-index.json` in the same pass. The script expects both source CSVs to be present in `../Identifying most similar drugs/outputs/`.

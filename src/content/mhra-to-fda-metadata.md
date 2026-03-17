# MHRA → FDA Comparisons — Dataset Metadata

> Each record pairs a UK MHRA-authorised drug with its closest equivalent in the US FDA Orange Book, scored on ingredient and strength similarity.

---

## Pipeline Overview

```
Identifying most similar drugs/outputs/mhra_to_fda_matches.csv
        │
        ▼
scripts/build_match_indexes.py
        │  compacts keys, strips whitespace, rounds scores to 4 dp
        ▼
frontier-2025/public/mhra-to-fda-index.json   ← loaded by the browser
```

---

## Volume

| Metric | Value |
|---|---|
| Total match records | 83,942 |
| Index file size | ~14 MB |

The lower record count compared to FDA → MHRA (192,051) reflects the smaller size of the MHRA source dataset (29,226 products vs 47,780 FDA products), and the fact that MHRA multi-ingredient products are grouped by Authorisation Number before matching — reducing ~29,226 rows to ~20,225 unique MHRA product records.

---

## Schema

| Short key | Full field | Type |
|---|---|---|
| `a` | source_product_name | string |
| `b` | source_inn | string |
| `c` | source_strength | string |
| `d` | matched_product_name | string |
| `e` | matched_inn | string |
| `f` | matched_strength | string |
| `g` | inn_score | float (0–1) |
| `h` | strength_score | float (0–1) |
| `t` | total_score | float (0–1) |
| `k` | confidence | HIGH / MEDIUM / LOW / NONE |

---

## Confidence Band Breakdown

| Band | Records | % of total |
|---|---|---|
| HIGH | 37,724 | 44.9% |
| MEDIUM | 36,765 | 43.8% |
| LOW | 5,692 | 6.8% |
| NONE | 3,761 | 4.5% |

The HIGH proportion (44.9%) is notably higher than the FDA → MHRA direction (34.4%). This is consistent with the matching logic: MHRA products are matched against a larger FDA pool, increasing the chance of finding an exact-ingredient, exact-strength counterpart.

NONE records represent MHRA products for which no FDA equivalent could be found — these are UK-only authorisations with no US equivalent in the Orange Book.

---

## Score Distributions

A perfect total score of 1.0 accounts for approximately **47% of MHRA → FDA pairs** — higher than the 36% seen in the reverse direction. The median INN score is again 1.0, meaning the majority of MHRA products share exactly the same active ingredient(s) as their best FDA match. As in the FDA → MHRA direction, strength matching is the main source of score variation.

---

## Insights

### 1. The Asymmetry Between Directions

The two match files are independent and deliberately not reconciled. If MHRA product A's top match is FDA product B, it does not follow that FDA product B's top match is MHRA product A. This asymmetry arises because each source product is matched independently against the full target pool.

The practical effect: the MHRA → FDA file is the appropriate starting point when asking "what is the UK equivalent of this US drug?", while the FDA → MHRA file answers "what is the US equivalent of this UK drug?"

### 2. NONE Records — UK-Only Authorisations

The 3,761 NONE-confidence records represent MHRA products with no FDA equivalent. These are genuine availability gaps — drugs available on NHS prescription or over the counter in the UK that have no approved counterpart in the US market. Categories that commonly appear here include:

- Herbal and traditional medicines authorised under the Traditional Herbal Registration scheme
- Combination products formulated specifically for the UK/EU market
- Biologics and biosimilars where the US equivalent carries a different INN or brand
- Products discontinued in the US but still active in the UK

### 3. Scoring Differences vs FDA → MHRA

| Metric | FDA → MHRA | MHRA → FDA |
|---|---|---|
| Total records | 192,051 | 83,942 |
| HIGH confidence | 34.4% | 44.9% |
| Perfect score (1.0) | ~36% | ~47% |
| NONE (no match) | 4.5% | 4.5% |

The NONE rate is identical in both directions (4.5%), but the distribution of successful matches skews higher in the MHRA → FDA direction. This reflects the depth of the FDA Orange Book as a matching target — it is a larger and more granular dataset, giving MHRA products more potential exact matches to find.

---

## Note on Deeper Analysis

Per-product breakdowns — top matched products, FDA "gravity wells", ingredient-level right-drug-wrong-dose analysis — have not yet been computed for the MHRA → FDA direction. The methodology for producing these figures mirrors the FDA → MHRA analysis exactly; see the Dataset Methodology tab for the relevant scripts.

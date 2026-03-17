# FDA → MHRA Comparisons — Dataset Metadata

> Each record pairs an FDA Orange Book drug with its closest equivalent in the UK MHRA register, scored on ingredient and strength similarity.

---

## Pipeline Overview

```
Identifying most similar drugs/outputs/fda_to_mhra_matches.csv
        │
        ▼
scripts/build_match_indexes.py
        │  compacts keys, strips whitespace, rounds scores to 4 dp
        ▼
frontier-2025/public/fda-to-mhra-index.json   ← loaded by the browser
```

---

## Volume

| Metric | Value |
|---|---|
| Total match records | 192,051 |
| Unique FDA source products | 7,532 |
| Unique MHRA products matched to | 6,723 |
| Index file size | 33.2 MB |

The record count (192k) is much larger than the number of unique FDA products (7.5k) because each FDA product can be matched to multiple MHRA candidates — one primary match is shown by default, with secondaries accessible via the expand button.

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

| Band | Records | % of total | Mean total score |
|---|---|---|---|
| HIGH | 65,997 | 34.4% | 1.000 |
| MEDIUM | 101,535 | 52.9% | 0.713 |
| LOW | 15,932 | 8.3% | 0.440 |
| NONE | 8,587 | 4.5% | 0.000 |

NONE records are where no MHRA equivalent could be identified. Their matched product name is stored as `"No match found"` and they are excluded from meaningful score analysis.

---

## Score Distributions (excluding NONE)

| Score | Mean | Median |
|---|---|---|
| Total score (`t`) | 0.793 | 0.841 |
| INN score (`g`) | 0.931 | 1.000 |
| Strength score (`h`) | 0.585 | 0.810 |

The median INN score is a perfect 1.0 — meaning the majority of matches share exactly the same active ingredient(s). Strength matching is the primary source of score variation.

---

## Insights

### 1. The "Right Drug, Wrong Dose" Problem

**54,014 records (28.1%)** have a perfect INN score (1.0) but a strength score of zero — the same active molecule is approved in both markets but at entirely different concentrations. This is one of the more clinically significant findings in the dataset: it reflects genuine prescribing differences between US and UK practice, not just naming conventions.

The top ingredients driving this pattern:

| Ingredient | Records with INN match, zero strength |
|---|---|
| Potassium | 1,344 |
| Heparin | 1,026 |
| Hydrocortisone | 1,007 |
| Lidocaine | 994 |
| Estradiol | 696 |
| Triamcinolone | 642 |
| Methylprednisolone | 594 |
| Clonidine | 522 |
| Paracetamol / Codeine | 492 |
| Hydroxyzine | 478 |

These are not obscure drugs — they include a blood thinner (heparin), a steroid (hydrocortisone), an anaesthetic (lidocaine), and a common pain combination (paracetamol/codeine). Their presence here suggests systematic dosing differences, not data noise.

---

### 2. 2,042 FDA Products Have No MHRA Equivalent

Of the 7,532 unique FDA source products, **2,042 (27%)** received a NONE confidence rating — no match found in the UK register. A sample:

- Ablavar, Accolate, Acetasol, Acetohexamide, Acth, Acthar, Acthar Gel, Actigall, Actinex, Acular...

Many of these are US-only brand names, reformulations, or drugs that were never submitted for MHRA authorisation. This list is a potential starting point for identifying genuine availability gaps between the two markets.

---

### 3. The Most Matched FDA Products

These FDA drugs generated the highest number of candidate MHRA matches, reflecting the depth of the UK generics market for these molecules:

| FDA Product | MHRA Matches |
|---|---|
| Pregabalin | 1,460 |
| Dextroamp Saccharate, Amp Aspartate, Dextroamp Sulfate And Amp Sulfate | 1,220 |
| Hydrocodone Bitartrate And Acetaminophen | 1,105 |
| Metformin Hydrochloride | 1,100 |
| Lamotrigine | 1,035 |
| Levetiracetam | 1,010 |
| Risperidone | 1,010 |
| Methylphenidate Hydrochloride | 995 |
| Ibuprofen | 975 |
| Amitriptyline Hydrochloride | 965 |

Pregabalin's 1,460 matches stand out. It is used for neuropathic pain, epilepsy, and anxiety, and has one of the largest generic markets in the UK following patent expiry — hence the volume of candidate MHRA products for it to match against.

The presence of the ADHD stimulant compound (dextroamphetamine/amphetamine salts) at #2 is notable: Adderall-type products are common in the US but are not directly available in the UK, where dexamfetamine (a single-enantiomer product) is the standard. The matching algorithm is picking up multiple candidate UK approximations for what is essentially a single US product family.

---

### 4. MHRA Products Acting as "Gravity Wells"

Some MHRA products absorb a disproportionate share of FDA matches, acting as a single best-fit proxy for many different US formulations:

| MHRA Product | Times matched |
|---|---|
| Carboplatin 10 Mg/Ml Concentrate For Solution For Infusion | 605 |
| Dexamfetamine Sulfate 5 Mg Tablets | 564 |
| 5% Glucose Intravenous Infusion Solution | 509 |
| Famotidine 20 Mg Film-Coated Tablets | 476 |
| Paracetamol 10 Mg/Ml Solution For Infusion | 440 |
| Heparin Mucous Injection Bp | 433 |
| Abdine Cold Relief Powder | 429 |
| Hydroxyzine Hydrochloride 10 Mg Film-Coated Tablets | 411 |
| Metoprolol Tartrate 100 Mg Film-Coated Tablets | 405 |

Carboplatin (a chemotherapy agent) and 5% Glucose appear here because they are broad-spectrum formulations that match many oncology and IV-fluid products regardless of brand or exact concentration. Dexamfetamine 5mg acting as a proxy for 564 US ADHD products reinforces the observation above — one UK product is standing in for an entire class of US stimulant formulations.

---

### 5. HIGH Confidence Matches: A Clean Subset

All 65,997 HIGH confidence records have a mean total score of exactly 1.0, meaning HIGH is not a fuzzy threshold — it is an exact flag for records where both INN and strength scored perfectly. The top MHRA products in this subset are:

| MHRA Product | HIGH matches |
|---|---|
| Doxycycline Capsules BP 100mg | 208 |
| Hydroxyzine Hydrochloride 25 Mg Film-Coated Tablets | 196 |
| Famotidine 20 Mg Film-Coated Tablets | 168 |
| Levetiracetam 750 Mg Film-Coated Tablets | 165 |
| Olanzapine 5 Mg Orodispersible Tablets | 152 |

The concentration of a widely-used antibiotic (doxycycline), antihistamine (hydroxyzine), antacid (famotidine), anti-epileptic (levetiracetam) and antipsychotic (olanzapine) here is consistent: these are established, off-patent generics with standardised doses across markets.

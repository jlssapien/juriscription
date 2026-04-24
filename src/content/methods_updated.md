This page describes how the comparison between the FDA Orange Book and the UK MHRA register was built. It covers the project approach (including earlier attempts that were tried before the current pipeline existed), the pipeline that was eventually constructed, the limitations of that pipeline, and historical artifacts from earlier work. The findings the pipeline produced are on the Results page.

# Project Approach

The project began in late 2024 as an attempt to compare drug approval databases across three regulators: the US FDA, the UK MHRA, and the European EMA. The initial assumption was that each regulator's data would be relatively usable and that a series of automated comparisons could surface drug-availability discrepancies of interest.

The first approach treated the problem as one of string matching. Drug records from each regulator were grouped by trade name and sorted into three categories: substances appearing in only one organisation's list, substances appearing in two, and substances appearing in all three. This approach quickly hit several obstacles. Drug strength was reported in different ways across the three regulators (one as a separate column, one bundled into the drug name, one omitted entirely). Drug names appeared in different fields across regulators (some as trade names, some as international nonproprietary names, with only one of the three regulators providing both). Status categories were inconsistent across regulators and not directly comparable. The EMA dataset mixed human and veterinary medicines while the others did not. And all three datasets contained large amounts of junk content that needed to be filtered out before any comparison could proceed: salts, water for injection, mundane substances like fruits and hamster hair used in allergy testing, and homeopathic entries.

A second approach attempted to extract and compare active ingredients from each record, assigning each ingredient one of three verdicts ("match", "no match", or "partial"). This ran into the same underlying problems as the first approach and made it clear that the data would have to be cleaned before any analysis could take place. Manual curation of the spreadsheets, given their size, was considered infeasible.

A third phase used AI tools to attempt to standardise the ingredient names: removing pharmacopoeia abbreviations, dilution markers, and descriptive terms; converting US spelling variants to international forms; normalising radioisotope notation; stripping common salt suffixes. The standardisation produced partial results but required several thousand entries to be manually verified before they could be relied on. The deeper problems with the source data also became more visible during this work. Drugs were listed in different countries with different combinations of salts. The active ingredient itself sometimes contained what looked like a salt suffix. Drug names were spelled inconsistently within a single agency's data. Regional spelling variants and arbitrary use of Latin and common names appeared throughout. Ingredient lists contained typographical inconsistencies and unclosed brackets.

By mid-2025 it had become clear that an automated comparison across all three regulators at the depth originally envisioned was not feasible with the available data and tools. The scope was narrowed. Focus shifted from a comprehensive three-way comparison toward a more bounded comparison between two regulators, the FDA and the MHRA, where both datasets included dosage strength and where the data could be cleaned and matched with a more controlled pipeline. The pipeline described in the next section is the result of that narrowed scope. The EMA Article 57 dataset is retained as a reference but is not used in the matching pipeline.

# Pipeline

This section is a trace of every transformation the data goes through, from the original source spreadsheet to the files that power the website. It covers source acquisition, PDF extraction, normalisation, two distinct matching systems, and the discrepancy analysis. This is presented in the order that makes it easiest to follow, rather than strict chronological order. All relevant files and scripts for replicating this work, including files detailing the reasoning of any LLMs used (which by the end was quite common), can be found in the git repository.

## The Pipeline at a Glance

```
FDA Orange Book MHRA FOI Request  EMA Article 57
(Products.txt)  (FOI2025_00058)   (ema.europa.eu)
       │                │               │
       └────────────────┼───────────────┘
                        │
                        ▼
                 Pillgram.xlsx
          (master source workbook, 3 datasets)
                        │
                        ▼
                      v1 CSVs
           (normalised_fda_orangebook.csv
            normalised_uk_mhra.csv)
                        │
               normalise_pharma.py
                        │
                        ▼
                      v2 CSVs
           (normalised_fda_orangebook_v2.csv
            normalised_uk_mhra_v2.csv)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
  Swiss Cheese       Binary         Similarity
    Pipeline        Comparison        Scoring
 (match_pipeline) (compare +      (match_drugs.py)
                  match_drugs v2)
        │               │               │
        ▼               ▼               ▼
 drug_match_      drugs_in_both    fda_to_mhra_
 results.csv      drugs_fda_only   matches.csv
 (1,323 matches)  drugs_mhra_only  mhra_to_fda_
        │                          matches.csv
        ▼
 Legal Discrepancy Analysis
 (full_discrepancy_report.py)
        │
        ▼
 full_discrepancy_master.csv  (3,858 rows)
 regulatory_discrepancy_clean.csv  (101 rows)
```

## Stage 1: Source Data Acquisition

The first task was to get the data into a usable form. Three regulatory datasets were collected from public sources, and one of them (the UK MHRA register) had to be extracted from a 680-page PDF before it could be used at all.

### Pillgram.xlsx

The project began in 2024, and the data we had became somewhat dated. We therefore went about downloading the latest available versions of the relevant regulatory datasets. `Pillgram.xlsx` is the master source workbook. It bundles three regulatory datasets along with a `META` sheet recording provenance for each.

| Sheet | Rows | Source |
|-------|------|--------|
| META | 18 | Provenance records |
| Art57 product data | 162,651 | EMA, all EU/EEA authorised medicines |
| FDA Orange Book products | 47,780 | US FDA Orange Book `Products.txt` |
| FOI2025_00058 All MAs | 29,226 | UK MHRA via FOI request |

The central analysis is UK vs US: **MHRA vs FDA**. The Art57/EMA data is present as a reference but is not used in the matching pipeline. The available data made it easier to compare UK and US availability as both datasets include dosage strength, something lacking in the EMA Article 57 dataset.

Full provenance detail for each dataset:

| Agency | Precursor Sheets | Normalised Sheet | Normalised Origin | Source | Archive | Downloaded | Notes | What is this data? |
|--------|-----------------|-----------------|-------------------|--------|---------|------------|-------|-------------------|
| FDA | FDA Orange Book products | normalised_fda_orangebook | Normalised sheet produced using precursor sheets. See folder `/Claude Code MedCheck Normalise/` | https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files | https://web.archive.org/web/20260219142014/https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files | 14/01/2026 | Products.txt loaded with `~` used as separator | All drugs approved by the FDA, including those which have been discontinued. |
| EEA Article 57 | Art57 product data | normalised_ema_art57 | | https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/data-medicines-iso-idmp-standards-post-authorisation/public-data-article-57-database | https://web.archive.org/web/20251222025933/https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/data-medicines-iso-idmp-standards-post-authorisation/public-data-article-57-database | 10/02/2026 | | A complete inventory of all medicines authorised for use in the EU and EEA, including medicines authorised centrally via the EMA and those authorised at national level. |
| MHRA | FOI2025_00058 All MAs | normalised_uk_mhra | | https://mhra.disclosurelog.co.uk/disclosures/6a272c1e-e98c-4243-86fa-2505671aca58?preserveHistory | N/A | 31/12/2025 | The file in the FOI request is a PDF. Convert script and files are in `/Claude MHRA PDF to CSV/` folder. | Drugs granted a licence to market within the UK. |

### The FDA Dataset

Source: FDA Orange Book data files at fda.gov. The raw download is a flat file (`Products.txt`) with `~` as the field separator. Loaded directly into Excel.

**Columns:** `Ingredient`, `DF;Route` (dosage form + route), `Trade_Name`, `Applicant`, `Strength`, `Appl_Type`, `Appl_No`, `Product_No`, `TE_Code`, `Approval_Date`, `RLD`, `RS`, `Type`, `Applicant_Full_Name`

The `Type` column contains `RX`, `OTC`, or `DISCN` (discontinued). Discontinued entries are a significant proportion of the dataset, approximately 45% of rows.

### The MHRA Dataset: Extracting Data from a PDF

The MHRA data was not available as a download. Our original FOI for this data was granted in 2024. However, a more recent FOI for the same data was granted (or at the very least made public) on the 31st of December 2025, and we opted to use the updated dataset. MHRA supplied it as a 680-page landscape PDF, itself generated by "Print to PDF" from an original Excel spreadsheet. Claude Code was instrumental in solving the extraction problem this created.

Since the PDF was generated from a printed page, the rendered x-coordinates of characters from adjacent columns physically overlap. Standard PDF table extraction tools (`pdfplumber`, `tabula-py`) produce garbled output because they assign characters to columns by x-position, causing characters from different columns to interleave.

In the PDF's internal byte stream, each cell's characters are written as a contiguous block, even if their rendered positions overlap neighbours on screen. Two signals reliably detect column boundaries without relying on x-position:
- A **backward x-jump of more than 0.5px** in stream order always marks a column boundary (zero false positives across all 680 pages)
- A **forward x-gap of more than 8px** also marks a boundary

The extraction script `extract_pdf.py` processes characters in stream order, using these signals to split them into eight columns:

| Column | Field | X range |
|--------|-------|---------|
| 0 | Authorisation Number | 0–115 |
| 1 | Licensed Product Name | 115–290 |
| 2 | Company Name | 290–460 |
| 3 | Drug Substance | 460–522 |
| 4 | Formulation Strength | 522–580 |
| 5 | Strength Unit | 580–640 |
| 6 | Product Birth Date (Claude's choice of nomenclature) | 640–700 |
| 7 | Legal Status Type | 700–850 |

After the initial extraction, a further six post-processing passes handle "zero-gap merges", which are cases where adjacent columns have no x-gap and could not be split positionally. These passes use context clues: lookups of known company names and drug names from clean rows, company-suffix regex patterns (LIMITED, PLC, LTD, GMBH etc.), and dosage-form words (TABLETS, CAPSULES, CREAM, INJECTION etc.).

Even after automated processing, 43 rows still had empty fields and were corrected manually:
- 30 rows had an empty Drug Substance field (mostly KRKA products whose drug name was fused with the company name)
- 4 rows had an empty Product Name (carried only on the first of multiple ingredient rows in the PDF)
- 1 empty Company Name, 1 empty Strength, 1 empty Birth Date, 6 empty Legal Status rows

**Final result: 29,226 rows, 8 columns, zero empty fields, zero bad authorisation numbers, zero bad dates.** Several hundred more rows than our original 2024 FOI provided.

The extraction was successfully replicated by a second Claude instance to verify reproducibility. The output CSV was then loaded into Pillgram.xlsx as the `FOI2025_00058 All MAs` sheet.

The MHRA format stores one row per active substance per product. A combination product therefore produces multiple rows sharing the same `Authorisation Number`. This structural difference from the FDA format (one row per product) is a recurring challenge throughout the pipeline. Note also that the MHRA data does not include route of administration, though it can sometimes be discerned from the product name.

## Stage 2: Preparing the v1 CSVs

Once the raw data was in hand, it had to be reshaped into a consistent column structure across the two regulators so that later steps could compare like with like. Stage 2 produced two CSV files (one for each regulator) with shared columns, holding the same row counts as the original sources but in a workable format.

The two raw sheets from Pillgram.xlsx are exported and lightly reformatted into a consistent structure. The v1 CSVs (`normalised_fda_orangebook.csv` and `normalised_uk_mhra.csv`) sit in the `Comparisons/` folder and serve as the input to both the normalisation script and the Swiss Cheese matching pipeline.

**V1 shared columns:**

| Column | Description |
|--------|-------------|
| `source_dataset` | "FDA" or "UK_MHRA" |
| `product_name` | Trade/brand name |
| `active_substances` | Original ingredient name from the source |
| `match_key` | Lowercase, whitespace-normalised version of `active_substances` |
| `route_of_administration` | Delivery method |
| `marketing_authorisation_holder` | Company name |
| `strength` | Raw strength string (e.g. `250MG`, `250 Milligrams`) |
| `authorisation_country` | "US" or "UK" |
| `approval_date` | Date of marketing authorisation |
| `legal_status` | UK: POM/P/GSL; US: RX/OTC/DISCN |

FDA additionally retains: `dosage_form`, `Appl_Type`, `Appl_No`, `Product_No`, `TE_Code`, `RLD`, `RS`

MHRA additionally retains: `Authorisation Number`

Row counts are identical to Pillgram.xlsx: **47,780 FDA rows, 29,226 MHRA rows.**

RxNorm (NIH/NLM drug nomenclature) was used to cross-check substance names during this phase: 96.1% of MHRA substances and 95.4% of FDA substances resolved to an RxCUI, confirming that the core ingredient names were already widely recognised. The slightly higher matching rate for MHRA products is perhaps slightly surprising given that RxNorm is maintained by the US National Library of Medicine.

## Stage 3: The Normalisation Pipeline (`normalise_pharma.py`)

Even with consistent column structure, the actual values in those columns were a mess. Drug strengths were written in dozens of different ways across the two regulators, and the names of active ingredients differed in salt forms, brand names, US/UK spelling, and old vs current naming conventions. Stage 3 ran two normalisation passes (one for strengths, one for ingredient names) to bring these values into comparable form.

`normalise_pharma.py` reads both v1 CSVs and adds four new columns to each, producing the v2 CSVs. It is a **pure column-addition pass**: no rows are filtered, added, or reordered. Row counts remain 47,780 and 29,226.

The script has two main subsystems: **strength normalisation** and **INN normalisation**.

```
v1 CSVs  →  normalise_pharma.py  →  v2 CSVs
                                     (+ strength_normalised)
                                     (+ strength_notes)
                                     (+ active_substances_inn)
                                     (+ inn_status)
```

### 3a. Strength Normalisation

The raw `strength` column contains highly heterogeneous strings: `2MG/ACTUATION` (FDA compact notation), `250 Milligrams` (MHRA verbose), `EQ 4% BASE` (FDA salt-equivalent expression), `5e-05` (scientific notation), and many others.

**FDA strength pipeline (`parse_fda_strength`):**

1. Strip `**Federal Register...` trailing annotations
2. Resolve `EQ X UNIT BASE` patterns. These express the dose in terms of the active base rather than the salt form (e.g. `EQ 4% BASE` → `4 % (base eq)`)
3. Strip dosage-form modifier words (EXTENDED, DELAYED, CONTROLLED, SUSTAINED, MODIFIED, IMMEDIATE, ENTERIC, RELEASE, EFFERVESCENT, CHEWABLE, DISPERSIBLE and everything after them)
4. Convert scientific notation to decimal (`5e-05` → `0.00005`)
5. Insert space between concatenated digit+letter sequences (`250MG` → `250 MG`)
6. Parse with `_NUM_UNIT_RE`, map unit via `FDA_UNIT_MAP` (~40 entries: `MG/ACTUATION` → `mg/actuation`, etc.)
7. Fallback: bare numbers assumed to be percentages

**MHRA strength pipeline (`parse_mhra_strength`):**

1. Detect null/zero markers (`0 No Data Held`, `None`) → return empty
2. Parse `VALUE UNIT_PHRASE` format
3. Match unit phrase against `MHRA_UNIT_MAP` (~90 entries: `Milligrams Per 5 Millilitres` → `mg/5mL`, `Percentage Weight In Weight` → `% w/w`, etc.). Applied longest-key-first to prevent substring collisions
4. Return abbreviated form, or flag as `unknown_unit` if the phrase is not in the map

Multi-ingredient products have strengths on multiple components separated by `;`. Both parsers handle this by splitting on `;` and processing each component independently, then rejoining with ` ; `.

**Strength normalisation statistics:**

| Outcome | FDA | MHRA |
|---------|-----|------|
| Parsed successfully | 30,018 | 29,013 |
| Missing/null | 65 | 191 |
| Unknown unit (needs review) | 1,289 | 19 |

The 1,289 FDA unknowns are complex salt-equivalent expressions like `EQ 135 MG FENOFIBRIC ACID` that didn't match any pattern. These are carried forward with a neutral strength score of 0.5 in the similarity pipeline rather than being dropped.

### 3b. INN Normalisation

The `active_substances` column contains names that are inconsistent across the two datasets: salt forms (`fluticasone propionate`), US trade names (`albuterol`), old UK spellings (`lignocaine`). The goal is to map everything to the WHO International Nonproprietary Name (INN), the single globally agreed name for each active substance.

We had tried various methods to identify variations in approvals before landing on this approach. The active substances do not use identical naming conventions. The FDA sheet uses INN and common names whilst the MHRA sheets used a mix of INN, IBAN, chemical names and trade names. The more we tried different approaches, the more we began to appreciate (a) how difficult this project was and (b) how ill-equipped we were to handle it. The approach that produced the best results was to standardise all active substance names using INN names and normalise the measurements, giving us two columns with which to compare.

The pipeline runs three tiers, each attempted in order:

**Tier 1: salt stripping (`strip_salts`)**

Iteratively removes salt/ester/hydration qualifiers from the end of the name until no more can be stripped. The `SALT_QUALIFIERS` list covers ~65 terms across five categories:

- *Hydration states:* monohydrate, dihydrate, trihydrate, hemihydrate, anhydrous, hydrate
- *Salt counterions:* hydrochloride, sulfate, phosphate, acetate, maleate, tartrate, fumarate, citrate, bromide, mesylate, besylate, sodium, potassium, calcium, magnesium, zinc, and ~30 more
- *Ester/prodrug forms:* propionate, valerate, furoate, palmitate, decanoate, enanthate, acetonide, dipropionate, and ~15 more
- *Prodrug linkers:* medoxomil, cilexetil, proxetil, pivoxil, xinafoate, embonate
- *Physical form modifiers:* micronised, micronized, compacted

Multi-qualifier names are handled correctly by iteration: `prednisolone sodium phosphate` → `prednisolone sodium` → `prednisolone`.

A safety guard prevents over-stripping: the stripped result is only accepted if at least 3 characters remain. Biologic suffixes (`alfa`, `beta`) are deliberately not in the list, so `interferon alfa` is left intact.

**Tier 2: USAN→INN mapping (`apply_usan_inn`)**

Applied after salt stripping. Covers ~50 cases where the US uses a different name for the same substance:

| USAN (US) | INN (international) |
|-----------|---------------------|
| acetaminophen | paracetamol |
| albuterol | salbutamol |
| levalbuterol | levosalbutamol |
| epinephrine | adrenaline |
| norepinephrine | noradrenaline |
| acyclovir | aciclovir |
| valacyclovir | valaciclovir |
| lignocaine | lidocaine |
| thyroxine | levothyroxine |
| triiodothyronine | liothyronine |
| indomethacin | indometacin |
| chlorpheniramine | chlorphenamine |
| frusemide | furosemide |
| cholecalciferol | colecalciferol |
| cephalexin | cefalexin |
| … and ~35 more | |

**Tier 3: ChEMBL API (optional, `--chembl` flag)**

For names that didn't change in tiers 1 or 2, queries the ChEMBL REST API for a canonical preferred name. Slow (~30 minutes), caches results in `.chembl_cache.json`. This step was somewhat painful to implement and was ultimately not used in the production run. The v2 files were generated in offline mode only.

**INN normalisation statistics:**

| Status | FDA rows | MHRA rows |
|--------|----------|-----------|
| salt_stripped | 21,926 (45.9%) | 12,384 (42.4%) |
| usan_to_inn | 1,049 (2.2%) | 68 (0.2%) |
| normalised (no change) | 19,264 (40.3%) | 16,774 (57.4%) |
| missing | 0 | 0 |

The USAN→INN corrections are much larger on the FDA side (1,049 vs 68 rows), as expected. The FDA dataset uses American naming natively.

For **FDA combination products**, ingredients are pipe-delimited in a single cell (`Budesonide | Formoterol Fumarate`). Each ingredient is normalised independently and the results rejoined with ` | `.

For **MHRA combination products**, each ingredient is already on its own row. Each row is normalised independently.

## Stage 4: The Swiss Cheese Matching Pipeline

With the values normalised, the actual matching could begin. Stage 4 asked, for every active substance in the UK dataset, whether the US dataset contained any equivalent. The matching ran in six layers, with each layer attempting to match anything the previous layer had missed. The name "Swiss Cheese" refers to this layered approach, where each layer catches what the previous layer's holes let through.

`match_pipeline.py` works at the **active substance level**. It asks a simple question: does a given MHRA substance have any equivalent in the FDA dataset? It runs six layers in cascade order, each catching what the previous layers missed. Hence "Swiss Cheese".

**Inputs:** the v1 CSVs (`normalised_fda_orangebook.csv`, `normalised_uk_mhra.csv`)

**Important pre-step:** all FDA rows where `legal_status == 'DISCN'` (discontinued) are dropped before any matching begins. This removes roughly 45% of the raw FDA Orange Book and leaves only currently active products.

| Layer | Strategy | Yield |
|-------|----------|-------|
| 1: Exact | Direct equality on `match_key` | 917 (30.9%) |
| 2: Spelling | Convert UK spellings to US equivalents, then re-try exact | 40 (+1.3%) |
| 3: Salt stripping | Strip qualifiers from both sides, re-try exact | 314 (+10.6%) |
| 4: Multi-ingredient | Reconstruct MHRA combo products from multi-row format, re-try | 22 (+0.7%) |
| 5: ATC enrichment | Not a matching layer; queries RxNav API for ATC codes for unmatched substances | n/a |
| 6: Fuzzy | token_sort_ratio ≥ 92 on stripped/spelling-normalised names | 30 (+1.0%) |

**Total: 1,323 matched (44.6%), 1,641 unmatched (55.4%)**

Layer 4 is worth explaining in detail because it deals with the structural difference between MHRA and FDA. For combination products, MHRA has one row per ingredient. For example, a product with two active ingredients produces two rows sharing the same `product_name`. The layer groups MHRA rows by `product_name`, collects all the `match_key` values from each group, applies salt stripping and spelling correction to each, sorts alphabetically, and joins with `+`. It then tries to match this reconstructed composite key against FDA multi-ingredient keys (which already use `+`-separated format).

Layer 5 (ATC enrichment) is informational, not matching. For each unmatched MHRA substance, it queries the NLM RxNav API for an Anatomical Therapeutic Chemical (ATC) code. This adds `atc_code` and `atc_class` columns so unmatched substances can be analysed by therapeutic category even without a direct drug-to-drug match. 557 of the 1,641 unmatched substances received ATC codes.

Layer 6 fuzzy matches are flagged as `match_layer = 'fuzzy'` in the output for mandatory manual review. They are lower-confidence than all earlier layers.

**Output: `drug_match_results.csv`.** One row per unique MHRA substance with columns: `active_substances`, `match_key`, `matched_fda_key`, `match_layer`, `atc_code`, `atc_class`.

## Stage 5: Binary Comparison

Running parallel to (and partly building on) the Swiss Cheese pipeline is a binary comparison that produces three flat lists of substances based on a binary comparison of normalised ingredient names: substances approved in both countries, substances approved in the US only, and substances approved in the UK only. This was run twice with slightly different parameters, producing:

- An earlier version in `MedCheck Normalise And Matching/drug_comparison/output/` (1,313 matched, run 2026-02-23)
- A later version using the v2 INN column in `Identifying most similar drugs/` (1,081 matched)

The later version uses `active_substances_inn` from the v2 CSVs as the matching column instead of `match_key`. This strips salt forms before comparison, recovering roughly 100 additional substance matches (985 → 1,081) compared to using `match_key`.

**Output files (in `Identifying most similar drugs/`):**

| File | Rows | Meaning |
|------|------|---------|
| `drugs_in_both.csv` | 1,081 | Substances approved in both US and UK |
| `drugs_fda_only.csv` | 1,414 | Substances approved in US but not UK |
| `drugs_mhra_only.csv` | 1,496 | Substances approved in UK but not US |

Each file includes up to 3 sample product names and the route of administration.

## Stage 6: Similarity Scoring (`match_drugs.py`)

While Stages 4 and 5 worked at the level of active substances, Stage 6 worked at the level of individual products. For every product in one country, it identified the closest counterpart in the other country and scored how similar the two were on ingredients and on dose.

Where the Swiss Cheese pipeline works at the substance level (is there any equivalent at all?), `match_drugs.py` works at the **individual product level** and quantifies *how similar* specific formulations are. It scores every FDA–MHRA product pair that shares at least one active ingredient and returns the top 5 matches per product.

**Inputs:** the v2 CSVs (`normalised_fda_orangebook_v2.csv`, `normalised_uk_mhra_v2.csv`)

### Loading and Grouping

**FDA:** each row is already one product. The script parses the `active_substances_inn` column (pipe-delimited) and `strength_normalised` column (semicolon-delimited for multi-ingredient products) into structured lists per product. Result: ~47,780 product records.

**MHRA:** rows are grouped by `Authorisation Number`. For each group (all rows sharing the same authorisation number), the script collects all unique (INN, strength) pairs, sorts the INNs alphabetically, and constructs one product record. Result: ~20,225 unique product records.

### Candidate Blocking

Naively scoring all pairs would mean 47,780 × 20,225 = ~966 million comparisons. Instead, an **inverted index** is built:

```
INN → [list of product indices containing that INN]
```

Only product pairs that share at least one INN are ever scored. This reduces the comparison space to a tractable size.

### Scoring Formula

```
total_score = 0.60 × inn_score + 0.40 × strength_score
```

#### INN Score

**Jaccard similarity** on the normalised INN sets:

```
inn_score = |A ∩ B| / |A ∪ B|
```

| Example | Score |
|---------|-------|
| `{budesonide}` vs `{budesonide}` | 1.0 |
| `{fluticasone, salmeterol}` vs `{fluticasone, salmeterol}` | 1.0 |
| `{fluticasone, salmeterol}` vs `{fluticasone}` | 0.5 |
| `{budesonide}` vs `{fluticasone}` | 0.0 |

Jaccard naturally handles partial overlap in combination products without special-casing. A drug where one of two ingredients matches automatically scores 0.5.

If Jaccard = 0 but the INN strings look similar (e.g. transliteration differences), a fuzzy fallback applies `token_sort_ratio` (threshold 85) to catch near-misses.

#### Strength Score

Only computed when `inn_score > 0`.

1. **Parse** each strength string into `(numeric value, canonical unit)` using regex. A `(base eq)` suffix is stripped before parsing. The unusual FDA format `"0 .0005"` (space before decimal) is handled explicitly.
2. **Canonicalise units**, mapping variants to a standard form: `mg`, `g`, `mcg`, `%`, `mg/ml`, `mg/inh`, `mcg/inh`, `iu`, etc.
3. **Convert to a common base** where possible: g→mg (×1000), mcg→mg (÷1000), mg/inh↔mcg/inh (×1000).
4. **Log-ratio score** per matched INN pair:

```
component_score = max(0, 1 − |log10(val_A / val_B)| / 0.3)
```

The constant `0.3` (`MAX_LOG_DIFF`) controls sensitivity. Using the log ratio rather than absolute difference means proportional closeness is what matters. A 10mg vs 20mg difference is treated equivalently to 500mg vs 1000mg.

| Dose difference | Score |
|-----------------|-------|
| Identical | 1.0 |
| ~10% apart | ≈ 0.86 |
| ~25% apart | ≈ 0.68 |
| More than ~2× apart | 0.0 |

`MAX_LOG_DIFF` was revised from an original value of 2.0. The old value was far too permissive. A 10× dose difference still scored 0.5. The test case used to validate the change was Zovirax IV 250mg vs a 200mg formulation: correctly drops from HIGH to MEDIUM after the revision.

5. **Aggregate**: average component scores across all matched INNs.

**Neutral fallback:** if no strength could be parsed at all (1,289 FDA rows, ~182 MHRA rows), `strength_score = 0.5` so that the INN score dominates rather than unfairly penalising the product.

### Confidence Tiers

Each scored match is assigned to one of four tiers:

| Tier | Criteria |
|------|----------|
| **HIGH** | `inn_score == 1.0` AND `strength_score == 1.0`, that is, exact same ingredients and numerically identical dose |
| **MEDIUM** | `(inn_score == 1.0 AND total_score ≥ 0.60)` OR `(inn_score ≥ 0.50 AND total_score ≥ 0.70)` |
| **LOW** | Any match found not meeting MEDIUM criteria |
| **NONE** | No match found at all |

Route of administration is excluded from the tier logic. The MHRA `route_of_administration` column is entirely absent in the v2 CSV. Route is retained as a flag (`route_match`) in the output but cannot be used for scoring.

HIGH requires `strength_score == 1.0` exactly. Any dose difference, however small, drops to MEDIUM. This ensures HIGH is reserved for genuine like-for-like matches.

### Output Files (`Identifying most similar drugs/outputs/`)

| File | Rows | Description |
|------|------|-------------|
| `fda_to_mhra_matches.csv` | 192,051 | Each FDA product + its top 5 MHRA matches |
| `mhra_to_fda_matches.csv` | 83,942 | Each MHRA product + its top 5 FDA matches |

**Columns in both:** `source_product_name`, `source_inn`, `source_strength`, `matched_product_name`, `matched_inn`, `matched_strength`, `inn_score`, `strength_score`, `total_score`, `route_match`, `confidence`

**Confidence distribution:**

| Tier | FDA→MHRA | MHRA→FDA |
|------|----------|----------|
| HIGH | 65,997 | 37,724 |
| MEDIUM | 101,535 | 36,765 |
| LOW | 15,932 | 5,692 |
| NONE | 8,587 | 3,761 |

A perfect score of 1.0 (36% of FDA→MHRA pairs, 47% of MHRA→FDA) means identical active ingredient set and numerically equal strengths after unit conversion.

The two output files are independent. There is no guarantee of symmetry. If FDA product A's top match is MHRA product B, it does not follow that MHRA product B's top match is FDA product A. A reconciled bidirectional file was identified as a useful missing artefact but was not produced.

## Stage 7: Legal Discrepancy Analysis

With the substance-level match table from Stage 4 in hand, the pipeline could finally answer the original question: for substances available in both countries, do the two countries treat them the same way legally? Stage 7 took the matched substance pairs, looked up the legal status on each side, and flagged the cases where one country required a prescription while the other did not.

This analysis was done in two phases: an earlier narrower version and a later comprehensive one.

### Phase A: Narrow Analysis (`Use Normalised Data To Find Legal Discrepancies/`)

Covers only the ~1,106 matched substance pairs (44.6% of UK substances). Uses legal status columns from the v1 CSVs.

**Legal status frameworks:**
- UK (MHRA): POM (prescription-only), P (pharmacy-only), GSL (general sale)
- US (FDA): RX (prescription-only), OTC (over the counter)

A `classify_discrepancy()` function assigns one of 9 discrepancy types based on all statuses seen for a substance. Four types are flagged as "of interest":

| Discrepancy type | Meaning |
|-----------------|---------|
| `uk_otc_us_rx` | Available OTC in UK, prescription-only in US |
| `uk_rx_us_otc` | Prescription-only in UK, available OTC in US |
| `mixed_uk_only` | OTC in UK under some conditions, RX only in US |
| `uk_rx_us_mixed` | RX in UK, OTC-permitted in US |

The analysis also performs a **strength-level comparison**: after normalising both UK and US strength strings to comparable numeric values, it checks whether a specific strength that is OTC in one country overlaps with a strength that is RX in the other.

**Outputs:**
- `regulatory_discrepancy_analysis.csv`: 1,106 rows (all matched pairs with their classification)
- `regulatory_discrepancy_clean.csv`: **101 rows**, the clean, publication-ready subset containing only the flagged discrepancies of interest, with human-readable column names
- `regulatory_discrepancy_report.xlsx`: Excel export
- `regulatory_discrepancy_summary.txt`: plain-text summary

### Phase B: Full Analysis (`Comparison LEVEL of legality/full_discrepancy_report.py`)

Extends Phase A to cover the complete universe of substances across both datasets, not just matched pairs. Produces one row per unique active substance.

**Inputs:**
- `normalised_uk_mhra.csv` (v1): 29,226 rows, 2,964 unique UK substances
- `normalised_fda_orangebook.csv` (v1): 47,780 rows, 1,878 unique FDA substances
- `drug_match_results.csv`: 1,323 matched pairs from Stage 4

**The three groups:**
- **Group A (Both countries):** 1,323 matched substance pairs, with full regulatory discrepancy classification applied
- **Group B (UK-only):** 1,641 substances with no FDA equivalent
- **Group C (FDA-only):** 894 substances with no UK equivalent

For unmatched substances (Groups B and C), the script classifies each into a substance category (`standard_drug`, `biologic_vaccine`, `herbal_botanical`, or `radiopharmaceutical`) using keyword matching on the substance name.

**Key findings:**
- 101 matched pairs with a regulatory discrepancy of interest
- 23 matched pairs with a strength-level discrepancy
- 1,641 UK-only substances; 894 FDA-only substances

**Output: `full_discrepancy_master.csv`** (3,858 rows, 25 columns):

`active_substance`, `uk_match_key`, `fda_match_key`, `presence`, `match_layer`, `uk_legal_status`, `fda_legal_status`, `regulatory_discrepancy`, `discrepancy_type`, `discrepancy_of_interest`, `uk_otc_strengths`, `uk_rx_strengths`, `fda_otc_strengths`, `fda_rx_strengths`, `strength_discrepancy`, `uk_routes`, `fda_routes`, `route_note`, `atc_code`, `atc_class`, `substance_category`, `uk_sample_products`, `fda_sample_products`, `fuzzy_match`, `notes`

Also produces `full_discrepancy_report.xlsx`, a colour-coded 6-sheet workbook: Summary, Both Countries, Regulatory Discrepancies, Strength Discrepancies, UK Only, FDA Only.

## Final Outputs Summary

The files that feed the website, along with where they come from:

| File | Location | Rows | Produced by |
|------|----------|------|-------------|
| `drugs_in_both.csv` | `Identifying most similar drugs/` | 1,081 | Binary comparison on v2 INN column |
| `drugs_fda_only.csv` | `Identifying most similar drugs/` | 1,414 | Binary comparison on v2 INN column |
| `drugs_mhra_only.csv` | `Identifying most similar drugs/` | 1,496 | Binary comparison on v2 INN column |
| `fda_to_mhra_matches.csv` | `Identifying most similar drugs/outputs/` | 192,051 | match_drugs.py on v2 CSVs |
| `mhra_to_fda_matches.csv` | `Identifying most similar drugs/outputs/` | 83,942 | match_drugs.py on v2 CSVs |
| `regulatory_discrepancy_clean.csv` | `Use Normalised Data To Find Legal Discrepancies/` | 101 | Phase A legal analysis |
| `full_discrepancy_master.csv` | `Comparison LEVEL of legality/` | 3,858 | Phase B legal analysis |

## Data Update Note

On 21 February 2026, the three main Phase 1 sheets (`drugs_in_both`, `drugs_fda_only`, `drugs_mhra_only`) were regenerated with renormalised source data, and the discrepancy counting and legal-level analysis were redone from scratch. All work is within these files and fully replicable.

# Limitations

The pipeline described above leaves the project well short of the original goal. The conceptual reasons for that are described first, followed by the specific operational gaps in the dataset and the pipeline.

## Why this is hard

*Biomedicine is complex.*

Pharmaceutical chemistry knowledge is likely required to distinguish meaningful ingredient differences from formatting variations. Someone without an understanding of the chemistry may not be able to identify which distinctions matter from poorly-formatted spreadsheets, and would need to double and triple check current AI distinctions. Salts, formulations, inactive ingredients, extraction methods, and concentration levels all affect whether two entries refer to "the same drug" in a meaningful sense.

For example, in the UK and EU, Tabrecta lists the ingredient "CAPMATINIB DIHYDROCHLORIDE MONOHYDRATE", but in the US it is listed as "CAPMATINIB HYDROCHLORIDE". Liechtenstein, Norway, Greece, and Italy list the same drug with the ingredient simply as "CAPMATINIB". Filtering out these salt forms is potentially feasible, but it requires knowledge of all possible salts and their notations. Simply filtering out common salt suffixes does not reliably work, because salt suffixes can also be part of the active ingredient itself. Consider NORGALAX in the UK, which has the active ingredient "DOCUSATE SODIUM": here the sodium is essential to the compound, not a counterion that can be stripped. Some salts may have a secondary medical effect while others may not. Some medical bodies may treat some salts as medically significant while others may not. An AI workflow that tries to check all of these distinctions on a case-by-case basis would also likely fail, or be cost-prohibitive, without further methodological work.

*Medical regulation is complex.*

Regulatory status categories vary between jurisdictions in ways that do not map cleanly onto each other. Labels such as "approved", "licensed", "marketable", and "prescribed" are distinct concepts and not readily caught by AI tools.

*The data were not designed for cross-jurisdictional comparison.*

Each regulatory body designed its database for its own purposes (tracking authorisations, monitoring safety signals, managing submissions). Cross-jurisdictional comparison was not a design goal. The structural differences reflect different internal needs. For example: the FDA lists ingredients semicolon-separated in single cells while the EMA uses commas and the MHRA splits ingredients across multiple rows. The FDA has drug strength in a separate column where the MHRA embeds it in the drug name and the EMA omits it entirely. Only the EMA distinguishes veterinary from human drugs.

*The data contain errors.*

Beyond structural differences, the data contain typos, inconsistent formatting within the same database, and missing entries. For example, Auranofin is prescribed by the NHS but does not appear in the MHRA data, suggesting that database may be incomplete. We found the same drug spelled differently within a single agency's data, unclosed brackets, and arbitrary mixing of Latin and common names.

## Pipeline-specific limitations

- **Route of administration** is absent from `normalised_uk_mhra_v2.csv`. A tablet and an injection of the same substance and dose will score 1.0 in the similarity pipeline.
- **Percentage concentrations**: `% w/w` and `% w/v` are physically distinct (weight-in-weight vs weight-in-volume) but are both collapsed to `%` and treated as equivalent.
- **Dosage form** (tablet vs. capsule vs. patch vs. liquid) is not part of the comparison.
- **Bidirectionality**: the two similarity match files are independent. A drug's top match is not guaranteed to be reciprocal.
- **Multi-ingredient strength ordering (FDA)**: the script assumes the semicolon-delimited strengths in the FDA data are in the same order as the pipe-delimited INNs. If source data is inconsistent on this, per-ingredient strength alignment may be wrong.
- **Neutral fallback for unparseable strengths**: products with strength strings that could not be parsed receive a neutral score of 0.5, which quietly biases them to score slightly higher than products with parseable but mismatched strengths.
- **Swiss Cheese coverage**: only 44.6% of MHRA substances found a match in the FDA dataset. The 55.4% unmatched are categorised by substance type (novel drugs, vaccines, herbals, etc.) but have no drug-to-drug comparison.

## This dataset is not comprehensive

There is currently no method for automatic maintenance. Though this could be achieved for the FDA and EEA Article 57 datasets, securing current MHRA data requires submitting repeated FOI requests. Drugs approved after February in the EEA and US will not appear in our dataset, nor will drugs approved in the UK after June.

## Absence from the dataset is not proof of unavailability

A drug not appearing in our data does not mean it is unavailable in the relevant country. For example: a search for Melatonin will indicate it is approved in a variety of EEA countries and in the UK (where it is prescription-only). It does not appear on the FDA sheet. However, Melatonin is available in the US and can be purchased OTC. This is just one example where a widely available substance is simply absent from our dataset.

## Article 57 limitations

The EMA Article 57 dataset does not include legal status, that is, whether a drug is approved for OTC or prescription sale. Including such data would require repeating the work for all member states in the Article 57 database, which is beyond the scope of this project. It is therefore not possible to discern whether a drug in the UK or USA shares an equivalent legal status in EEA countries. The Article 57 data also does not include strength, beyond what is sometimes mentioned in the product name itself.

## Skill issue

Nobody involved with this project has a background in pharmaceutical sciences or medicine. The accompanying inadequacies likely extend into other difficulties we encountered in completing this work. Though we made sincere efforts to avoid obvious mistakes, it seems likely that someone with a relevant background will spot errors. We invite them to inform us at hi@arbresearch.com.

# Appendices

The following appendices preserve historical artifacts from the earlier 2024-2025 work that preceded the current pipeline. They are not part of the current pipeline and may use older data and approaches that have since been superseded.

## Appendix 1: Full Colab Notebook

[MedsCheck_data_pipeline.ipynb](https://colab.research.google.com/drive/1VqdD6IqlB7ZvdJmCbSGwWQC4e3MqRKT4)

## Appendix 2: Full Table of Processed Medicines

[EU/UK/US Drugs](https://docs.google.com/spreadsheets/d/1n0uXl7045PAczgF5A_ThhCDvFmcxjMphfGzlUF7K6cA/edit?gid=312875355#gid=312875355)

Compiled sheet of raw and processed data. See other sheets for details on individual processing stages.

## Appendix 3: Google Drive Folder

[Meds Data](https://drive.google.com/drive/folders/1kPfUVqSH_Bqn_0lcJFbLnAqvkP_YmqRj)

Contains all relevant files and data.

To replicate our entire pipeline, please see folder titled 'C Pilgrim' in the Google Drive.

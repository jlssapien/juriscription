# JURISCRIPTION — Dataset Metadata

> The drug database powering the front page of the site.

---

## Pipeline Overview

The main dataset is assembled through a two-stage build pipeline:

```
updated data/normalised_combined.csv
        │
        ▼
scripts/convert_drugs.py
        │  splits by source, groups EU entries by country
        ▼
data/eu.json  ·  data/us.json  ·  data/uk.json  ·  data/manual.json
        │
        ▼
scripts/build_search_index.py
        │  compacts keys, removes blanks, sorts alphabetically
        ▼
frontier-2025/public/drugs-index.json   ← loaded by the browser
```

---

## Source Datasets

| Dataset | Source Tag | Region | Raw CSV Rows |
|---|---|---|---|
| EMA Article 57 | `EMA_Art57` | EU | 162,632 |
| FDA Orange Book | `FDA_OrangeBook` | US | 47,780 |
| UK MHRA | `UK_MHRA` | UK | 29,226 |
| **Total** | | | **239,638** |

The EMA source is larger than it appears at first glance: Article 57 data carries one row per authorisation-country combination, so a single product authorised across many EU member states produces many rows. The pipeline collapses these into a single record with a `countries` array, which accounts for the reduction from 162,632 rows to ~112,894 EU records in the final output.

---

## Record Counts

| File | Records |
|---|---|
| `data/eu.json` | 112,894 |
| `data/us.json` | 47,780 |
| `data/uk.json` | 29,226 |
| `data/manual.json` | 0 *(reserved for manual additions)* |
| **`drugs-index.json` (served to browser)** | **189,900** |

The browser index weighs in at **27.7 MB** (minified JSON). Keys are shortened to single characters (`n`, `s`, `d`, `r`, `c`, `f`, `o`, `l`) to keep the payload compact. Company names are also truncated to 40 characters.

---

## Schema

Each record in the normalised CSV carries ten columns:

| Column | Description |
|---|---|
| `source_dataset` | Originating dataset tag |
| `product_name` | Brand / trade name |
| `active_substances` | Comma-separated INN / generic names |
| `match_key` | Normalised key used for cross-dataset matching |
| `route_of_administration` | How the drug is administered |
| `marketing_authorisation_holder` | Company / MAH |
| `strength` | Dose or concentration |
| `authorisation_country` | Country of the authorisation |
| `approval_date` | Date of authorisation |
| `legal_status` | Regulatory access category |

---

## Legal Status Breakdown (UK/US entries only)

EU records do not carry a status code in this dataset.

| Code | Full Name | Count |
|---|---|---|
| `RX` | Prescription Only (US) | 24,333 |
| `POM` | Prescription Only Medicine (UK) | 23,891 |
| `DISCN` | Discontinued | 22,655 |
| `GSL` | General Sales List | 3,162 |
| `P` | Pharmacy Medicine | 2,169 |
| `OTC` | Over the Counter | 792 |
| `NOT CONTROLLED` | Not Controlled | 4 |

A noteworthy figure: **22,655 entries (~29% of UK/US records) are marked as discontinued** — products no longer on the market but retained in the dataset. This makes the database useful for historical lookups, not just active listings.

---

## Routes of Administration

There are **133 distinct routes** in the dataset, ranging from the everyday to the highly specialised:

- Common: `ORAL`, `TOPICAL`, `INTRAVENOUS`, `INTRAMUSCULAR`, `INHALATION`
- Surgical / interventional: `INTRADISCAL`, `INTRACAVITARY`, `INTRAARTERIAL`, `PERINEURAL`, `CARDIAC`
- Less common: `SKIN SCARIFICATION`, `INTRAPERITONEAL`, `INTRACERVICAL`, `INTRAPLEURAL`

---

## EU Geographic Coverage

The EMA data spans **32 countries** across the EU/EEA. The ten most represented by authorisation count:

| Rank | Country | Authorisations |
|---|---|---|
| 1 | Germany | 16,137 |
| 2 | United Kingdom (Northern Ireland) | 11,726 |
| 3 | Italy | 9,539 |
| 4 | Spain | 9,239 |
| 5 | France | 8,681 |
| 6 | Portugal | 8,260 |
| 7 | Netherlands | 6,936 |
| 8 | Poland | 6,829 |
| 9 | Austria | 6,001 |
| 10 | Greece | 5,219 |

Northern Ireland's position at #2 reflects its unique post-Brexit regulatory status — it remains aligned with EMA rules under the Windsor Framework, giving it a distinct footprint in EU-sourced data.

---

## Top Marketing Authorisation Holders

The five companies with the most entries in the combined index:

| Company | Records |
|---|---|
| Teva B.V. | 1,578 |
| Krka, d.d., Novo Mesto | 1,319 |
| Watson Laboratories Inc | 1,225 |
| Stada Arzneimittel AG | 1,135 |
| Accord Healthcare Limited | 1,118 |

These are all generic / multi-source manufacturers, which is consistent with large product portfolios across multiple markets.

---

## Notes

- The `manual.json` file is an intentional blank slate — the schema supports manually curated entries that can be injected into the pipeline without touching the upstream CSVs.
- Product IDs are SHA-256 hashes of `product_name + active_substances + region`, truncated to 12 hex characters. This gives stable, deterministic IDs that survive re-runs of the build scripts.
- The `updated data/` folder also contains three pre-split normalised CSVs (`normalised_ema_art57.csv`, `normalised_fda_orangebook.csv`, `normalised_uk_mhra.csv`) alongside the combined file, useful for source-level inspection.

# Overview

> What we found when we compared the FDA and MHRA drug databases.

---

## Dataset Scope

| Dataset | Products | Unique Active Substances | Source |
|---------|----------|------------------------|--------|
| FDA Orange Book | 47,780 | ~1,878 | FDA Products.txt (Jan 2026) |
| UK MHRA | 29,226 | ~2,964 | FOI request FOI2025_00058 (Dec 2025) |

The FDA dataset has one row per product. The MHRA dataset has one row per ingredient per product — a two-ingredient drug generates two rows sharing the same Authorisation Number.

---

## Which Drugs Are Shared?

| Category | Count |
|----------|-------|
| Approved in **both** countries | **1,323** |
| Approved in **US only** | **1,414** |
| Approved in **UK only** | **1,641** |

Over 55% of active substances are unique to one country. Matching was performed using a six-layer "Swiss Cheese" approach: exact match, UK-to-US spelling conversion, salt stripping, multi-ingredient reconstruction, ATC enrichment, and fuzzy matching (token_sort_ratio >= 92).

---

## Product-Level Matching

For every individual product, the closest counterparts in the other country were scored using:

```
total_score = 0.60 × inn_score + 0.40 × strength_score
```

| Direction | Total Match Rows | Perfect Scores (1.0) |
|-----------|-----------------|---------------------|
| FDA → MHRA | 192,051 | 66,010 (36.0%) |
| MHRA → FDA | 83,942 | 37,752 (47.1%) |

### Confidence Tiers

| Tier | Definition | FDA→MHRA | MHRA→FDA |
|------|-----------|----------|----------|
| HIGH | INN=1.0 AND strength=1.0 | 65,997 | 37,724 |
| MEDIUM | INN=1.0 AND total≥0.60, or INN≥0.50 AND total≥0.70 | 101,535 | 36,765 |
| LOW | Any other match | 15,932 | 5,692 |
| NONE | No match found | 8,587 | 3,761 |

---

## Legal Status Classifications

The two countries use different systems to classify whether a drug requires a prescription:

| Tier | US (FDA) | UK (MHRA) |
|------|----------|-----------|
| Prescription | RX | POM (Prescription Only Medicine) |
| Non-prescription | OTC | P (Pharmacy — pharmacist oversight), GSL (General Sales List — supermarkets) |

The UK's P (Pharmacy) classification has no US equivalent — it means available without a prescription but only from a pharmacy. The US has only OTC (no pharmacist required) and RX (prescription required).

---

## Drugs Still in UK, Discontinued in US

Of the 1,641 MHRA substances with no active FDA match, 78 (4.8%) were found in the FDA discontinued products list. These represent drugs still available to UK patients that US patients have lost access to. The remaining 95.2% have no FDA counterpart past or present.

---

## Country-Exclusive Substances

### UK-only (1,641 substances)

| Category | Count |
|----------|-------|
| Standard drugs | 1,375 |
| Biologics/vaccines | 237 |
| Herbal/botanical | 22 |
| Radiopharmaceutical | 7 |

The 237 UK-only biologics largely reflects a data source gap: US biologics are in a separate BLA database, not the Orange Book.

### FDA-only (894 substances)

| Category | Count |
|----------|-------|
| Standard drugs | 867 |
| Radiopharmaceutical | 25 |
| Biologics/vaccines | 2 |

---

## Known Limitations

1. **Route of administration** is absent from the MHRA data — tablets and injections of the same drug/dose score identically
2. **Dosage form** is not compared — tablet, capsule, injection, and cream are all treated the same
3. **1,289 FDA entries** (~2.7%) have unparseable strength strings, given a neutral 0.5 score
4. **Bidirectional matching not reconciled** — FDA-to-MHRA and MHRA-to-FDA are separate one-way outputs

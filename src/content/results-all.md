# Results

> Findings from comparing the FDA Orange Book (US) and MHRA register (UK). These results are derived from the datasets described below and are subject to the limitations outlined at the end of this page. They should be read as observations about the data rather than definitive statements about drug availability in either country.

---

## Data Sources

| Dataset | Products | Unique Active Substances | Source | Downloaded |
|---------|----------|------------------------|--------|------------|
| FDA Orange Book | 47,780 | ~1,878 | FDA Products.txt | Jan 2026 |
| UK MHRA | 29,226 | ~2,964 | FOI request FOI2025_00058 (680-page PDF) | Dec 2025 |

The FDA Orange Book covers drugs approved via New Drug Applications (NDAs) and Abbreviated New Drug Applications (ANDAs). It does not include biologics (which are in a separate BLA database), most OTC monograph drugs, or compounded medications. The MHRA dataset covers all medicines granted a marketing authorisation in the UK, obtained via a Freedom of Information request.

The FDA dataset has one row per product. The MHRA dataset has one row per *ingredient* per product — a two-ingredient drug generates two rows sharing the same Authorisation Number.

---

## Substance-Level Overlap

Matching was performed on International Nonproprietary Names (INN) using a six-layer approach: exact match, UK-to-US spelling conversion (e.g. aluminium/aluminum), salt stripping (~65 qualifier terms removed), multi-ingredient reconstruction, ATC enrichment, and fuzzy matching.

| Category | Count |
|----------|-------|
| Matched in **both** countries | **1,323** |
| Found in **US only** | **1,414** |
| Found in **UK only** | **1,641** |

Over 55% of active substances in these datasets are unique to one country. This figure reflects the contents of these specific databases — it does not necessarily mean those substances are unavailable in the other country through other regulatory pathways not captured here (see Limitations).

---

## Product-Level Matching

For every individual product, the closest counterparts in the other country were scored:

```
total_score = 0.60 × inn_score + 0.40 × strength_score
```

- **INN score (60%):** Jaccard similarity on normalised INN sets
- **Strength score (40%):** Log-ratio closeness after unit harmonisation

| Direction | Total Match Rows | Perfect Scores (1.0) |
|-----------|-----------------|---------------------|
| FDA → MHRA | 192,051 | 66,010 (36.0%) |
| MHRA → FDA | 83,942 | 37,752 (47.1%) |

### Confidence Tiers

| Tier | Definition | FDA→MHRA | MHRA→FDA |
|------|-----------|----------|----------|
| HIGH | INN = 1.0 AND strength = 1.0 | 65,997 | 37,724 |
| MEDIUM | INN = 1.0 AND total ≥ 0.60, or INN ≥ 0.50 AND total ≥ 0.70 | 101,535 | 36,765 |
| LOW | Any other match | 15,932 | 5,692 |
| NONE | No match found | 8,587 | 3,761 |

---

## Legal Status Classifications

The two countries use different systems to classify whether a drug requires a prescription:

| Tier | US (FDA) | UK (MHRA) |
|------|----------|-----------|
| Prescription | RX | POM (Prescription Only Medicine) |
| Non-prescription | OTC | P (Pharmacy — pharmacist oversight), GSL (General Sales List) |

The UK has a three-tier system. **GSL** products can be sold in supermarkets with no pharmacist involvement. **P** products can be sold without a prescription but only from a pharmacy under pharmacist supervision. **POM** requires a doctor's prescription. The US has only two tiers: OTC and RX. The UK's P classification has no direct US equivalent.

For the discrepancy analysis below, we treat RX and POM as equivalent (prescription-required) and OTC, P, and GSL as equivalent (non-prescription). A "discrepancy" is any matched product pair where one side is prescription and the other is non-prescription.

### Discrepancy Severity

Not all discrepancies are equally significant. We distinguish two levels:

| Severity | Pattern | Example |
|----------|---------|---------|
| **EXTREME** | GSL ↔ RX | A drug sold in UK supermarkets with no pharmacist involvement, but requiring a prescription in the US (or vice versa) |
| **MODERATE** | P ↔ RX, or OTC ↔ POM | A drug available from a UK pharmacy (with pharmacist oversight) but requiring a US prescription, or a US OTC drug requiring a UK prescription |

EXTREME cases represent the widest regulatory gap — one country considers the product safe enough for unrestricted sale while the other requires a doctor's involvement.

---

## Substance-Level Discrepancy Overview

A separate analysis examined all 1,323 matched substance pairs at the substance level (rather than individual product matches) and classified each pair's regulatory relationship. Of these, **101 substances** showed a discrepancy of interest — meaning the legal status in one country includes non-prescription access while the other does not.

| Category | Count | Meaning |
|----------|-------|---------|
| UK non-prescription only, US prescription only | 16 | All UK products of this substance are non-prescription (P or GSL); all US products are RX |
| UK mixed (some non-Rx), US prescription only | 60 | The UK has both prescription and non-prescription products of this substance; the US has only RX |
| UK prescription only, US mixed (some OTC) | 23 | The UK has only POM products; the US has both OTC and RX products |
| UK prescription only, US non-prescription only | 2 | All UK products are POM; all US products are OTC |

The remaining 1,222 matched pairs showed no discrepancy: 1,137 were prescription-only in both countries, 55 were non-prescription in both, and 30 had other mixed patterns where both countries offered some non-prescription access.

The 60 "UK mixed" substances are particularly notable. These are cases where the UK has reclassified certain formulations or strengths from POM to P or GSL — making them available without prescription — while the same substance remains entirely prescription-only in the US. This is the most common pattern of divergence in these datasets.

### Strength-Threshold Discrepancies

Within the 101 discrepant substances, **23** also exhibit a strength-threshold pattern: the same drug is available at the same numerical strength in both countries, but at different legal tiers. For example, sildenafil at 50 mg is P (pharmacy) in the UK but RX in the US — identical molecule, identical dose, different regulatory classification. These cases are the clearest examples of a genuine policy disagreement rather than a data-matching artefact, though differences in approved indications or dosage forms may still be a factor.

The substances with strength-threshold discrepancies include: Amiodarone, Calcium Gluconate, Chloroquine, Fluconazole, Isosorbide Dinitrate, Isosorbide Mononitrate, Mebendazole, Naproxen, Promethazine, Sildenafil, Simvastatin, Tadalafil, Tamsulosin, Ulipristal, and Zolmitriptan. Many of these also appear in the dose-pairing tables below.

---

## Legal Discrepancies: High Confidence

These are dose pairings where the matched products have identical active ingredients and identical strength (confidence = HIGH), but the two countries disagree on whether a prescription is required. After deduplicating branded generics, there are **68 dose pairings** across **33 substances**.

### UK More Accessible — 44 dose pairings

*Available without prescription in the UK (Pharmacy or General Sale), but appears to require a prescription in the US based on these datasets.*

| # | Substance | UK Strength | UK Status | US Strength | US Status |
|---|-----------|-------------|-----------|-------------|-----------|
| 1 | Atovaquone / Proguanil | 250 mg ; 100 mg | P | 250 mg ; 100 mg | RX |
| 2 | Calcium Gluconate | 1 g | GSL | 1 gm/10 ml (100 mg/ml) | RX |
| 3 | Calcium Gluconate | 1 g | GSL | 1 gm/50 ml (20 mg/ml) | RX |
| 4 | Calcium Gluconate | 1 g | GSL | 1 gm/100 ml (10 mg/ml) | RX |
| 5 | Chloroquine | 250 mg | P | 250 mg | RX |
| 6 | Codeine | 15 mg | P | 15 mg | RX |
| 7 | Fexofenadine | 180 mg | P | 180 mg | RX |
| 8 | Fluconazole | 150 mg | P | 150 mg | RX |
| 9 | Ibuprofen | 100 mg/5mL | P | 100 mg/5 ml | RX |
| 10 | Ibuprofen | 100 mg/5mL | GSL | 100 mg/5 ml | RX |
| 11 | Ibuprofen | 300 mg | P | 300 mg | RX |
| 12 | Ibuprofen | 400 mg | P | 400 mg | RX |
| 13 | Isosorbide Dinitrate | 10 mg | P | 10 mg | RX |
| 14 | Isosorbide Dinitrate | 20 mg | P | 20 mg | RX |
| 15 | Isosorbide Dinitrate | 40 mg | P | 40 mg | RX |
| 16 | Isosorbide Mononitrate | 10 mg | P | 10 mg | RX |
| 17 | Isosorbide Mononitrate | 20 mg | P | 20 mg | RX |
| 18 | Isosorbide Mononitrate | 30 mg | P | 30 mg | RX |
| 19 | Isosorbide Mononitrate | 60 mg | P | 60 mg | RX |
| 20 | Loperamide | 2 mg | GSL | 2 mg | RX |
| 21 | Loperamide | 2 mg | P | 2 mg | RX |
| 22 | Mebendazole | 100 mg | P | 100 mg | RX |
| 23 | Naproxen | 250 mg | P | 250 mg | RX |
| 24 | Naproxen | 250 mg | P | 250 mg (base eq) | RX |
| 25 | Omeprazole | 10 mg | P | 10 mg | RX |
| 26 | Omeprazole | 10 mg | P | 10 mg (base eq) | RX |
| 27 | Omeprazole | 20 mg | GSL | 20 mg | RX |
| 28 | Orlistat | 120 mg | P | 120 mg | RX |
| 29 | Paracetamol | 1000 mg | P | 1 gm/100 ml (10 mg/ml) | RX |
| 30 | Paracetamol | 1000 mg | GSL | 1 gm/100 ml (10 mg/ml) | RX |
| 31 | Paracetamol | 500 mg | GSL | 500 mg/50 ml (10 mg/ml) | RX |
| 32 | Paracetamol | 500 mg | P | 500 mg/50 ml (10 mg/ml) | RX |
| 33 | Paracetamol | 650 mg | GSL | 650 mg/65 ml (10 mg/ml) | RX |
| 34 | Promethazine | 25 mg | P | 25 mg | RX |
| 35 | Sildenafil | 50 mg | P | 50 mg (base eq) | RX |
| 36 | Simvastatin | 10 mg | P | 10 mg | RX |
| 37 | Simvastatin | 20 mg | P | 20 mg | RX |
| 38 | Simvastatin | 40 mg | P | 40 mg | RX |
| 39 | Simvastatin | 80 mg | P | 80 mg | RX |
| 40 | Sumatriptan | 50 mg | P | 50 mg (base eq) | RX |
| 41 | Tadalafil | 10 mg | P | 10 mg | RX |
| 42 | Tamsulosin | 0.4 mg | P | 0.4 mg | RX |
| 43 | Ulipristal | 30 mg | P | 30 mg | RX |
| 44 | Zolmitriptan | 2.5 mg | P | 2.5 mg | RX |

#### Notable cases

- **Sildenafil** (50 mg) and **Tadalafil** (10 mg) — erectile dysfunction drugs available from UK pharmacies since 2018/2021; prescription-only in the US
- **Sumatriptan** (50 mg) and **Zolmitriptan** (2.5 mg) — migraine treatments; UK pharmacy sale since 2006
- **Simvastatin** (10–80 mg) — cholesterol; the UK permitted pharmacy-sale simvastatin; the US has never approved an OTC statin
- **Codeine** (15 mg) — available as a pharmacy medicine in the UK; prescription-only in the US
- **Ulipristal** (30 mg) — emergency contraception (ellaOne); UK pharmacy sale, US prescription-only
- **Chloroquine** and **Atovaquone/Proguanil** — antimalarials available from UK pharmacies for travel prophylaxis; prescription-only in the US
- **Paracetamol/Acetaminophen** — GSL in the UK at 500–1000 mg; the US products matched here are IV formulations (10 mg/ml), which are RX. Oral acetaminophen is OTC in the US, so these pairings reflect a dosage-form mismatch rather than a true policy disagreement (see Limitations)

### US More Accessible — 24 dose pairings

*Available without prescription in the US (OTC), but appears to require a prescription in the UK (POM) based on these datasets.*

| # | Substance | UK Strength | UK Status | US Strength | US Status |
|---|-----------|-------------|-----------|-------------|-----------|
| 1 | Cimetidine | 200 mg | POM | 200 mg | OTC |
| 2 | Esomeprazole | 20 mg | POM | 20 mg (base eq) | OTC |
| 3 | Famotidine | 20 mg | POM | 20 mg | OTC |
| 4 | Fexofenadine | 180 mg | POM | 180 mg | OTC |
| 5 | Fexofenadine | 30 mg | POM | 30 mg | OTC |
| 6 | Fluticasone | 27.5 mcg/actuation | POM | 0.0275 mg/spray | OTC |
| 7 | Ibuprofen | 100 mg | POM | 100 mg | OTC |
| 8 | Ibuprofen | 200 mg | POM | 200 mg | OTC |
| 9 | Ibuprofen | 200 mg | POM | 200 mg (base eq) | OTC |
| 10 | Ibuprofen | 200 mg | POM | EQ 200 MG FREE ACID | OTC |
| 11 | Lansoprazole | 15 mg | POM | 15 mg | OTC |
| 12 | Levocetirizine | 5 mg | POM | 5 mg | OTC |
| 13 | Levonorgestrel | 1.5 mg | POM | 1.5 mg | OTC |
| 14 | Loperamide | 2 mg | POM | 2 mg | OTC |
| 15 | Loratadine | 10 mg | POM | 10 mg | OTC |
| 16 | Loratadine | 5 mg | POM | 5 mg | OTC |
| 17 | Miconazole | 2 % w/w | POM | 2 %, 1.2 gm | OTC |
| 18 | Miconazole | 2 % w/w | POM | 2 %, 200 mg | OTC |
| 19 | Miconazole | 2 % w/w | POM | 2 %, 100 mg | OTC |
| 20 | Miconazole | 2 % w/w | POM | 2 %, 4 % | OTC |
| 21 | Omeprazole | 20 mg | POM | 20 mg (base eq) | OTC |
| 22 | Omeprazole | 20 mg | POM | 20 mg | OTC |
| 23 | Paracetamol | 650 mg | POM | 650 mg | OTC |
| 24 | Ranitidine | 150 mg | POM | 150 mg (base eq) | OTC |

#### Notable cases

- **Famotidine** (20 mg), **Cimetidine** (200 mg), **Ranitidine** (150 mg) — H2 blockers; OTC in the US, POM in the UK
- **Esomeprazole** (20 mg), **Lansoprazole** (15 mg), **Omeprazole** (20 mg as POM) — proton pump inhibitors switched to OTC in the US
- **Levonorgestrel** (1.5 mg) — emergency contraception (Plan B); OTC in the US, but POM for some UK formulations
- **Loratadine**, **Levocetirizine**, **Fexofenadine** — antihistamines; OTC in the US, some UK formulations still POM
- **Fluticasone** (27.5 mcg) — nasal steroid (Flonase); US OTC, UK POM at this formulation

#### Mixed-direction substances

Some substances appear on both lists — more accessible in the UK at some dose pairings and more accessible in the US at others. At high confidence these are **Fexofenadine**, **Ibuprofen**, **Loperamide**, **Omeprazole**, and **Paracetamol**. This typically reflects different formulations or branded products having different legal statuses within the same country (e.g. a UK ibuprofen suspension classified GSL while some other ibuprofen products are POM).

---

## Legal Discrepancies: Medium Confidence

At medium confidence (same active ingredient, similar but not identical strength), the broader net captures **809 dose pairings** across **127 substances**. Of these, **101 substances are new** — not found at high confidence. The tables below are summarised at substance level rather than listing all 809 dose pairings.

### UK More Accessible — 80 substances

*Available without prescription in the UK but appears to require a prescription in the US. Substances already found at high confidence are unmarked; new findings are marked **(NEW)**.*

| # | Substance | UK Status | US Status |
|---|-----------|-----------|-----------|
| 1 | Acetic Acid, Glacial / Hydrocortisone **(NEW)** | GSL, P | RX |
| 2 | Aciclovir **(NEW)** | GSL | RX |
| 3 | Aciclovir / Hydrocortisone **(NEW)** | GSL, P | RX |
| 4 | Adapalene / Benzoyl Peroxide **(NEW)** | P | RX |
| 5 | Adrenaline / Lidocaine **(NEW)** | P | RX |
| 6 | Aminophylline **(NEW)** | P | RX |
| 7 | Ascorbic Acid **(NEW)** | GSL | RX |
| 8 | Aspirin / Caffeine / Orphenadrine **(NEW)** | P | RX |
| 9 | Atovaquone / Proguanil | P | RX |
| 10 | Azelastine / Fluticasone **(NEW)** | P | RX |
| 11 | Azithromycin **(NEW)** | P | RX |
| 12 | Barium **(NEW)** | P | RX |
| 13 | Benzoyl Peroxide **(NEW)** | P | RX |
| 14 | Benzoyl Peroxide / Clindamycin **(NEW)** | P | RX |
| 15 | Benzoyl Peroxide / Erythromycin **(NEW)** | P | RX |
| 16 | Betamethasone / Clotrimazole **(NEW)** | P | RX |
| 17 | Caffeine **(NEW)** | P | RX |
| 18 | Caffeine / Paracetamol **(NEW)** | GSL, P | RX |
| 19 | Calcium | GSL, P | RX |
| 20 | Cetirizine **(NEW)** | GSL, P | RX |
| 21 | Chlorhexidine **(NEW)** | GSL, P | RX |
| 22 | Chloroquine | P | RX |
| 23 | Ciprofloxacin / Hydrocortisone **(NEW)** | GSL, P | RX |
| 24 | Citric Acid / Dextrose / Potassium / Sodium **(NEW)** | GSL | RX |
| 25 | Clotrimazole / Fluconazole **(NEW)** | P | RX |
| 26 | Codeine | P | RX |
| 27 | Codeine Phosphate Fine Crystals / Paracetamol **(NEW)** | P | RX |
| 28 | Codeine / Paracetamol **(NEW)** | P | RX |
| 29 | Crotamiton **(NEW)** | GSL | RX |
| 30 | Cyanocobalamin **(NEW)** | P | RX |
| 31 | Cyproheptadine **(NEW)** | P | RX |
| 32 | Desloratadine / Pseudoephedrine **(NEW)** | P | RX |
| 33 | Dextrose / Potassium / Sodium **(NEW)** | GSL | RX |
| 34 | Dihydrocodeine / Paracetamol **(NEW)** | P | RX |
| 35 | Dimenhydrinate **(NEW)** | P | RX |
| 36 | Diphenhydramine **(NEW)** | P | RX |
| 37 | Diphenhydramine / Paracetamol **(NEW)** | P | RX |
| 38 | Econazole **(NEW)** | P | RX |
| 39 | Ephedrine **(NEW)** | P | RX |
| 40 | Estradiol **(NEW)** | P | RX |
| 41 | Fluconazole | P | RX |
| 42 | Fluorescein **(NEW)** | P | RX |
| 43 | Flurbiprofen **(NEW)** | P | RX |
| 44 | Folic Acid **(NEW)** | GSL, P | RX |
| 45 | Hydralazine / Isosorbide Dinitrate **(NEW)** | P | RX |
| 46 | Hydrocodone / Ibuprofen **(NEW)** | GSL | RX |
| 47 | Hydrocortisone **(NEW)** | P | RX |
| 48 | Hydrocortisone / Pramoxine **(NEW)** | GSL, P | RX |
| 49 | Ibuprofen Lysine **(NEW)** | GSL, P | RX |
| 50 | Isoflurane **(NEW)** | P | RX |
| 51 | Isosorbide Dinitrate | P | RX |
| 52 | Isosorbide Mononitrate | P | RX |
| 53 | Lactulose **(NEW)** | P | RX |
| 54 | Lidocaine **(NEW)** | P | RX |
| 55 | Lidocaine / Prilocaine **(NEW)** | P | RX |
| 56 | Malathion **(NEW)** | P | RX |
| 57 | Mebendazole | P | RX |
| 58 | Nicotine **(NEW)** | GSL | RX |
| 59 | Oxymetazoline **(NEW)** | GSL | RX |
| 60 | Paracetamol / Butalbital **(NEW)** | GSL, P | RX |
| 61 | Paracetamol / Codeine **(NEW)** | P | RX |
| 62 | Paracetamol / Ibuprofen **(NEW)** | GSL, P | RX |
| 63 | Paracetamol / Phenylephrine **(NEW)** | GSL, P | RX |
| 64 | Paracetamol / Pseudoephedrine **(NEW)** | P | RX |
| 65 | Paracetamol / Sodium **(NEW)** | GSL | RX |
| 66 | Penciclovir **(NEW)** | GSL | RX |
| 67 | Permethrin **(NEW)** | P | RX |
| 68 | Piroxicam **(NEW)** | P | RX |
| 69 | Prochlorperazine **(NEW)** | P | RX |
| 70 | Promethazine | P | RX |
| 71 | Sildenafil | P | RX |
| 72 | Sodium **(NEW)** | GSL, P | RX |
| 73 | Sodium Polystyrene Sulfonate **(NEW)** | P | RX |
| 74 | Sumatriptan | P | RX |
| 75 | Tadalafil | P | RX |
| 76 | Tetracaine **(NEW)** | P | RX |
| 77 | Theophylline **(NEW)** | P | RX |
| 78 | Thiamine **(NEW)** | GSL, P | RX |
| 79 | Tranexamic Acid **(NEW)** | P | RX |
| 80 | Zinc **(NEW)** | P | RX |

#### Notable new findings at medium confidence

- **Aciclovir** — cold sore cream is GSL (supermarket) in the UK; all aciclovir products are RX in the US
- **Codeine / Paracetamol** (co-codamol) — available as a pharmacy medicine (P) in the UK at low-dose codeine; RX in the US
- **Azithromycin** — the UK permitted pharmacy-sale azithromycin for chlamydia treatment; RX in the US
- **Estradiol** — low-dose vaginal estradiol became available as P in the UK; RX in the US
- **Tranexamic Acid** — for heavy menstrual bleeding; UK pharmacy sale, US prescription-only
- **Nicotine** — nicotine replacement products (patches, gum) are GSL in the UK; the matched US formulations are RX
- **Lidocaine** — topical anaesthetic available as P in the UK; RX in the US
- **Folic Acid** — GSL/P in the UK; some US formulations are RX
- **Penciclovir** — cold sore treatment; GSL in the UK, RX in the US

### US More Accessible — 24 substances

*Available without prescription in the US but appears to require a prescription in the UK.*

| # | Substance | UK Status | US Status |
|---|-----------|-----------|-----------|
| 1 | Adapalene **(NEW)** | POM | OTC |
| 2 | Adrenaline **(NEW)** | POM | OTC |
| 3 | Aspirin **(NEW)** | POM | OTC |
| 4 | Brimonidine **(NEW)** | POM | OTC |
| 5 | Chlorphenamine **(NEW)** | POM | OTC |
| 6 | Chlorphenamine / Ibuprofen / Pseudoephedrine **(NEW)** | POM | OTC |
| 7 | Chlorphenamine / Pseudoephedrine **(NEW)** | POM | OTC |
| 8 | Famotidine | POM | OTC |
| 9 | Fexofenadine / Pseudoephedrine **(NEW)** | POM | OTC |
| 10 | Guaifenesin / Pseudoephedrine **(NEW)** | POM | OTC |
| 11 | Ibuprofen / Phenylephrine **(NEW)** | POM | OTC |
| 12 | Ivermectin **(NEW)** | POM | OTC |
| 13 | Levocetirizine | POM | OTC |
| 14 | Loratadine | POM | OTC |
| 15 | Loratadine / Pseudoephedrine **(NEW)** | POM | OTC |
| 16 | Minoxidil **(NEW)** | POM | OTC |
| 17 | Naloxone **(NEW)** | POM | OTC |
| 18 | Nizatidine **(NEW)** | POM | OTC |
| 19 | Oxybutynin **(NEW)** | POM | OTC |
| 20 | Paracetamol / Tramadol **(NEW)** | POM | OTC |
| 21 | Pseudoephedrine **(NEW)** | POM | OTC |
| 22 | Terbinafine **(NEW)** | POM | OTC |
| 23 | Tioconazole **(NEW)** | POM | OTC |
| 24 | Triamcinolone **(NEW)** | POM | OTC |

#### Notable new findings at medium confidence

- **Naloxone** — the opioid overdose reversal drug; the US made it OTC in 2023; the UK still requires a prescription
- **Adapalene** — acne retinoid (Differin); US OTC since 2016, UK POM
- **Minoxidil** — hair loss treatment; US OTC (Rogaine), UK POM
- **Ivermectin** — topical antiparasitic; US OTC, UK POM
- **Oxybutynin** — overactive bladder patch; US OTC, UK POM
- **Triamcinolone** — nasal steroid (Nasacort); US OTC, UK POM
- **Adrenaline** — the US has OTC epinephrine inhalers (Primatene Mist); UK POM

### Mixed Direction — 23 substances

These substances have products classified as non-prescription in *both* countries, but at different formulations or strengths. Depending on which specific product is matched, the discrepancy can go either way.

| # | Substance | UK Statuses | US Statuses |
|---|-----------|-------------|-------------|
| 1 | Azelastine **(NEW)** | P, POM | OTC, RX |
| 2 | Budesonide **(NEW)** | GSL, P, POM | OTC, RX |
| 3 | Clotrimazole **(NEW)** | GSL, P, POM | OTC, RX |
| 4 | Diclofenac **(NEW)** | GSL, P, POM | OTC, RX |
| 5 | Esomeprazole | GSL, P, POM | OTC, RX |
| 6 | Fexofenadine | GSL, P, POM | OTC, RX |
| 7 | Fluticasone | P, POM | OTC, RX |
| 8 | Ibuprofen | GSL, P, POM | OTC, RX |
| 9 | Ibuprofen / Paracetamol **(NEW)** | GSL, P, POM | OTC, RX |
| 10 | Ketoconazole **(NEW)** | GSL, P, POM | OTC, RX |
| 11 | Levonorgestrel | P, POM | OTC, RX |
| 12 | Miconazole | GSL, P, POM | OTC, RX |
| 13 | Mometasone **(NEW)** | GSL, P, POM | OTC, RX |
| 14 | Naproxen | P, POM | OTC, RX |
| 15 | Olopatadine **(NEW)** | P, POM | OTC, RX |
| 16 | Omeprazole | GSL, POM | OTC, RX |
| 17 | Omeprazole / Sodium **(NEW)** | GSL, POM | OTC, RX |
| 18 | Orlistat | P, POM | OTC, RX |
| 19 | Paracetamol | GSL, P, POM | OTC, RX |
| 20 | Phenylephrine **(NEW)** | GSL, P, POM | OTC, RX |
| 21 | Potassium **(NEW)** | GSL, P, POM | OTC, RX |
| 22 | Povidone-Iodine **(NEW)** | P, POM | OTC, RX |
| 23 | Ranitidine | GSL, POM | OTC, RX |

---

## Maximum Divergence Cases (GSL ↔ RX)

The most extreme discrepancies are those where a drug is available as **General Sale** (sold in supermarkets, no pharmacist needed) in one country but **prescription-only** in the other. These represent the widest possible regulatory gap in these datasets.

At high confidence, 5 substances have at least one GSL ↔ RX pairing:

| # | Substance | UK Statuses | US Statuses |
|---|-----------|-------------|-------------|
| 1 | Calcium Gluconate | GSL | RX |
| 2 | Ibuprofen | GSL, P, POM | OTC, RX |
| 3 | Loperamide | GSL, P, POM | OTC, RX |
| 4 | Omeprazole | GSL, P, POM | OTC, RX |
| 5 | Paracetamol | GSL, P, POM | OTC, RX |

At medium confidence, a further **28 substances** exhibit GSL ↔ RX pairings. Of these, the clearest cases of UK GSL products matched to US RX-only products include:

| # | Substance | UK Status | US Status | Notes |
|---|-----------|-----------|-----------|-------|
| 1 | Aciclovir | GSL | RX | Cold sore cream sold in UK supermarkets |
| 2 | Nicotine | GSL | RX | Nicotine replacement (patches, gum) |
| 3 | Penciclovir | GSL | RX | Cold sore treatment |
| 4 | Crotamiton | GSL | RX | Anti-itch cream |
| 5 | Oxymetazoline | GSL | RX | Nasal decongestant spray |
| 6 | Cetirizine | GSL, P | RX | Common antihistamine |
| 7 | Folic Acid | GSL, P | RX | Pregnancy supplement |
| 8 | Hydrocortisone | GSL, P | RX | Low-strength topical steroid |
| 9 | Thiamine | GSL, P | RX | Vitamin B1 |
| 10 | Ibuprofen Lysine | GSL, P | RX | Neonatal ibuprofen formulation |

Several of these reflect formulation differences rather than true policy disagreement — for example, the US RX ascorbic acid and thiamine products are injectable formulations, while the UK GSL products are oral tablets. The GSL ↔ RX gap is real in the data but may not indicate a policy divergence for equivalent products (see Limitations).

---

## Drugs Still in UK, Discontinued in US

Of the 1,641 MHRA substances with no active FDA match, 78 (4.8%) were found in the FDA's discontinued products list. These may represent drugs still available to UK patients that US patients have lost access to — though discontinuation can reflect commercial decisions rather than safety concerns. The remaining 95.2% have no FDA counterpart past or present in the Orange Book.

---

## Country-Exclusive Substances

### UK-only (1,641 substances in this dataset)

| Category | Count |
|----------|-------|
| Standard drugs | 1,375 |
| Biologics/vaccines | 237 |
| Herbal/botanical | 22 |
| Radiopharmaceutical | 7 |

By UK legal status:

| Status | Count |
|--------|-------|
| POM only | 1,233 |
| GSL only | 156 |
| P only | 109 |
| GSL and P | 50 |
| P and POM | 44 |
| GSL, P and POM | 39 |
| GSL and POM | 10 |

Of the 1,641 UK-only substances, 75% (1,233) are prescription-only. The remaining 25% include substances available as GSL or P — many of these are traditional remedies, herbal products, or common ingredients (e.g. activated charcoal, almond oil, capsicum) that the FDA Orange Book does not track because they fall outside the NDA/ANDA approval pathway.

### FDA-only (894 substances in this dataset)

| Category | Count |
|----------|-------|
| Standard drugs | 867 |
| Radiopharmaceutical | 25 |
| Biologics/vaccines | 2 |

By US legal status:

| Status | Count |
|--------|-------|
| RX only | 857 |
| OTC only | 33 |
| Both OTC and RX | 4 |

96% of FDA-only substances are prescription-only. The 33 OTC-only substances with no UK equivalent may include products approved under the OTC monograph pathway that happen to also appear in the Orange Book, or drugs that have simply never been marketed in the UK.

The large imbalance in biologics (237 UK-only vs 2 FDA-only) is primarily a data source artefact: US biologics are regulated under Biologics License Applications (BLAs), which are in a separate database not included in the Orange Book. This does not mean those biologics are unavailable in the US.

---

## Limitations

These results should be interpreted with the following caveats in mind:

### Data source limitations

- **The FDA Orange Book is not a complete list of US-approved drugs.** It covers NDAs and ANDAs but excludes biologics (BLAs), most OTC monograph drugs, insulin products approved before 2020, and compounded medications. A substance appearing as "US-only" or "UK-only" in our data may simply reflect which database it falls under, not its actual availability.
- **The MHRA dataset was extracted from a PDF.** The original data was supplied as a 680-page landscape PDF generated from Excel. While extraction was verified and 43 rows were manually corrected, some errors may remain. The extraction has been independently replicated.
- **Both datasets are snapshots.** The FDA data was downloaded January 2026 and the MHRA data December 2025. Regulatory status can change — drugs may be reclassified, approved, or withdrawn after these dates.
- **The MHRA dataset may include products no longer actively marketed.** A marketing authorisation can remain on the register even if the product is not commercially available. The legal status reflects the authorisation, not necessarily current market availability.

### Matching limitations

- **Route of administration is absent from the MHRA data.** The matching algorithm cannot distinguish between tablets and injections of the same drug at the same dose. This leads to some misleading pairings — for example, oral paracetamol (GSL in the UK) matched to intravenous acetaminophen (RX in the US). In reality, the oral forms have the same legal status in both countries.
- **Dosage form is not compared.** Tablets, capsules, creams, injections, and inhalers of the same drug and strength are treated as equivalent matches. A cream classified GSL may be matched to an injection classified RX — technically the same active ingredient at the same concentration, but clinically and regulatorily quite different.
- **Strength parsing is imperfect.** 1,289 FDA entries (~2.7%) have complex strength strings that could not be parsed. These receive a neutral score of 0.5, which may cause them to appear as medium-confidence matches when they would otherwise be high or low.
- **Bidirectional matching is not reconciled.** The FDA-to-MHRA and MHRA-to-FDA match tables are independent one-way lookups. A substance may appear as a discrepancy in one direction but not the other, depending on which specific products are matched.
- **"Same substance" is determined by INN, not by indication.** Two products with the same INN and strength may be approved for entirely different indications in each country. The legal status may reflect the approved use, not the molecule itself.

### Interpretation caveats

- **A legal status discrepancy does not necessarily mean patients have different access.** A drug classified POM in the UK may still be widely prescribed and easily obtained via a GP appointment. Conversely, an OTC drug in the US may be unaffordable without insurance. Legal classification is one dimension of access, not the whole picture.
- **The UK P (Pharmacy) classification is treated as "non-prescription" throughout.** While P drugs do not require a prescription, they do require a pharmacist to be present and may involve a consultation. This is a meaningfully different level of access than US OTC, where products can be bought from any shop shelf. Treating P as equivalent to OTC slightly overstates the accessibility gap.
- **Some apparent discrepancies reflect formulation differences, not policy differences.** When a UK GSL tablet is matched to a US RX injection, the discrepancy is real in the data but misleading as a policy comparison. We have flagged the most prominent cases (e.g. paracetamol) but similar issues may exist elsewhere in the tables.
- **The "UK more accessible" and "US more accessible" labels describe the data, not a judgement.** Different countries make different regulatory decisions for different reasons, including differences in healthcare systems, prescribing cultures, and risk tolerances. Neither approach is inherently better.
- **Medium confidence matches should be treated with more caution.** These pairings share the same active ingredient but may differ in strength, and the strength differences can sometimes mean the products are not truly comparable (e.g. a 5% topical cream matched to a 200 mg oral tablet of the same substance).

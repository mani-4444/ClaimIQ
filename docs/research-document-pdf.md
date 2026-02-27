# ClaimIQ
## AI-Powered Motor Claim Pre-Approval

### Research Document

- Event: Hack With AI 2026
- Team: Add team name
- Date: 28 February 2026

---

## Abstract
ClaimIQ is an AI-assisted motor-claim pre-assessment platform that automates damage analysis from uploaded vehicle images. The system combines a custom YOLO model for damage detection, explainable severity and fraud scoring, and company/model-aware repair cost estimation in INR. The output is insurer-ready: damage categories, confidence level, severity band, fraud risk band, and itemized repair breakdown. This approach reduces manual assessment delays, improves consistency, and supports faster triage with transparent analytics.

<div style="page-break-after: always;"></div>

## 1. Problem Statement
Traditional claim workflows are often slow and subjective, with limited fraud intelligence and inconsistent cost reasoning. Key gaps include:

- Manual, time-consuming visual inspections
- Inconsistent evaluator judgments across similar claims
- Weak duplicate/manipulated image controls
- Low transparency for customer-facing cost decisions

ClaimIQ addresses these gaps through a unified AI-first claim processing pipeline.

## 2. Objectives
1. Detect and classify visible vehicle damage from claim images.
2. Quantify severity with a reproducible score.
3. Estimate repair costs using company-model-damage mapping.
4. Flag fraud risk from multiple authenticity signals.
5. Produce explainable outputs for insurer operations.

## 3. Data and Model Inputs
### 3.1 Damage Detection Data
- Source: Car-damage image datasets (curated and labeled)
- Training approach: custom YOLO training and tuned inference
- Runtime model artifact: project YOLO weights

### 3.2 Pricing Data
- Consolidated pricing table by vehicle company, model, and damage category
- Fallback logic when exact rows are unavailable:
  - exact model price
  - brand-level price
  - generic category price

### 3.3 Operational Data
- Claim records, scores, and outputs in Supabase database
- Original and annotated images in Supabase object storage

<div style="page-break-after: always;"></div>

## 4. Methodology
### 4.1 End-to-End Pipeline
1. User submits claim details and photos.
2. YOLO performs detection and returns classes/confidences.
3. Damage entries are aggregated by category and quantity.
4. Severity score is calculated.
5. Fraud risk score is calculated.
6. Cost engine computes category-wise totals.
7. Results are persisted and returned to UI/report.

### 4.2 Severity Scoring Formula
Severity score per category:

Severity = 100 × (0.45 × area_ratio + 0.30 × confidence + 0.25 × quantity_norm)

Where:
- quantity_norm = min(quantity / 5, 1.0)
- terms are clamped to the range [0, 1]

Severity bands:
- 0–29: Minor
- 30–59: Moderate
- 60–79: Severe
- 80–100: Critical

### 4.3 Fraud Scoring Formula
Fraud score:

Fraud = 100 × (0.50 × reuse_score + 0.30 × ai_gen_score + 0.20 × metadata_anomaly)

Fraud bands:
- 0–24: Low
- 25–49: Medium
- 50–74: High
- 75–100: Critical

### 4.4 Cost Estimation Formula
For each damage category:

Row Total = unit_repair_cost × quantity

Claim Total = sum of all row totals

<div style="page-break-after: always;"></div>

## 5. Solution Architecture Summary
- Frontend: React + TypeScript + Vite
- Backend: FastAPI orchestration service
- AI layer: custom YOLO detector + explanation service
- Data layer: Supabase Postgres + Storage
- Outputs: annotated media, severity/fraud analytics, cost breakdown, decision support

## 6. Validation Plan
### 6.1 Detection Quality
- Metrics: Precision, Recall, mAP@50
- Method: held-out labeled validation split

### 6.2 Cost Accuracy
- Compare predicted estimate vs workshop reference
- Metrics: MAE and MAPE by category

### 6.3 Fraud Utility
- Evaluate high-risk detection on suspicious test set
- Metrics: precision, recall, and threshold behavior

### 6.4 Operational Metrics
- Time from submission to complete output
- Percentage of claims escalated for manual review
- Consistency of severity outputs on similar damage patterns

## 7. Results Section (Fill Before Submission)
Add your latest measurable numbers here:

| Metric | Value | Notes |
|---|---:|---|
| mAP@50 | TBD | Validation set |
| Precision | TBD | Detection |
| Recall | TBD | Detection |
| Avg processing time | TBD | Per claim |
| Cost MAPE | TBD | Against reference quotes |

<div style="page-break-after: always;"></div>

## 8. Business Impact
- Faster triage and reduced manual workload
- Standardized evidence-backed assessments
- Improved fraud awareness in digital claims
- Higher transparency for customer communication

## 9. Limitations
- Exterior image-only inference cannot detect internal mechanical damage
- Low-light/blurred photos may reduce confidence
- Fraud score is assistive and should include human review for high-risk cases

## 10. Future Scope
- Repair-vs-replace decision engine
- Confidence-based automatic human escalation
- Policy-aware payout logic (deductible, coverage limits, depreciation)
- Deepfake/manipulation detection model integration
- Repair-shop recommendation and time-to-repair prediction

## 11. Conclusion
ClaimIQ demonstrates a deployable AI approach to motor-claim pre-approval by combining vision detection, explainable scoring, and pricing intelligence into one insurer-ready workflow. It improves processing speed, consistency, and operational transparency while preserving human oversight for high-risk decisions.

## References
1. Ultralytics YOLO Documentation — https://docs.ultralytics.com/
2. Supabase Documentation — https://supabase.com/docs
3. Label Studio Documentation — https://labelstud.io/guide/
4. Roboflow Universe — https://universe.roboflow.com/

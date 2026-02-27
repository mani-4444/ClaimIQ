# ClaimIQ Research Document

## Project
- **Title:** ClaimIQ — AI-Powered Motor Claim Pre-Approval
- **Event:** Hack With AI 2026
- **Team:** _Add team name_
- **Date:** _28 Feb 2026_

---

## 1. Abstract
ClaimIQ is an AI-assisted insurance workflow that automates motor-claim pre-assessment from uploaded damage images. It combines a custom YOLO model for damage detection, explainable severity and fraud scoring, and vehicle-model-aware repair cost estimation in INR. The platform produces structured outputs for claim handlers: damage categories, confidence, severity band, fraud risk band, and itemized cost breakdown. This reduces manual inspection delays, improves consistency, and supports faster triage with transparent AI-backed decision signals.

---

## 2. Problem Statement
Manual motor-claim assessment is slow, subjective, and vulnerable to fraud (duplicate or manipulated evidence). Existing workflows often lack:
- rapid objective damage quantification,
- standardized risk scoring,
- transparent pricing logic,
- evidence-linked claim outputs.

ClaimIQ addresses these gaps with an end-to-end AI claims pipeline.

---

## 3. Objectives
1. Detect and classify visual damage from claim photos.
2. Quantify damage severity with a reproducible score.
3. Estimate repair costs using company/model/damage pricing.
4. Flag fraud risk using multiple authenticity signals.
5. Deliver explainable outputs in insurer-ready format.

---

## 4. Data and Model Preparation
### 4.1 Damage Dataset
- Source: Roboflow Universe (car damage dataset)
- Curation: Label review and mapping to business-facing categories
- Training: Custom YOLO training; deployed weights in project model path

### 4.2 Pricing Dataset
- Consolidated CSV pricing source merged by damage category
- Runtime lookup path:
  1. Exact match `(vehicle_company, vehicle_model, damage_type)`
  2. Brand-level fallback
  3. Generic damage-type fallback

### 4.3 Claim Data Store
- Supabase stores claim entities, analysis outputs, and scoring metadata
- Object storage stores original and YOLO-annotated images

---

## 5. System Methodology
### 5.1 Processing Pipeline
1. User submits claim (vehicle + images).
2. YOLO detects damage classes, boxes, confidence.
3. Damage service aggregates by category + quantity.
4. Vision explanation service produces detailed rationale.
5. Cost service computes quantity-based totals.
6. Fraud service computes weighted fraud risk.
7. Decision output is persisted and shown in UI.

### 5.2 Severity Scoring
Severity per damage category is computed as:

$$
severity = 100 \times (0.45 \cdot area\_ratio + 0.30 \cdot confidence + 0.25 \cdot quantity\_norm)
$$

where $quantity\_norm = \min(quantity/5, 1.0)$.

Bands:
- 0–29: Minor
- 30–59: Moderate
- 60–79: Severe
- 80–100: Critical

### 5.3 Fraud Risk Scoring
Fraud risk is computed as:

$$
fraud = 100 \times (0.50 \cdot reuse\_score + 0.30 \cdot ai\_gen\_score + 0.20 \cdot metadata\_anomaly)
$$

Bands:
- 0–24: Low
- 25–49: Medium
- 50–74: High
- 75–100: Critical

### 5.4 Cost Estimation
For each detected damage type:

$$
row\_total = unit\_repair\_cost \times quantity
$$

Final estimate:

$$
claim\_total = \sum row\_total
$$

No parts/labor split is exposed; output is merged unit repair cost for clarity.

---

## 6. Solution Architecture Summary
- **Frontend:** React + TypeScript + Vite
- **Backend:** FastAPI orchestration layer
- **ML:** Custom YOLO detector + structured vision explanation service
- **Data:** Supabase Postgres + Storage
- **Outputs:** annotated images, severity/fraud scores, cost breakdown, decision-ready summary

(See detailed architecture diagram in `docs/solution-architecture.md`.)

---

## 7. Experimental Validation Plan
### 7.1 Detection Quality
- Metrics: Precision, Recall, mAP@50
- Validation: held-out labeled damage set

### 7.2 Cost Accuracy
- Compare estimated totals with reference repair quotes
- Metrics: MAE / MAPE by damage category

### 7.3 Fraud Signal Utility
- Evaluate high-risk flag precision on known suspicious samples
- Analyze threshold behavior for false positives/false negatives

### 7.4 Operational KPIs
- Claim processing time per submission
- % claims requiring manual escalation
- Consistency of severity bands across similar samples

---

## 8. Business Impact
- Faster claim triage and lower assessor effort
- Standardized, explainable outputs for underwriting and operations
- Improved fraud awareness in digital-first claims
- Better customer trust through transparent cost logic

---

## 9. Limitations
- External-only image analysis cannot assess hidden structural damage
- Low-quality images can reduce detection certainty
- Fraud score is assistive and should complement human review
- Pricing quality depends on pricing-table coverage and freshness

---

## 10. Future Scope
- Repair-vs-replace recommendation engine
- Confidence-based human escalation routing
- Policy-aware payout logic (deductible/coverage/depreciation)
- Deepfake/manipulation classifier integration
- Repair-shop recommendation and time-to-repair prediction

---

## 11. Conclusion
ClaimIQ demonstrates a practical AI insurance solution that transforms raw visual evidence into explainable operational decisions. By combining custom computer vision, weighted risk analytics, and model-specific cost estimation, it improves speed, consistency, and trust in motor-claim pre-approval.

---

## 12. References
1. Ultralytics YOLO Documentation — https://docs.ultralytics.com/
2. Supabase Documentation — https://supabase.com/docs
3. Label Studio Documentation — https://labelstud.io/guide/
4. Roboflow Universe (car damage datasets) — https://universe.roboflow.com/

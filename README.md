# ClaimIQ

AI-powered motor claim pre-approval system with FastAPI backend, React frontend, Supabase storage/database, and custom YOLO-based damage detection.

## Repository structure

- `backend/` – FastAPI APIs, ML pipeline, claim processing
- `frontend/` – React + Vite UI
- `model/` – custom YOLO model files (`my_model.pt`)

---

## Backend details

- Framework: **FastAPI** (`backend/app/main.py`)
- Runtime: Python **3.11** recommended for ML dependencies
- Core API routes: `backend/app/api/v1/`
	- `auth.py` – login/register/profile
	- `claims.py` – create/list/get/process/report
- Service pipeline (`backend/app/services/claim_service.py`):
	1. Damage detection (YOLO)
	2. Vision explanation
	3. Cost estimation
	4. Fraud analysis
	5. Decisioning
	6. Persistence
- ML components:
	- `backend/app/ml/yolo_detector.py` – custom YOLO model inference + annotated outputs
	- `backend/app/ml/clip_embedder.py` – optional CLIP fraud similarity
- Storage/DB:
	- Supabase Storage bucket `claim-images`
	- Supabase Postgres tables (`claims`, `cost_table`, `fraud_history`)

---

## Frontend details

- Framework: **React + TypeScript + Vite**
- Default dev URL: `http://localhost:3000`
- UI and routing:
	- App routes in `frontend/src/App.tsx`
	- Claim detail page in `frontend/src/pages/claims/ClaimDetailPage.tsx`
- API/state layers:
	- API client: `frontend/src/lib/api.ts`
	- Claims state: `frontend/src/store/claimsStore.ts`
- Claim analysis UX:
	- Click **Run AI Analysis** in claim detail page
	- Processed claim returns updated `image_urls`
	- Photos tab shows YOLO-annotated images

---

## Frontend ↔ Backend connection

- Frontend dev server runs on: `http://localhost:3000`
- Backend API runs on: `http://127.0.0.1:8000`
- Vite proxy is configured in `frontend/vite.config.ts`:
	- `/api` → `http://localhost:8000`
- Frontend API base in `frontend/src/lib/api.ts` is:
	- `API_BASE = "/api/v1"`

### Request flow example

1. Frontend calls `fetch("/api/v1/claims/{id}/process")`
2. Vite proxy forwards to backend `http://localhost:8000/api/v1/claims/{id}/process`
3. Backend processes claim and returns processed payload
4. Frontend store updates claim state and UI

### Connection checklist

- Backend health endpoint: `http://127.0.0.1:8000/health`
- Frontend page: `http://localhost:3000`
- If API calls fail in frontend, verify:
	- backend is running on port `8000`,
	- frontend is running on port `3000`,
	- `frontend/vite.config.ts` proxy target remains `http://localhost:8000`.

---

## Local run (recommended)

### Backend (Python 3.11)

Because ML dependencies are compatible with Python 3.11, use a 3.11 venv for backend:

```powershell
cd ClaimIQ/backend
py -3.11 -m venv .venv311
.\.venv311\Scripts\python.exe -m pip install --upgrade pip
.\.venv311\Scripts\python.exe -m pip install -r requirements.txt
.\.venv311\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Health check:

- `http://127.0.0.1:8000/health`

### Frontend

```powershell
cd ClaimIQ/frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:3000`

---

## End-to-end test flow

1. Login/Register in frontend.
2. Create a claim and upload damage image(s).
3. Open claim details and click **Run AI Analysis**.
4. Verify:
	 - claim status updates to processed,
	 - photos tab displays YOLO-annotated images,
	 - damage zones/costs/decision are populated.

---

## Notes

- CLIP fraud-image similarity may be unavailable unless CLIP is installed (`No module named 'clip'` warning). This does **not** block YOLO damage detection.
- If port conflicts occur, free ports `8000` (backend) and `3000` (frontend) before restart.

---

## Custom model integration (latest updates)

This section summarizes all custom YOLO integration changes and is intentionally placed at the end.

### Model provenance

- Model type: **YOLOv11**
- Annotation workflow: **Label Studio**
- Dataset: **Roboflow Universe – Car Damage Dataset v3**
	- https://universe.roboflow.com/minim/car-damage-dn9sl/dataset/3

### Model configuration

Set these in `backend/.env`:

```env
YOLO_MODEL_PATH=../model/my_model.pt
YOLO_WEIGHTS_DIR=../model/train/weights
```

Expected model file location:

- `ClaimIQ/model/my_model.pt`

### Backend behavior

- YOLO loads from `YOLO_MODEL_PATH` first.
- If `YOLO_MODEL_PATH` is empty, backend searches `YOLO_WEIGHTS_DIR` for `best.pt`, `last.pt`, or any `.pt` file.
- On misconfiguration, backend raises a clear file-not-found configuration error.

### Processed image output update

- On **Run AI Analysis**, backend now:
	1. runs YOLO inference,
	2. renders annotated detection overlays,
	3. uploads processed images to Supabase storage,
	4. updates claim `image_urls` with YOLO-result image URLs.
- Frontend claim photos tab displays these processed result images after analysis.

### Additional stability fixes

- Shared button default set to `type="button"` to prevent accidental page reload on analysis actions.
- YOLO inference logs now explicitly show model path and detection counts per request.
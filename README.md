# VisionCart AI — Smart Checkout & Inventory Management System

VisionCart AI is a smart retail checkout and inventory management application combining a React + Vite frontend with a FastAPI computer vision backend and Supabase product lookup. Product detection uses a fine-tuned **YOLOv8n** object detection model trained on a custom **69-class grocery product dataset**, while pricing and discounts are fetched dynamically from Supabase.

## Live Deployment
- **Frontend (Vercel):** [Open VisionCart AI Live](https://vision-smart-ai-retail-checkout-sys-mauve.vercel.app)
- - To test the UI with a sample conveyor belt input image, open the [testing_images](https://github.com/izmawarsia/vision_smart_ai_retail_checkout_system/tree/main/testing_images) folder in this repository and download an image to upload.
- **Backend API (Vercel):** [Backend API](https://vision-smart-ai-retail-checkout-sys.vercel.app) ([Swagger Docs]( https://vision-smart-ai-retail-checkout-sys.vercel.app/docs))

## Model & Dataset Overview
- **Primary Inference Model:** **YOLOv8n** (`yolov8n.pt` exported to `backend/best.onnx` for lightweight production inference)
- **Dataset:** Custom **69-class grocery product dataset** annotated in YOLO format (`data.yaml` + train/val splits)
- **Comparative / Baseline Experiments:** ResNet-50 (`resnet50_grocery.pth`) and MobileNetV3 (`mobilenet_v3_grocery.pth`) checkpoints preserved in the Google Drive archive

## Dataset, Training & Project Archive (Google Drive)
Because the complete dataset and model artifacts (~1.6 GB) exceed GitHub's single-file size limit, the full training workspace (`Grocery_CCP_Project`) is hosted on Google Drive:
- **Google Drive Link:** [Grocery_CCP_Project Drive Folder](https://drive.google.com/drive/folders/1fWfCmHFDeWh6yyVVbiZ8uNpNR9RkkUDF?usp=sharing)

### Google Drive Folder Structure (`Grocery_CCP_Project/`)
```text
Grocery_CCP_Project/
├── yolo_runs/                  # YOLOv8n training logs, metrics, confusion matrices & best weights
├── yolo_dataset/               # YOLO-formatted images and label files (train/val splits)
├── raw_grocery_data/           # Original raw product images before preprocessing/splitting
├── dataset_metadata/           # Class mappings, product metadata & dataset notes
├── resnet50_grocery.pth        # Trained ResNet-50 baseline model weights (90.5 MB)
├── mobilenet_v3_grocery.pth    # Trained MobileNetV3 baseline model weights (16.6 MB)
└── data.yaml                   # Dataset configuration file defining paths and 69 product classes
```

## Repository Structure
```text
vision_smart_ai_retail_checkout_system/
├── backend/                    # FastAPI server, ONNX inference (best.onnx) & Supabase integration
├── public/                     # Static frontend assets
├── src/                        # React + Vite frontend application
├── index.html                  # Frontend entry HTML
├── package.json                # Frontend dependencies and scripts
├── vite.config.js              # Vite configuration & local dev proxy
├── vercel.json                 # Vercel SPA routing configuration
└── README.md                   # Project documentation
```

## Requirements
- **Node.js** 18+
- **Python** 3.10+
- Active internet connection for **Supabase** product and pricing lookup

## Local Setup

### 1. Start the AI Backend
Open a terminal in the project directory:

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API runs at `http://127.0.0.1:8000` (check `http://127.0.0.1:8000/` to verify).

### 2. Start the Frontend
Open a second terminal in the frontend root directory:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. During local development, Vite proxies `/scan-item` and `/generate-bill` requests to `http://127.0.0.1:8000`. For production builds on Vercel, configure `VITE_API_URL` to point to the hosted backend URL.

## Checkout Flow
1. Open the live checkout page (**Try It Live** or `/live`).
2. Upload a single product image and click **Scan Product**.
3. Detected items are added to the basket; scanning an already-detected class increments its quantity.
4. Click **Confirm items & generate bill** to fetch product prices and discounts from the Supabase `Products` table.
5. A **5% tax** is applied to the discounted subtotal to calculate the final payable amount.
6. Choose **Cash** or **Card** and confirm. This payment step is a **demo-only simulation** (no real charges, payment gateway integration, or bank data collection) and resets afterward for the next checkout.

## Notes & Limitations
- Model inference supports the **69 product classes** configured in `backend/main.py` and `data.yaml`.
- If a detected class has no matching record in Supabase, its price defaults to `0` rather than using a fallback mock price.
- Keep API keys, environment variables (`.env`), and database credentials secure—never commit secret keys directly to public repositories.
````[cite: 3]

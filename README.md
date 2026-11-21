# VisionCart AI — Integrated Project

This folder combines the original VisionCart AI frontend with the supplied trained AI backend. Product classes, model inference, and product prices come from the supplied `backend/main.py`, `backend/best.onnx`, and its Supabase connection. The frontend does not use a mock product catalogue or mock prices.

## Requirements
- Node.js 18+
- Python 3.10+
- A working internet connection for the Supabase product lookup

## 1. Start the AI backend
Open a terminal in this `visioncart-ai` folder:

```bash
cd backend
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`. You can check it at `http://127.0.0.1:8000/`.

## 2. Start the frontend
Open a second terminal in the `visioncart-ai` folder:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies image scans and bill requests to the FastAPI backend on port 8000.

## Checkout flow
1. Click **Try It Live**.
2. Upload one product image from your computer and click **Scan Product**.
3. Each successful scan is added to the basket. Scanning the same trained class again increases its quantity.
4. Click **Confirm items & generate bill**. The backend retrieves prices and discounts from the supplied Supabase `Products` table.
5. The backend adds a flat **5% tax** to the discounted subtotal and returns the bill.
6. Select Cash or Card and confirm. This is a **demo-only payment confirmation**; it does not charge a card, connect to a payment gateway, or collect bank details. After the success message, the checkout resets for the next customer.

## Important
- The model only recognizes the 69 classes listed in `backend/main.py`.
- Prices are sourced from Supabase. If a class has no matching database row, its price remains zero rather than inventing a price.
- The supplied backend's Supabase credentials are kept as supplied. Protect and rotate credentials if this project is deployed publicly.
- For production deployment, configure the frontend proxy/API base URL for your hosted backend and secure the API and database credentials.

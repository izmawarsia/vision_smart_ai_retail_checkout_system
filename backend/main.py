from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from PIL import Image
from collections import Counter
from pydantic import BaseModel
from typing import List
import onnxruntime as ort
import numpy as np
import io
import os

app = FastAPI(title="Smart Grocery Checkout API (YOLOv8 ONNX + Supabase)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exact 69 Trained Classes from your Colab YOLOv8 Model (Index 0 to 68)
CLASS_NAMES = [
    'Alpro-Blueberry-Soyghurt', 'Alpro-Fresh-Soy-Milk', 'Alpro-Shelf-Soy-Milk',
    'Alpro-Vanilla-Soyghurt', 'Arla-Ecological-Medium-Fat-Milk', 'Arla-Ecological-Sour-Cream',
    'Arla-Lactose-Medium-Fat-Milk', 'Arla-Medium-Fat-Milk', 'Arla-Mild-Vanilla-Yoghurt',
    'Arla-Natural-Mild-Low-Fat-Yoghurt', 'Arla-Natural-Yoghurt', 'Arla-Sour-Cream',
    'Arla-Sour-Milk', 'Arla-Standard-Milk', 'Bakeparlor-Suji', 'Barley-Porridge',
    'Black-Olives', 'BornVita', 'BornVita-5star-magic', 'Bravo-Apple-Juice',
    'Bravo-Orange-Juice', 'Chicken-Soup-Stock', 'Dayfresh-Strawberry-Yougurt',
    'Dorritos', 'Fizz-drink', 'Garant-Ecological-Medium-Fat-Milk',
    'Garant-Ecological-Standard-Milk', 'God-Morgon-Apple-Juice', 'God-Morgon-Orange-Juice',
    'God-Morgon-Orange-Red-Grapefruit-Juice', 'God-Morgon-Red-Grapefruit-Juice',
    'IFFCO- IVY - soap', 'Imli-Sauce', 'Knorr-ChattPatta-Instant-Noodles', 'Lays',
    'LemonMax-DishWashbar', 'MEC brightening - facewash', 'Marhaba-Quince',
    'Mayo-Garlic-Sauce', "Mitchell's-Strawberry-Jam", 'Mountain-dew',
    'Nescafe classic - coffee', 'Oatly-Natural-Oatghurt', 'Oatly-Oat-Milk', 'Oats',
    'Olpers-Milk', 'PalmoliveNaturals-Shampoo', 'Red-bull', 'Red-bull-yellow edition',
    'Red-wine', 'RosePetal-Tissue', 'Shangrila-Chilli-Sause', 'Tapal-Danedar-Tea',
    'Tropicana-Apple-Juice', 'Tropicana-Golden-Grapefruit', 'Tropicana-Juice-Smooth',
    'Tropicana-Mandarin-Morning', 'Valio-Vanilla-Yoghurt', 'Vaseline',
    'Yoggi-Strawberry-Yoghurt', 'Yoggi-Vanilla-Yoghurt', 'boost', 'capri- soap',
    'colgate-herbal', 'colgate-maxfresh', 'ferrero rocher',
    'palmolive naturals- soap- 3 in 1', 'protinex', 'skin white VitaminB3 - facewash'
]

# Load your trained YOLOv8 model (exported as best.onnx)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.onnx")
session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
input_name = session.get_inputs()[0].name

from dotenv import load_dotenv

load_dotenv()

# Supabase Connection (Table: "Products")
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def run_onnx_yolo(pil_img: Image.Image, conf_thresh: float = 0.50):
    img_resized = pil_img.resize((640, 640))
    img_np = np.array(img_resized, dtype=np.float32) / 255.0
    img_chw = np.transpose(img_np, (2, 0, 1))
    input_tensor = np.expand_dims(img_chw, axis=0)

    outputs = session.run(None, {input_name: input_tensor})[0]  # (1, 73, 8400)
    preds = np.squeeze(outputs).T  # (8400, 73) -> 4 box coords + 69 class scores

    class_scores = preds[:, 4:]
    max_scores = np.max(class_scores, axis=1)
    class_ids = np.argmax(class_scores, axis=1)

    best_idx = int(np.argmax(max_scores))
    best_score = float(max_scores[best_idx])
    best_cls_id = int(class_ids[best_idx])

    if best_score < conf_thresh:
        return None, best_score

    return CLASS_NAMES[best_cls_id], best_score


@app.get("/")
def health_check():
    return {
        "status": "online",
        "model": "Custom-YOLOv8-69Classes (best.onnx)",
        "database": "Supabase Connected"
    }


@app.post("/scan-item")
async def scan_item(file: UploadFile = File(...), conf: float = 0.50):
    image_bytes = await file.read()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    detected_class, score = run_onnx_yolo(img, conf_thresh=conf)

    if detected_class is None:
        return {
            "detected": False,
            "confidence": round(score, 2),
            "message": "Product not clearly detected. Please align the front label towards the camera."
        }

    return {
        "detected": True,
        "class_name": detected_class,
        "confidence": round(score, 2)
    }


class OrderRequest(BaseModel):
    scanned_items: List[str]


@app.post("/generate-bill")
def generate_bill(order: OrderRequest):
    counts = Counter(order.scanned_items)
    bill_items = []
    subtotal = 0.0
    total_tax = 0.0
    total_discount = 0.0

    for class_name, qty in counts.items():
        response = supabase.table("Products").select("*").eq("class_name", class_name).execute()

        if response.data:
            prod = response.data[0]
            unit_price = float(prod["price"])
            tax_pct = 5.0
            disc_pct = float(prod.get("discount_percent", 0.0))
            display_name = prod.get("display_name", class_name)
        else:
            unit_price, tax_pct, disc_pct, display_name = 0.0, 5.0, 0.0, class_name

        item_total = unit_price * qty
        item_disc = item_total * (disc_pct / 100.0)
        item_tax = (item_total - item_disc) * (tax_pct / 100.0)

        subtotal += item_total
        total_discount += item_disc
        total_tax += item_tax

        bill_items.append({
            "class_name": class_name,
            "display_name": display_name,
            "quantity": qty,
            "unit_price": unit_price,
            "discount_percent": disc_pct,
            "tax_percent": tax_pct,
            "line_total": round(item_total - item_disc + item_tax, 2)
        })

    grand_total = round(subtotal - total_discount + total_tax, 2)

    return {
        "items": bill_items,
        "subtotal": round(subtotal, 2),
        "total_discount": round(total_discount, 2),
        "total_tax": round(total_tax, 2),
        "tax_percent": 5.0,
        "grand_total": grand_total
    }
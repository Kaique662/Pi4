"""Acesso ao MongoDB do BlackWear (somente leitura) e regras de negócio do dashboard."""
import json
import os
from pathlib import Path

import bcrypt
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient

ROOT = Path(__file__).resolve().parent
# Usa DASHBOARD/.env se existir; senão reaproveita o .env do backend (mesmo banco).
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent / "BACKEND" / ".env")

TZ = "America/Sao_Paulo"
# Pedidos que contam como venda (pagamento confirmado).
SOLD_STATUSES = ["paid", "shipped", "delivered"]
ADMIN_ROLES = {"admin", "adm", "administrator"}

STATUS_LABELS = {
    "pending": "Aguardando pagamento",
    "paid": "Pago",
    "shipped": "Enviado",
    "delivered": "Entregue",
    "canceled": "Cancelado",
}
METHOD_LABELS = {"pix": "PIX", "card": "Cartão", "boleto": "Boleto"}

_client = None


def get_db():
    global _client
    uri = os.getenv("MONGO_URI")
    if not uri:
        raise RuntimeError("MONGO_URI não encontrado. Configure BACKEND/.env ou DASHBOARD/.env.")
    if _client is None:
        _client = MongoClient(uri, serverSelectionTimeoutMS=8000, tz_aware=True)
    return _client.get_default_database("blackwear")


def authenticate(email, password):
    """Devolve (usuario, erro). Mesma regra do back-end: bcrypt + papel administrativo."""
    user = get_db().users.find_one({"email": (email or "").strip().lower()})
    try:
        valid = bool(user) and bcrypt.checkpw((password or "").encode(), str(user.get("password", "")).encode())
    except ValueError:
        valid = False
    if not valid:
        return None, "E-mail ou senha inválidos."
    if str(user.get("role", "")).strip().lower() not in ADMIN_ROLES:
        return None, "Acesso restrito a administradores."
    return {"name": user.get("name", ""), "email": user["email"]}, None


def _frame(docs, cols):
    df = pd.DataFrame(list(docs)).reindex(columns=cols)
    for c in cols:
        if c == "_id" or c.endswith("Id"):
            df[c] = df[c].astype("string")
    if "createdAt" in cols:
        df["createdAt"] = pd.to_datetime(df["createdAt"], utc=True).dt.tz_convert(TZ)
    return df


def load_data():
    db = get_db()
    orders = _frame(
        db.orders.find({}, {"userId": 1, "status": 1, "totalPrice": 1, "paymentMethod": 1, "createdAt": 1}),
        ["_id", "userId", "status", "totalPrice", "paymentMethod", "createdAt"],
    )
    items = _frame(
        db.orderitems.find({}, {"orderId": 1, "productId": 1, "name": 1, "price": 1, "quantity": 1}),
        ["_id", "orderId", "productId", "name", "price", "quantity"],
    )
    products = _frame(
        db.products.find({}, {"name": 1, "category": 1, "stock": 1, "minimumStock": 1, "isActive": 1}),
        ["_id", "name", "category", "stock", "minimumStock", "isActive"],
    )
    users = _frame(
        db.users.find({}, {"name": 1, "email": 1, "role": 1, "createdAt": 1}),
        ["_id", "name", "email", "role", "createdAt"],
    )
    return _normalize(orders, items, products, users)


def load_json(raw):
    """Lê o arquivo gerado pelo botão "Exportar dados (JSON)" do app (rota /api/reports/export)."""
    doc = json.loads(raw)
    if doc.get("source") != "BlackWear" or "orders" not in doc:
        raise ValueError("Este arquivo não é uma exportação do app BlackWear.")
    orders = _frame(
        ({"_id": o["id"], "userId": o.get("customerId"), "status": o.get("status"), "totalPrice": o.get("totalPrice"),
          "paymentMethod": o.get("paymentMethod"), "createdAt": o.get("createdAt")} for o in doc["orders"]),
        ["_id", "userId", "status", "totalPrice", "paymentMethod", "createdAt"],
    )
    items = _frame(
        ({"orderId": o["id"], **i} for o in doc["orders"] for i in o.get("items", [])),
        ["_id", "orderId", "productId", "name", "price", "quantity"],
    )
    products = _frame(
        ({"_id": p["id"], **p} for p in doc.get("products", [])),
        ["_id", "name", "category", "stock", "minimumStock", "isActive"],
    )
    # Clientes vêm anonimizados no JSON: sem nome nem e-mail.
    users = _frame(
        ({"_id": c["id"], "role": "user", "createdAt": c.get("createdAt")} for c in doc.get("customers", [])),
        ["_id", "name", "email", "role", "createdAt"],
    )
    return _normalize(orders, items, products, users), doc.get("generatedAt")


def _normalize(orders, items, products, users):
    orders["totalPrice"] = pd.to_numeric(orders["totalPrice"], errors="coerce").fillna(0.0)
    items["price"] = pd.to_numeric(items["price"], errors="coerce").fillna(0.0)
    items["quantity"] = pd.to_numeric(items["quantity"], errors="coerce").fillna(0).astype(int)
    items["revenue"] = items["price"] * items["quantity"]
    products["stock"] = pd.to_numeric(products["stock"], errors="coerce").fillna(0).astype(int)
    products["minimumStock"] = pd.to_numeric(products["minimumStock"], errors="coerce").fillna(5).astype(int)
    products["category"] = products["category"].fillna("").replace("", "Sem categoria")
    return orders, items, products, users


def in_period(df, start, end):
    """Filtra por createdAt entre as datas start e end (inclusive, horário de Brasília)."""
    if df.empty:
        return df
    d = df["createdAt"].dt.date
    return df[(d >= start) & (d <= end)]


def brl(value):
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

"""Dashboard de vendas do BlackWear (Streamlit). Rode com: streamlit run app.py"""
from datetime import timedelta

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

import data
from data import METHOD_LABELS, SOLD_STATUSES, STATUS_LABELS, TZ, brl

# Paleta (fundo claro): uma cor de série, tinta e linhas discretas.
SERIES = "#2a78d6"
SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK_2 = "#52514e"
MUTED = "#898781"
GRID = "#e1e0d9"
AXIS = "#c3c2b7"
FONT = "system-ui, -apple-system, Segoe UI, sans-serif"

st.set_page_config(page_title="BlackWear · Dashboard", page_icon="🖤", layout="wide")


@st.cache_data(ttl=60, show_spinner="Carregando dados do banco...")
def load_data():
    return data.load_data()


def style(fig, horizontal=False, height=320):
    fig.update_layout(
        height=height,
        margin=dict(l=8, r=40 if horizontal else 8, t=8, b=8),
        paper_bgcolor=SURFACE,
        plot_bgcolor=SURFACE,
        font=dict(family=FONT, color=INK_2, size=12),
        showlegend=False,
        bargap=0.35,
        hoverlabel=dict(bgcolor="#ffffff", bordercolor=GRID, font=dict(family=FONT, color=INK)),
    )
    value_axis = dict(gridcolor=GRID, zeroline=False, tickfont_color=MUTED, title=None)
    category_axis = dict(showgrid=False, linecolor=AXIS, zeroline=False, tickfont_color=INK_2, title=None)
    if horizontal:
        fig.update_xaxes(**value_axis)
        fig.update_yaxes(**category_axis, autorange="reversed")
    else:
        fig.update_xaxes(**category_axis)
        fig.update_yaxes(**value_axis)
    return fig


def hbar(labels, values, text, hover):
    fig = go.Figure(go.Bar(
        x=values, y=labels, orientation="h",
        marker=dict(color=SERIES, cornerradius=4),
        text=text, textposition="outside", textfont=dict(color=INK_2), cliponaxis=False,
        customdata=hover, hovertemplate="%{customdata}<extra></extra>",
    ))
    return style(fig, horizontal=True, height=max(160, 46 * len(labels) + 40))


def empty(msg="Sem dados no período."):
    st.caption(msg)


# ---------- Entrada: banco ao vivo (login de admin) ou arquivo JSON exportado pelo app ----------
if "admin" not in st.session_state and "json_file" not in st.session_state:
    st.title("BlackWear · Dashboard")
    tab_db, tab_json = st.tabs(["Banco de dados (ao vivo)", "Arquivo JSON do app"])
    with tab_db:
        st.caption("Entre com uma conta de administrador do app.")
        with st.form("login"):
            email = st.text_input("E-mail")
            password = st.text_input("Senha", type="password")
            submitted = st.form_submit_button("Entrar", type="primary")
        if submitted:
            try:
                admin, error = data.authenticate(email, password)
            except Exception as e:
                admin, error = None, f"Não foi possível conectar ao banco: {e}"
            if error:
                st.error(error)
            else:
                st.session_state.admin = admin
                st.rerun()
    with tab_json:
        st.caption("No app, vá em Minha conta → Gerenciar produtos → Exportar dados (JSON) e envie o arquivo aqui.")
        uploaded = st.file_uploader("Arquivo .json", type="json")
        if uploaded:
            try:
                data.load_json(uploaded.getvalue())
            except Exception as e:
                st.error(f"Arquivo inválido: {e}")
            else:
                st.session_state.json_file = {"name": uploaded.name, "raw": uploaded.getvalue()}
                st.rerun()
    st.stop()

from_json = "json_file" in st.session_state

# ---------- Cabeçalho e filtros ----------
top_l, top_r = st.columns([4, 1])
top_l.title("Vendas BlackWear")
try:
    if from_json:
        (orders, items, products, users), generated_at = data.load_json(st.session_state.json_file["raw"])
        generated = pd.Timestamp(generated_at).tz_convert(TZ)
        top_l.caption(f"Fonte: {st.session_state.json_file['name']} · exportado em {generated:%d/%m/%Y %H:%M}.")
    else:
        orders, items, products, users = load_data()
        top_l.caption(f"Olá, {st.session_state.admin['name']}. Fonte: banco ao vivo, atualizado a cada minuto.")
except Exception as e:
    st.error(f"Erro ao ler os dados: {e}")
    st.stop()
with top_r:
    if not from_json and st.button("Atualizar agora", width="stretch"):
        load_data.clear()
        st.rerun()
    if st.button("Trocar arquivo" if from_json else "Sair", width="stretch"):
        st.session_state.pop("admin", None)
        st.session_state.pop("json_file", None)
        st.rerun()

# No arquivo JSON, "hoje" é a data da exportação, para os períodos baterem com os dados.
today = generated.date() if from_json else pd.Timestamp.now(tz=TZ).date()
first_day = orders["createdAt"].min().date() if not orders.empty else today
presets = {
    "Últimos 7 dias": (today - timedelta(days=6), today),
    "Últimos 30 dias": (today - timedelta(days=29), today),
    "Últimos 90 dias": (today - timedelta(days=89), today),
    "Este mês": (today.replace(day=1), today),
    "Todo o período": (min(first_day, today), today),
}
f1, f2, _ = st.columns([1, 1, 2])
preset = f1.selectbox("Período", [*presets, "Personalizado"], index=1)
if preset == "Personalizado":
    picked = f2.date_input("Datas", value=presets["Últimos 30 dias"], max_value=today, format="DD/MM/YYYY")
    start, end = (picked if len(picked) == 2 else (picked[0], picked[0]))
else:
    start, end = presets[preset]

period_orders = data.in_period(orders, start, end)
sold = period_orders[period_orders["status"].isin(SOLD_STATUSES)]
sold_items = items[items["orderId"].isin(sold["_id"])]

# Período anterior de mesmo tamanho, para comparação nos indicadores.
span = (end - start).days + 1
prev_orders = data.in_period(orders, start - timedelta(days=span), start - timedelta(days=1))
prev_sold = prev_orders[prev_orders["status"].isin(SOLD_STATUSES)]


def delta(current, previous, money=False):
    if preset == "Todo o período" or previous == 0:
        return None
    diff = current - previous
    pct = diff / previous * 100
    return f"{brl(diff) if money else f'{diff:+.0f}'} ({pct:+.0f}%)"


# ---------- Indicadores ----------
revenue = float(sold["totalPrice"].sum())
prev_revenue = float(prev_sold["totalPrice"].sum())
n_sold = len(sold)
customers = users[users["role"].fillna("user").str.lower() == "user"]

k = st.columns(5)
k[0].metric("Faturamento", brl(revenue), delta(revenue, prev_revenue, money=True))
k[1].metric("Pedidos pagos", n_sold, delta(n_sold, len(prev_sold)))
k[2].metric("Ticket médio", brl(revenue / n_sold) if n_sold else "—")
k[3].metric("Aguardando pagamento", int((period_orders["status"] == "pending").sum()))
k[4].metric("Novos clientes", len(data.in_period(customers, start, end)))

st.divider()

# ---------- Faturamento ao longo do tempo ----------
st.subheader("Faturamento")
days = pd.date_range(start, end, freq="D")
daily = sold.groupby(sold["createdAt"].dt.tz_localize(None).dt.normalize())["totalPrice"].sum()
daily = daily.reindex(days, fill_value=0.0)
weekly = span > 120
if weekly:
    daily = daily.resample("W-MON", label="left", closed="left").sum()
labels = [d.strftime("%d/%m/%Y") for d in daily.index]
fig = go.Figure(go.Scatter(
    x=daily.index, y=daily.values, mode="lines+markers" if len(daily) <= 31 else "lines",
    line=dict(color=SERIES, width=2), marker=dict(size=8, color=SERIES, line=dict(color=SURFACE, width=2)),
    customdata=[f"{'Semana de ' if weekly else ''}{l}<br><b>{brl(v)}</b>" for l, v in zip(labels, daily.values)],
    hovertemplate="%{customdata}<extra></extra>",
))
style(fig)
fig.update_layout(hovermode="x")
fig.update_xaxes(tickformat="%d/%m", showspikes=True, spikemode="across", spikecolor=AXIS, spikethickness=1, spikedash="solid")
fig.update_yaxes(tickprefix="R$ ", separatethousands=True, rangemode="tozero")
st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})
st.caption(("Total por semana" if weekly else "Total por dia") + " · só pedidos com pagamento confirmado (pago, enviado ou entregue).")

# ---------- Status e forma de pagamento ----------
c1, c2 = st.columns(2)
with c1:
    st.subheader("Pedidos por status")
    if period_orders.empty:
        empty()
    else:
        counts = period_orders["status"].value_counts().reindex(STATUS_LABELS.keys(), fill_value=0)
        counts = counts[counts > 0]
        names = [STATUS_LABELS[s] for s in counts.index]
        st.plotly_chart(
            hbar(names, counts.values, counts.values, [f"{n}<br><b>{v} pedido(s)</b>" for n, v in zip(names, counts.values)]),
            width="stretch", config={"displayModeBar": False},
        )
with c2:
    st.subheader("Faturamento por forma de pagamento")
    if sold.empty:
        empty()
    else:
        by_method = sold.groupby("paymentMethod")["totalPrice"].agg(["sum", "count"]).sort_values("sum", ascending=False)
        names = [METHOD_LABELS.get(m, m) for m in by_method.index]
        st.plotly_chart(
            hbar(names, by_method["sum"], [brl(v) for v in by_method["sum"]],
                 [f"{n}<br><b>{brl(s)}</b> · {c} pedido(s)" for n, s, c in zip(names, by_method["sum"], by_method["count"])]),
            width="stretch", config={"displayModeBar": False},
        )

# ---------- Produtos e categorias ----------
c3, c4 = st.columns(2)
with c3:
    st.subheader("Produtos mais vendidos")
    if sold_items.empty:
        empty()
    else:
        top = (sold_items.groupby("name")[["revenue", "quantity"]].sum()
               .sort_values("revenue", ascending=False).head(10))
        st.plotly_chart(
            hbar(list(top.index), top["revenue"], [brl(v) for v in top["revenue"]],
                 [f"{n}<br><b>{brl(r)}</b> · {q} un." for n, r, q in zip(top.index, top["revenue"], top["quantity"])]),
            width="stretch", config={"displayModeBar": False},
        )
        st.caption("Top 10 por faturamento. Passe o mouse para ver as unidades.")
with c4:
    st.subheader("Faturamento por categoria")
    if sold_items.empty:
        empty()
    else:
        cat = sold_items.merge(products[["_id", "category"]], left_on="productId", right_on="_id", how="left")
        cat["category"] = cat["category"].fillna("Produto removido")
        by_cat = cat.groupby("category")[["revenue", "quantity"]].sum().sort_values("revenue", ascending=False)
        st.plotly_chart(
            hbar(list(by_cat.index), by_cat["revenue"], [brl(v) for v in by_cat["revenue"]],
                 [f"{n}<br><b>{brl(r)}</b> · {q} un." for n, r, q in zip(by_cat.index, by_cat["revenue"], by_cat["quantity"])]),
            width="stretch", config={"displayModeBar": False},
        )

st.divider()

# ---------- Tabelas ----------
c5, c6 = st.columns([3, 2])
with c5:
    st.subheader("Pedidos recentes")
    recent = (period_orders.sort_values("createdAt", ascending=False).head(50)
              .merge(users[["_id", "name", "email"]].rename(columns={"_id": "userId"}), on="userId", how="left"))
    if recent.empty:
        empty()
    else:
        st.dataframe(
            pd.DataFrame({
                "Data": recent["createdAt"].dt.tz_localize(None),
                # No JSON os clientes são anônimos: mostra o fim do ID.
                "Cliente": recent["name"].astype("string").fillna("Cliente …" + recent["userId"].fillna("").str[-6:]),
                "Status": recent["status"].map(STATUS_LABELS).fillna(recent["status"]),
                "Pagamento": recent["paymentMethod"].map(METHOD_LABELS).fillna(recent["paymentMethod"]),
                "Total": recent["totalPrice"],
                "Pedido": recent["_id"],
            }),
            hide_index=True, width="stretch",
            column_config={
                "Data": st.column_config.DatetimeColumn(format="DD/MM/YYYY HH:mm"),
                "Total": st.column_config.NumberColumn(format="R$ %.2f"),
            },
        )
with c6:
    st.subheader("Estoque baixo")
    active = products[products["isActive"].fillna(True) != False]  # noqa: E712
    low = active[active["stock"] <= active["minimumStock"]].sort_values("stock")
    if low.empty:
        st.success("Nenhum produto abaixo do estoque mínimo.")
    else:
        st.dataframe(
            low[["name", "category", "stock", "minimumStock"]].rename(columns={
                "name": "Produto", "category": "Categoria", "stock": "Estoque", "minimumStock": "Mínimo"}),
            hide_index=True, width="stretch",
        )
        st.caption(f"{int((low['stock'] <= 0).sum())} sem estoque · {len(low)} no total abaixo do mínimo.")

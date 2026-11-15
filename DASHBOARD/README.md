# BlackWear — Dashboard de vendas

Painel em Python (Streamlit) que lê o mesmo MongoDB do backend, **somente leitura**.
Só entra quem tem conta de administrador no app (mesmo e-mail e senha).

## Instalar e iniciar

Instale o Python para Windows antes de começar: https://www.python.org/downloads/. Durante a
instalação, marque **Add Python to PATH**. Os comandos abaixo criam o ambiente virtual e instalam
as dependências do Dashboard; eles não baixam o próprio Python.

No PowerShell, a partir da pasta principal do projeto, execute:

1. Entre na pasta do Dashboard e crie o ambiente virtual (só na primeira vez):
   ```powershell
   cd DASHBOARD
   python -m venv .venv
   ```
2. Instale as dependências (só na primeira vez):
   ```powershell
   .venv\Scripts\pip install -r requirements.txt
   ```
3. Inicie o Dashboard:
   ```powershell
   .venv\Scripts\streamlit run app.py
   ```

Abra http://localhost:8501. No celular (mesma rede Wi-Fi), use `http://IP-DO-PC:8501`.
O botão **Ver dashboard de vendas** no painel admin do app abre esse endereço, usando o mesmo IP
da API. Para outro endereço, defina `EXPO_PUBLIC_DASHBOARD_URL` no `.env` do MOBILE.
Libere a porta 8501 no firewall do Windows, assim como a 3000.

O `MONGO_URI` vem de `BACKEND/.env`. Para usar outro banco, crie `DASHBOARD/.env` com `MONGO_URI=...`.

## Fontes de dados

- **Banco de dados (ao vivo):** login com conta admin; lê o MongoDB direto.
- **Arquivo JSON do app:** no app, *Minha conta → Gerenciar produtos → Exportar dados (JSON)*.
  O app chama `GET /api/reports/export` (só admin) e gera `blackwear-dados-AAAA-MM-DD.json`,
  que pode ser salvo ou compartilhado. Envie esse arquivo na aba "Arquivo JSON do app".
  Não precisa de acesso ao banco. Os clientes vêm anonimizados (sem nome, e-mail ou telefone).

Formato do JSON: `{ source, generatedAt, currency, orders: [{ id, customerId, createdAt, status,
paymentMethod, totalPrice, shippingPrice, city, state, payment, items: [{ productId, name, size,
price, quantity, subtotal }] }], products: [...], customers: [{ id, createdAt }] }`.

## O que mostra

- Faturamento, pedidos pagos, ticket médio, pedidos aguardando pagamento e novos clientes,
  com comparação com o período anterior de mesmo tamanho.
- Faturamento por dia (por semana em períodos acima de 120 dias).
- Pedidos por status e faturamento por forma de pagamento.
- Produtos mais vendidos e faturamento por categoria.
- Pedidos recentes e produtos com estoque abaixo do mínimo.

Conta como venda o pedido com status `paid`, `shipped` ou `delivered`. Os dados ficam em cache por
1 minuto; o botão **Atualizar agora** recarrega na hora.

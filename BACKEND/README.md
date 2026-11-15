# BlackWear Backend — versão atualizada

API Node.js + Express + MongoDB/Mongoose. O front-end não foi alterado nem incluído neste pacote.

## Configuração

1. Instale Node.js LTS.
2. Execute `npm install`.
3. Crie um arquivo `.env` na raiz:
   ```
   PORT=3000
   MONGO_URI=mongodb+srv://.../blackwear
   JWT_SECRET=uma_chave_longa_e_aleatoria
   ```
   Use a URI real do seu banco e mantenha os segredos fora do Git.
4. Inicie com `npm run dev`.

Não execute `npm run seed` num banco que contém dados importantes: `src/seed.js` apaga e recria as coleções `products` e `categories`.

## Rotas disponíveis

### Autenticação — `/api/auth`
- `POST /register` — cria conta comum (`user`); não aceita definir papel administrativo no corpo.
- `POST /login` — retorna token JWT e dados públicos do usuário, incluindo `role`.
- `GET /me` — consulta os dados da conta autenticada.
- `PATCH /me` — atualiza nome, e-mail e telefone da própria conta.
- `POST /forgot-password` — redefinição simples existente no projeto; em produção, substitua por fluxo com token de recuperação verificado.

Envie o token nas rotas protegidas como `Authorization: Bearer <token>`.

### Produtos — `/api/products` e `/api/catalog`
- `GET /api/products` — lista produtos ativos; aceita `?search=texto` e `?category=valor`.
- `GET /api/products/:id` — detalhes do produto.
- `GET /api/catalog` e `GET /api/catalog/:id` — rotas públicas de catálogo preservadas.
- `POST /api/products` — cria produto (**admin obrigatório**).
- `PUT /api/products/:id` — atualiza produto (**admin obrigatório**).
- `DELETE /api/products/:id` — exclui produto (**admin obrigatório**).

O produto mantém os campos existentes e aceita os campos usados pelo formulário atual: `name`, `description`, `price`, `salePrice` (opcional), `category`, `modality`, `team`, `sizes` e `imageUrl`. Também preserva `stock`, `categoryId`, `images` e aliases legados em português. As respostas incluem `id` e `_id` para facilitar a integração.

### Categorias — `/api/categories`
- `GET /api/categories` — consulta pública.
- `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id` — somente admin.

### Endereços — `/api/addresses` (autenticação obrigatória)
- `GET /api/addresses` — lista apenas endereços do usuário autenticado.
- `GET /api/addresses/:id` — consulta um endereço próprio.
- `POST /api/addresses` — cadastra endereço para o usuário do token.
- `PUT /api/addresses/:id` ou `PATCH /api/addresses/:id` — atualiza endereço próprio.
- `DELETE /api/addresses/:id` — remove endereço próprio.

Campos aceitos: `name`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `zipCode`, `isDefault`. Também são aceitos aliases em português como `nome`, `rua`, `numero`, `bairro`, `cidade`, `estado`, `cep` e `principal`. O `userId` é derivado do token, nunca confiado ao corpo da requisição.

### Carrinho e pedidos preservados
- `/api/cart`: `GET /`, `POST /items`, `PATCH /items/:productId`, `DELETE /items/:productId` (autenticado).
- `/api/orders`: `POST /checkout`, `GET /`, `GET /:id` (autenticado); `PATCH /:id/status` (admin).

## Permissão administrativa

O middleware verifica o usuário persistido no banco a cada operação protegida. São reconhecidos os papéis `admin`, `ADM` e `ADMIN` (sem distinção entre maiúsculas e minúsculas). O cadastro público sempre cria usuário comum. Para conceder acesso administrativo, altere o campo `role` do usuário diretamente no banco, por um procedimento controlado, para `admin`. Nunca dependa apenas da interface para proteger a API.

## Testes rápidos

1. `GET http://localhost:3000/` deve responder que a API está rodando.
2. Faça `POST /api/auth/register` com `{"name":"Teste","email":"teste@example.com","password":"senha123"}`.
3. Faça login em `POST /api/auth/login` e copie `token`.
4. Sem token, `POST /api/addresses` deve retornar `401`.
5. Com token comum, `POST /api/products` deve retornar `403`; `GET /api/products` deve continuar público.
6. Com token de um usuário cujo `role` é `admin`, teste `POST /api/products` com:
   ```
   {
     "name": "Camiseta de teste",
     "description": "Produto para validar a API",
     "price": 129.90,
     "salePrice": 99.90,
     "category": "Camisetas",
     "modality": "Casual",
     "team": "Sem time",
     "sizes": ["P", "M", "G"],
     "imageUrl": "https://example.com/camiseta.jpg"
   }
   ```
7. Com token de usuário comum, teste `POST /api/addresses` com:
   ```
   {
     "name": "Casa",
     "street": "Rua de Teste",
     "number": "123",
     "city": "São Paulo",
     "state": "SP",
     "zipCode": "01000-000",
     "isDefault": true
   }
   ```
   Consulte em seguida `GET /api/addresses`. Use o ID retornado para testar `PUT` e `DELETE`.
8. Cadastre dois usuários e confirme que o segundo não consegue consultar, alterar ou excluir o endereço do primeiro.

## Arquivos principais alterados/adicionados

- `server.js` — registra `/api/addresses`.
- `src/controllers/addressController.js` — CRUD de endereços com isolamento por usuário.
- `src/routes/addressRoutes.js` — rotas autenticadas de endereços.
- `src/controllers/authController.js` e `src/routes/authRoutes.js` — atualização de perfil e papel na resposta pública.
- `src/models/Product.js` e `src/controllers/productController.js` — campos de produto compatíveis com o formulário e normalização das respostas.
- `src/controllers/catalogController.js` — normalização consistente do catálogo.
- `src/middleware/admin.js` e `src/models/User.js` — reconhecimento do papel administrativo.
- `src/controllers/orderController.js` — valida que o endereço usado no checkout pertence ao usuário e atualiza o campo `stock`.

## Integração do aplicativo

O front-end usa a API na porta 3000. Configure `MONGO_URI` e `JWT_SECRET` no `.env`. Para executar: `npm install` e `npm run dev`. O cadastro público cria usuários com `role: user`; para administrar produtos, altere manualmente o campo `role` para `admin` no MongoDB. Rotas de produtos: `GET /api/products` pública; `POST`, `PUT` e `DELETE /api/products/:id` restritas a administradores. O checkout é uma simulação MVP e não processa pagamentos reais.


## Diagnóstico de conexão do aplicativo

- A API usa CommonJS (`require` / `module.exports`). Não adicione `import ... from './api'` em `src/routes/cartRoutes.js`: esse arquivo é uma rota Express, não um serviço de API do front-end.
- Copie `.env.example` para `.env` e preencha `MONGO_URI` e `JWT_SECRET`. Sem esses valores o servidor encerra a inicialização.
- Inicie com `npm install` e `npm run dev`. Acesse `http://localhost:3000/` no navegador do computador; deve aparecer `API do BlackWear rodando`.
- No Expo Web rodando no mesmo computador, `EXPO_PUBLIC_API_URL=http://localhost:3000` pode ser usado. Em um celular físico, use o IPv4 atual do computador, por exemplo `http://192.168.1.8:3000`, ambos na mesma rede Wi-Fi e com a porta 3000 liberada no firewall. Reinicie o Expo após alterar `.env`.

## Integração Mercado Pago (Checkout Pro)

Ativada quando `MP_ACCESS_TOKEN` está no `.env`. Sem ele, o checkout segue na simulação do MVP.

Fluxo: `POST /api/orders/checkout` cria o pedido como `pending` -> `POST /api/payments/checkout` gera o link do Mercado Pago -> o app abre o link -> o pagamento é confirmado pelo webhook (ou por `GET /api/payments/order/:orderId/status`, que consulta o Mercado Pago na hora) e o pedido vira `paid`.

Rotas `/api/payments`:
- `POST /checkout` (auth) — body `{ orderId, returnUrl? }`; devolve `checkoutUrl`, `sandboxUrl`, `preferenceId`. Valores vêm do banco.
- `GET /order/:orderId/status` (auth) — sincroniza com o Mercado Pago e devolve `orderStatus` e `paymentStatus`.
- `POST /webhook` (pública) — notificações do Mercado Pago; valida assinatura se `MP_WEBHOOK_SECRET` existir.
- `GET /return/:result` (pública) — página de retorno que devolve o usuário ao app.

Variáveis: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` (opcional no início), `API_PUBLIC_URL` (ngrok; necessária para webhook e retorno automático), `APP_SCHEME`.

Regras: pedido só vira `paid` com pagamento `approved` e valor igual ao do banco; `rejected` mantém o pedido `pending` (dá para tentar de novo); `cancelled`/`refunded` cancelam o pedido e devolvem o estoque uma única vez. O estoque é reservado na criação do pedido. Nunca coloque o Access Token no app nem no Git.

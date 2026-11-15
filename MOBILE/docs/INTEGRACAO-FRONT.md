# Integração usada nesta revisão

Base: `EXPO_PUBLIC_API_URL`, em `src/services/api.js`. As rotas protegidas recebem o token da sessão em `Authorization: Bearer`.

## Exclusão

- Produto: `DELETE /api/products/:id` (admin).
- Categoria: `DELETE /api/categories/:id` (admin).
- Endereço: `DELETE /api/addresses/:id` (usuário dono).

A interface só remove o registro local depois de resposta HTTP bem-sucedida. Não há troca de tela após excluir produto. A confirmação usa Modal do React Native em todas as plataformas, com bloqueio durante a operação e mensagem de erro.

## Estoque

O campo `stock` de `GET /api/products` é um inteiro por produto, compartilhado entre tamanhos. `src/utils/stock.js` soma todas as linhas do mesmo ID. O front bloqueia adições e aumentos acima do limite e permite reduzir/remover itens indisponíveis. O servidor continua sendo a autoridade sobre estoque; a equipe deve validar quantidades também no backend, inclusive a soma de tamanhos e concorrência.

## Pedidos

- `POST /api/orders/checkout`: usa o endereço/ID salvo e o método do fluxo existente; espera `{ order: { _id, totalPrice, ... } }`.
- `GET /api/orders`: lista os pedidos da conta.
- `GET /api/orders/:id`: retorna `{ order, items, payment }`. Cada item possui nome, tamanho, quantidade e preço registrados no momento da compra. Não depende do nome/preço atual do catálogo nem da existência futura do produto.

`src/services/orderService.js` centraliza as chamadas. Confirmação e histórico exibem o ID completo retornado pela API, preservando letras e números. Não há geração local nem fallback aleatório. Se a consulta de itens falhar, a tela mantém o pedido e permite consultar novamente. Depois da criação bem-sucedida, a atualização do carrinho não bloqueia a navegação à confirmação.

## Escopo

Backend preservado. Nenhuma rota, dependência ou credencial de Mercado Pago adicionada. O pagamento simulado existente no backend continua como recebido.

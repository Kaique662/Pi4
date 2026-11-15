# BLACKWEAR — front integrado

Aplicativo React Native/Expo com catálogo, conta, painel administrativo, carrinho e pedidos conectados à API do projeto. Os produtos e pedidos exibidos vêm do servidor. Não há catálogo fictício carregado pelo aplicativo.

## Correções desta entrega

- Exclusão de produtos, categorias e endereços com confirmação dentro do aplicativo, compatível com web, Android e iOS. Erros ficam visíveis e permitem tentar novamente. O painel permanece aberto depois de excluir.
- Quantidade limitada pelo estoque total do produto: tamanhos diferentes compartilham o mesmo estoque. Bloqueia adição sem estoque e cliques repetidos durante as requisições. Reduzir e remover continuam possíveis para itens que ficaram indisponíveis.
- A mensagem de adição só aparece quando a API confirma a operação.
- O número mostrado na confirmação e no histórico é o ID completo retornado pelo banco, sem cortar caracteres nem gerar números locais.
- Confirmação e histórico consultam os itens salvos do pedido, com nome, tamanho, quantidade, preço unitário e subtotal. Falhas de consulta permitem nova tentativa.
- Uma falha ao atualizar o carrinho depois de criar o pedido não transforma o pedido confirmado em erro de checkout.

## Testar no celular (Windows)

1. Extraia o pacote e abra a pasta MOBILE no VS Code.
2. Use o backend da equipe, já configurado com o banco. Se precisar executar localmente, siga o README da pasta BACKEND. Computador e celular devem estar na mesma rede Wi-Fi.
3. Na pasta MOBILE, copie `.env.example` para `.env` e ajuste `EXPO_PUBLIC_API_URL` para o endereço do computador que executa a API, por exemplo `http://192.168.1.8:3000`. No celular, `localhost` aponta para o próprio celular.
4. Abra o terminal nessa pasta e execute:

```powershell
npm.cmd ci
npx.cmd expo start --go --lan --clear
```

5. Escaneie o QR Code com Expo Go no Android ou com a câmera do iPhone. Use uma versão do Expo Go compatível com o SDK 57 deste projeto. Mantenha a API e o terminal do Expo abertos.

Para testar no navegador: `npm.cmd run web`. Ao alterar o `.env`, reinicie o Expo.

## Conferência funcional

1. Entre com uma conta que o backend identifica como admin. Em Minha conta → Gerenciar produtos, cancele uma exclusão e depois confirme outra. Confira a remoção na lista e no banco.
2. Em um produto com estoque 3, adicione duas unidades M e uma G. O botão de aumentar deve ficar desabilitado para ambos os tamanhos. Remova uma unidade e confira se pode adicionar novamente. Produtos com estoque zero não permitem compra.
3. Confirme um pedido no fluxo existente. Compare o ID completo da confirmação com o `_id` no banco.
4. Confira nome, tamanho, quantidade e valores na confirmação e em Minha conta → Histórico de compras → Ver produtos comprados.
5. Desligue a API para conferir mensagens de erro e nova tentativa. Não confirme novamente uma compra cuja criação já foi concluída: consulte o histórico.

## Verificações realizadas

- `npm test`: regras de catálogo/formulário e limites de estoque, incluindo tamanhos diferentes e estoque zero.
- Babel: todos os arquivos JavaScript do aplicativo compilados.
- `npx expo export --platform all`: bundles de Android, iOS e web gerados.
- Navegador a 390 × 844: fluxo de estoque, remoção de tamanho específico, exclusão cancelada, falha/retry de exclusão, checkout, ID completo, itens e histórico. Respostas da API foram simuladas somente no teste externo, sem inserir mocks no aplicativo.

Não foi realizada conexão com o banco real da equipe nem execução em aparelho físico nesta revisão.

## Backend e pagamento

O backend fornecido está preservado. A autorização de admin continua sendo definida e validada pelo servidor. As rotas usadas estão em `docs/INTEGRACAO-FRONT.md`.

Mercado Pago não foi implementado. O checkout existente no backend ainda simula pagamento aprovado para o MVP; esta entrega não altera esse comportamento.

O limite no front acompanha o estoque carregado. A equipe de backend ainda deve validar a soma dos tamanhos do mesmo produto nas rotas de carrinho e fazer a reserva/baixa de estoque de forma atômica no checkout. Na versão recebida, o checkout verifica cada linha isoladamente; isso não protege contra duas compras simultâneas nem contra chamadas diretas à API. O front não substitui essa validação do servidor.

## Git

Envie as alterações da pasta MOBILE para a branch de trabalho do front. `node_modules`, `.expo`, builds e `.env` não precisam ser enviados. O backend incluído no pacote não foi modificado.

> Documento anterior à revisão de 22/10/2026. Para o comportamento atual e os testes desta entrega, consulte ../README.md.

# Verificação desta entrega

- Sem lista inicial de produtos: o catálogo começa vazio.
- Fluxo de admin pelo usuário logado: formulário, campos obrigatórios, preço e oferta.
- Cadastro manual atualiza as telas e persiste localmente.
- Busca/filtros e promoções usam a mesma fonte de dados do cadastro.
- Visitantes não veem o link de administração.

Os resultados finais dos testes da interface e dos bundles são registrados ao concluir a entrega.

Não houve execução em aparelho físico ou emulador. Nenhuma API foi conectada. O cadastro de produtos é local; o login e o checkout continuam demonstrativos. O backend deve fornecer autenticação e autorização real de admin.

## Resultados finais

- `npm test` passou: catálogo vazio, filtros, conversão de preço, validação do cadastro e perfil.
- Fluxo automatizado no Chromium passou no site servido e no HTML aberto diretamente: ausência de produtos iniciais, cadastro/login, botão do painel, validação de nome/oferta, cadastro manual, retorno de sucesso, atualização de filtros e ofertas já abertas, preço do carrinho, persistência e ausência do botão após recarregar sem sessão.
- Layout conferido em 320, 390 e 768 pixels.
- Bundles web, Android e iOS gerados sem erro após a alteração.
- Tela de admin e formulário inspecionados visualmente.

> Documento anterior à revisão de 22/10/2026. Para o comportamento atual e os testes desta entrega, consulte ../README.md.

# Teste do front com painel

1. Abra pela primeira vez: o catálogo e as promoções devem começar vazios.
2. Entre em Minha conta e crie uma conta para a sessão.
3. Minha conta continua mostrando o cartão para editar os dados; agora também há Gerenciar produtos.
4. Abra Gerenciar produtos → Adicionar produto.
5. Tente salvar vazio: deve aparecer validação, sem criar item.
6. Preencha os dados do seu próprio produto: nome, preço, categoria, modalidade e pelo menos um tamanho.
7. Opcionalmente, preencha descrição, time, URL de imagem e oferta menor que o preço normal.
8. Salve: deve retornar ao painel, confirmar o cadastro e mostrar o item.
9. Abra Produtos. O item precisa aparecer e os filtros devem usar os dados cadastrados.
10. Se houver oferta, o item deve aparecer também em Ofertas, com preço riscado e percentual.
11. Adicione ao carrinho e confira o preço promocional.
12. Recarregue: produtos e carrinho devem continuar neste aparelho; a conta temporária precisará ser recriada para entrar novamente no painel.
13. Sem login, Minha conta não mostra o botão do painel.

Os cadastros não são enviados a servidor. Quando a equipe conectar a API, repetir o teste em dois aparelhos para confirmar que a lista passou a ser compartilhada e que somente admins autorizados podem cadastrar.

// O estoque da API é por produto, compartilhado entre todos os tamanhos.
export function stockOf(product) {
  const stock = Number(product?.stock);
  return Number.isSafeInteger(stock) && stock >= 0 ? stock : 0;
}
export function quantityFor(cart, productId) {
  return cart.filter(item => String(item.id) === String(productId))
    .reduce((sum, item) => sum + item.quantity, 0);
}
export function remainingStock(cart, product) {
  return Math.max(0, stockOf(product) - quantityFor(cart, product?.id));
}
export function canSetQuantity(cart, item, quantity, product) {
  return Number.isSafeInteger(quantity) && quantity >= 0 &&
    (quantity === 0 || (product && quantityFor(cart, item.id) - item.quantity + quantity <= stockOf(product)));
}

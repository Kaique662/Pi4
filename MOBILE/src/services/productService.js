
import { apiRequest } from './api';
import { toProductPayload } from '../utils/productForm';

function normalizeProduct(item) {
  const product = item?.product || item;

  if (!product) return null;

  return {
    ...product,
    id: String(product.id || product._id || ''),
    name: product.name || product.nome || '',
    description: product.description || product.descricao || '',
    price: Number(product.price ?? product.preco ?? 0),

    salePrice:
      product.salePrice == null
        ? product.precoPromocional == null
          ? undefined
          : Number(product.precoPromocional)
        : Number(product.salePrice),

    category: product.category || product.categoria || '',
    categoryId: product.categoryId || product.categoriaId || null,
    modality: product.modality || product.modalidade || '',
    team: product.team || product.time || 'Sem time',
    sizes: product.sizes || product.tamanhos || ['Único'],

    imageUrl:
      product.imageUrl ||
      product.imagemUrl ||
      product.images?.[0] ||
      '',

    images:
      product.images ||
      product.imagens ||
      (product.imageUrl || product.imagemUrl
        ? [product.imageUrl || product.imagemUrl]
        : []),

    stock: Number(product.stock ?? product.estoque ?? 0),
    minimumStock: Number(product.minimumStock ?? product.estoqueMinimo ?? 5),
  };
}

function extractProductList(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

export const productService = {
  // Busca os produtos salvos no back-end.
  async list() {
    const data = await apiRequest('/api/products', {
      noAuth: true,
    });

    return extractProductList(data)
      .map(normalizeProduct)
      .filter((item) => item && item.id);
  },

  // Busca um produto específico no banco.
  async get(id) {
    const data = await apiRequest(
      `/api/products/${encodeURIComponent(id)}`,
      { noAuth: true }
    );

    const product = normalizeProduct(data);

    if (!product || !product.id) {
      throw new Error('Produto não encontrado ou resposta inválida do servidor.');
    }

    return product;
  },

  // Cadastra o produto no back-end.
  async create(form) {
    // toProductPayload valida o formulário antes de enviar.
    // isValidProduct espera um produto já salvo (com id), não os dados crus do formulário.
    const payload = toProductPayload(form);

    const data = await apiRequest('/api/products', {
      method: 'POST',
      body: payload,
    });

    const product = normalizeProduct(data);

    if (!product || !product.id) {
      throw new Error('O servidor não retornou o produto criado.');
    }

    return product;
  },

  // Atualiza um produto no back-end.
  async update(id, payload) {
    const data = await apiRequest(
      `/api/products/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: payload,
      }
    );

    return normalizeProduct(data);
  },

  // Exclui um produto no back-end.
  async remove(id) {
    return apiRequest(
      `/api/products/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
  },
};

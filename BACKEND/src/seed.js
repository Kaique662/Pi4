// Popula o banco com as categorias e os 10 produtos que já existem no front do grupo.
// Rode com: npm run seed   (pode rodar de novo quando quiser: ele limpa e recria)

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Category = require('./models/Category');
const Product = require('./models/Product');

const DESCRICAO_PADRAO =
  'Peça da coleção BLACKWEAR feita para resistir ao tempo e ao desgaste urbano. Qualidade, conforto e desempenho.';

async function seed() {
  await connectDB();

  await Category.deleteMany({});
  await Product.deleteMany({});

  const [camisetas, moletons, calcas, acessorios, esportivo] = await Category.insertMany([
    { name: 'Camisetas', slug: 'camisetas' },
    { name: 'Moletons e Jaquetas', slug: 'moletons-jaquetas' },
    { name: 'Calças', slug: 'calcas' },
    { name: 'Acessórios', slug: 'acessorios' },
    { name: 'Esportivo', slug: 'esportivo' },
  ]);

  await Product.insertMany([
    {
      name: 'Camiseta Oversized Premium',
      description:
        'Desenvolvida em algodão 100% premium com modelagem oversized confortável, ombros caídos e gola canelada de 3cm que mantém o caimento estruturado. Uma peça minimalista feita para resistir ao tempo e ao desgaste urbano.',
      price: 189.9, stock: 20, categoryId: camisetas._id,
    },
    { name: 'Camiseta Street Preta', description: DESCRICAO_PADRAO, price: 159.9, stock: 20, categoryId: camisetas._id },
    { name: 'Moletom BLACKWEAR', description: DESCRICAO_PADRAO, price: 249.9, stock: 20, categoryId: moletons._id },
    { name: 'Calça Cargo Preta', description: DESCRICAO_PADRAO, price: 229.9, stock: 20, categoryId: calcas._id },
    { name: 'Boné BLACKWEAR', description: DESCRICAO_PADRAO, price: 99.9, stock: 20, categoryId: acessorios._id, sizes: ['Único'] },
    { name: 'Camiseta Basic Black', description: DESCRICAO_PADRAO, price: 139.9, stock: 20, categoryId: camisetas._id },
    { name: 'Short Esportivo BLACKWEAR', description: DESCRICAO_PADRAO, price: 119.9, stock: 20, categoryId: esportivo._id },
    { name: 'Regata Esportiva BLACKWEAR', description: DESCRICAO_PADRAO, price: 109.9, stock: 20, categoryId: esportivo._id },
    { name: 'Calça Jogger BLACKWEAR', description: DESCRICAO_PADRAO, price: 219.9, stock: 20, categoryId: calcas._id },
    { name: 'Jaqueta Esportiva BLACKWEAR', description: DESCRICAO_PADRAO, price: 279.9, stock: 20, categoryId: moletons._id },
  ]);

  console.log('[BlackWear] Seed concluído: 5 categorias e 10 produtos criados.');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});

const mongoose = require('mongoose');

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI não definida no .env');
    }
    await mongoose.connect(uri);
    console.log('[BlackWear] Conectado ao MongoDB com sucesso.');
  } catch (err) {
    console.error('[BlackWear] Erro ao conectar no MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;

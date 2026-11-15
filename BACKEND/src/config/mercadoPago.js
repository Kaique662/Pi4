const { MercadoPagoConfig } = require('mercadopago');

// O cliente só é criado se houver token no .env.
// Sem token, o checkout continua no modo simulação (MVP) e nada quebra.
const enabled = Boolean(process.env.MP_ACCESS_TOKEN);

const client = enabled
  ? new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
      options: { timeout: 10000 },
    })
  : null;

module.exports = { client, enabled };

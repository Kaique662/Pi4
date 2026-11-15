import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { apiRequest } from './api';

// Baixa os dados de vendas (rota de admin) e gera um arquivo .json para o dashboard de análise.
export async function exportSalesJson() {
  const data = await apiRequest('/api/reports/export');
  const json = JSON.stringify(data, null, 2);
  const filename = `blackwear-dados-${new Date().toISOString().slice(0, 10)}.json`;
  const summary = { filename, orders: data.orders?.length || 0, products: data.products?.length || 0 };

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return summary;
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento indisponível neste aparelho.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Salvar dados em JSON', UTI: 'public.json' });
  return summary;
}

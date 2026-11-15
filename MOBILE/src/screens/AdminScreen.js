
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { useDeleteConfirmation } from '../components/DeleteConfirmation';
import BackLink from '../components/BackLink';
import CatalogStatus from '../components/CatalogStatus';
import ProductArtwork from '../components/ProductArtwork';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import { DASHBOARD_URL } from '../services/api';
import { exportSalesJson } from '../services/reportService';
import { getPrice, hasPromotion, money } from '../utils/catalog';

export default function AdminScreen({ navigation, route }) {
  const { user, isAdmin } = useAuth();
  const { products, loading, error, refreshProducts, deleteProduct } = useProducts();

  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);
  async function exportJson() {
    setExporting(true); setExportMessage(null);
    try {
      const { filename, orders, products: total } = await exportSalesJson();
      setExportMessage({ text: `${filename} gerado: ${orders} pedidos e ${total} produtos.` });
    } catch (e) {
      setExportMessage({ error: true, text: e.message || 'Não foi possível exportar os dados.' });
    } finally { setExporting(false); }
  }

  const deletion = useDeleteConfirmation();
  function confirmarExclusao(product) {
    deletion.open(`Deseja realmente excluir "${product.name}"?`, () => deleteProduct(product.id));
  }

  if (!user || !isAdmin) {
    return (
      <Screen navigation={navigation} active="Account">
        <BackLink navigation={navigation} fallback="Account" />
        <View style={styles.content}>
          <Text style={styles.title}>
            {user ? 'Acesso restrito' : 'Entre na sua conta'}
          </Text>
          <Text style={styles.description}>
            {user
              ? 'Somente administradores podem gerenciar produtos.'
              : 'Faça login para acessar esta área.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.add}
            onPress={() => navigation.navigate('Account')}
          >
            <Text style={styles.addText}>
              {user ? 'VOLTAR À CONTA' : 'ENTRAR'}
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const created = products.find(
    p => String(p.id) === String(route.params?.createdProductId)
  );

  return (
    <Screen navigation={navigation} active="Account">
      {deletion.dialog}
      <ScrollView contentContainerStyle={styles.content}>
        <BackLink
          navigation={navigation}
          fallback="Account"
          label="← MINHA CONTA"
        />

        <View style={styles.main}>
          <Text style={styles.eyebrow}>BLACKWEAR / ADMINISTRAÇÃO</Text>
          <Text style={styles.title}>Gerenciar produtos</Text>
          <Text style={styles.description}>
            Cadastre novos itens e acompanhe seu catálogo.
          </Text>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.number}>{products.length}</Text>
              <Text style={styles.statLabel}>Produtos</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.number}>
                {products.filter(hasPromotion).length}
              </Text>
              <Text style={styles.statLabel}>Em promoção</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adicionar produto"
            disabled={loading || !!error}
            style={[styles.add, (loading || !!error) && { opacity: 0.5 }]}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <Text style={styles.addText}>+ ADICIONAR PRODUTO</Text>
          </Pressable>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Abrir dashboard de vendas"
            style={styles.dashboard}
            onPress={() => Linking.openURL(DASHBOARD_URL).catch(() => {})}
          >
            <Text style={styles.dashboardText}>VER DASHBOARD DE VENDAS ↗</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exportar dados de vendas em JSON"
            disabled={exporting}
            style={[styles.dashboard, exporting && { opacity: 0.5 }]}
            onPress={exportJson}
          >
            <Text style={styles.dashboardText}>{exporting ? 'GERANDO JSON...' : 'EXPORTAR DADOS (JSON)'}</Text>
          </Pressable>
          {!!exportMessage && (
            <Text accessibilityLiveRegion="polite" style={[styles.success, exportMessage.error && styles.exportError]}>
              {exportMessage.text}
            </Text>
          )}

          {!!created && (
            <Text accessibilityLiveRegion="polite" style={styles.success}>
              {created.name} cadastrado com sucesso!
            </Text>
          )}

          <Text style={styles.sectionTitle}>Catálogo cadastrado</Text>

          <CatalogStatus
            loading={loading}
            error={error}
            onRetry={refreshProducts}
          />

          {!loading && !error && !products.length && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Seu catálogo começa aqui</Text>
              <Text style={styles.description}>
                Toque em Adicionar produto para cadastrar o primeiro item.
              </Text>
            </View>
          )}

          {!loading && !error && products.map(product => (
            <View key={product.id} style={styles.item}>
              <View style={styles.thumb}>
                <ProductArtwork compact product={product} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.category}>
                  {product.category} · {product.modality}
                </Text>
                <Text style={styles.price}>
                  {money(getPrice(product))}
                  {hasPromotion(product) ? ' · Em oferta' : ''}
                </Text>
                <Text
                  style={[
                    styles.price,
                    { color: product.stock <= 0 ? '#b42318' : '#557044' },
                  ]}
                >
                  {product.stock <= 0
                    ? 'Indisponível'
                    : product.stock <= (product.minimumStock ?? 5)
                    ? `Estoque baixo: ${product.stock} (mín. ${product.minimumStock ?? 5})`
                    : `Estoque: ${product.stock}`}
                </Text>

                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    style={styles.smallAction}
                    onPress={() => navigation.navigate('AddProduct', { product })}
                  >
                    <Text style={styles.smallActionText}>EDITAR</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir ${product.name}`}
                    style={[
                      styles.smallAction,
                      { borderColor: '#b42318' },
                    ]}
                    onPress={() => confirmarExclusao(product)}
                  >
                    <Text style={[styles.smallActionText, { color: '#b42318' }]}>
                      EXCLUIR
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  main: { padding: 20 },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
    color: '#777',
    marginBottom: 8,
  },
  title: { fontSize: 27, fontWeight: '900', marginBottom: 10 },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: '#777',
    marginBottom: 20,
  },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  stat: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#f1f2ec',
    padding: 18,
  },
  number: {
    fontSize: 28,
    fontWeight: '900',
    color: '#263322',
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: '#66705d' },
  add: {
    minHeight: 48,
    backgroundColor: '#111',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  addText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  dashboard: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: '#111',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: -12,
    marginBottom: 24,
  },
  dashboardText: { fontSize: 12, fontWeight: '800', color: '#111' },
  exportError: { color: '#b42318', backgroundColor: '#fdecea' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  empty: { paddingVertical: 28, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  success: {
    fontSize: 12,
    lineHeight: 19,
    color: '#2b6438',
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#eaf2e5',
    marginBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  thumb: {
    width: 78,
    height: 78,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  smallAction: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallActionText: { fontSize: 10, fontWeight: '800' },
  productName: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    marginBottom: 4,
  },
  category: { fontSize: 10, color: '#777', lineHeight: 15, marginBottom: 5 },
  price: { fontSize: 12, fontWeight: '700' },
});

import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Footer from '../components/Footer';
import CatalogStatus from '../components/CatalogStatus';
import FilterSheet from '../components/FilterSheet';
import { ProductGrid } from '../components/ProductCard';
import { useProducts } from '../context/ProductsContext';
import { emptyFilters, filterProducts, getDiscount } from '../utils/catalog';
export default function ProductsScreen({ navigation, route, promotionsOnly = false }) {
 const { products, loading, error, refreshProducts } = useProducts();
 const [query, setQuery] = useState('');
 const [filters, setFilters] = useState({ ...emptyFilters });
 const [draft, setDraft] = useState({ ...emptyFilters });
 const [open, setOpen] = useState(false);
 useEffect(() => {
  if (route?.params?.requestId) {
   setQuery(route.params.query || '');
   setFilters({ ...emptyFilters, modality: route.params.modality || 'Todas' });
  }
 }, [route?.params?.requestId]);
 const results = useMemo(() => filterProducts(products, filters, query, promotionsOnly), [products, filters, query, promotionsOnly]);
 const activeFilters = Object.keys(emptyFilters).filter(key => filters[key] !== emptyFilters[key]);
 function reset() { setQuery(''); setFilters({ ...emptyFilters }); }
 return <Screen navigation={navigation} active={promotionsOnly ? 'Promotions' : 'Products'} showSearch searchValue={query} onSearchChange={setQuery} onSearchSubmit={() => { Keyboard.dismiss(); setQuery(query.trim()); }}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
   <View style={styles.heading}>
    <Text style={styles.eyebrow}>{promotionsOnly ? 'PREÇOS ESPECIAIS' : 'BLACKWEAR / CATÁLOGO'}</Text>
    <Text style={styles.title}>{promotionsOnly ? 'Promoções' : 'Todos os produtos'}</Text>
    <Text style={styles.description}>{promotionsOnly ? products.some(p => getDiscount(p) > 0) ? `Até ${Math.max(0, ...products.map(getDiscount))}% de desconto em uma seleção para você.` : 'As ofertas cadastradas aparecerão nesta aba.' : 'Encontre seu time, sua modalidade e seu próximo favorito.'}</Text>
   </View>
   <View style={styles.toolbar}><Text testID="result-count" accessibilityLiveRegion="polite" style={styles.count}>{results.length} {results.length === 1 ? 'produto encontrado' : 'produtos encontrados'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Abrir filtros" style={styles.filterButton} onPress={() => { Keyboard.dismiss(); setDraft({ ...filters }); setOpen(true); }}><Text style={styles.filterText}>Filtros{activeFilters.length ? ` (${activeFilters.length})` : ''} ≡</Text></Pressable></View>
   {!!activeFilters.length && <View style={styles.applied}>{activeFilters.map(key => <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Remover filtro ${filters[key]}`} style={styles.chip} onPress={() => setFilters(current => ({ ...current, [key]: emptyFilters[key] }))}><Text style={styles.chipText}>{key === 'maxPrice' ? `Até R$ ${filters[key]}` : filters[key]} ×</Text></Pressable>)}<Pressable accessibilityRole="button" style={styles.clear} onPress={reset}><Text style={styles.link}>Limpar tudo</Text></Pressable></View>}
   <CatalogStatus loading={loading} error={error} onRetry={refreshProducts} />
    {!loading && !error && <ProductGrid products={results} navigation={navigation} />}
   {!loading && !error && !results.length && <View style={styles.empty}><Text style={styles.emptyTitle}>{!products.length ? 'Nenhum produto cadastrado' : promotionsOnly && !products.some(p => getDiscount(p) > 0) ? 'Nenhuma promoção disponível' : 'Nenhum produto encontrado'}</Text><Text style={styles.description}>{products.length ? 'Tente outro termo ou ajuste os filtros para ampliar a busca.' : 'Os produtos adicionados aparecerão aqui.'}</Text><Pressable accessibilityRole="button" style={styles.reset} onPress={reset}><Text style={styles.resetText}>LIMPAR BUSCA E FILTROS</Text></Pressable></View>}
   <Footer />
  </ScrollView>
  <FilterSheet visible={open} draft={draft} setDraft={setDraft} onClose={() => setOpen(false)} onApply={() => { setFilters({ ...draft }); setOpen(false); }} products={products} query={query} promotionsOnly={promotionsOnly} />
 </Screen>;
}
const styles = StyleSheet.create({
 content: { paddingHorizontal: 16, paddingBottom: 16 }, heading: { paddingTop: 24, paddingBottom: 16 }, eyebrow: { fontSize: 9, letterSpacing: 1.5, color: '#777', fontWeight: '800', marginBottom: 8 }, title: { fontSize: 27, fontWeight: '900', marginBottom: 8 }, description: { fontSize: 13, lineHeight: 20, color: '#777' },
 toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 16 }, count: { fontSize: 11, color: '#777', flex: 1 }, filterButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }, filterText: { fontSize: 12, fontWeight: '700' }, applied: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 }, chip: { backgroundColor: '#f0f0eb', paddingHorizontal: 11, minHeight: 36, justifyContent: 'center', borderRadius: 18 }, chipText: { fontSize: 11 }, clear: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 8 }, link: { fontSize: 11, textDecorationLine: 'underline' },
 empty: { alignItems: 'center', paddingVertical: 48, gap: 15 }, emptyTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' }, reset: { minHeight: 46, backgroundColor: '#111', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 23 }, resetText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});

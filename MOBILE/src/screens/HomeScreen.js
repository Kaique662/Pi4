import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Footer from '../components/Footer';
import CatalogStatus from '../components/CatalogStatus';
import { ProductGrid } from '../components/ProductCard';
import { useProducts } from '../context/ProductsContext';
import { filterProducts, emptyFilters, getDiscount } from '../utils/catalog';
import { goToTab } from '../utils/navigation';
const sports = ['Futebol', 'Basquete', 'Corrida', 'Treino', 'Casual'];
export default function HomeScreen({ navigation }) {
 const { products, loading, error, refreshProducts } = useProducts();
 const [search, setSearch] = useState('');
 const searching = !!search.trim();
 const results = filterProducts(products, emptyFilters, search);
 const maxDiscount = Math.max(0, ...products.map(getDiscount));
 return <Screen navigation={navigation} active="Home" showSearch searchValue={search} onSearchChange={setSearch} onSearchSubmit={() => goToTab(navigation, 'Products', { query: search.trim(), requestId: Date.now() })}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
   {!searching && <>
    <View style={styles.notice}><Text style={styles.noticeText}>SEU ESPORTE. SEU TIME. SEU ESTILO.</Text></View>
    <View style={styles.hero}>
     <Image accessibilityLabel="Atleta em uma pista de corrida" source={require('../../assets/banner.jpg')} style={styles.heroImage} />
     <View style={styles.heroCopy}><Text style={styles.eyebrow}>BLACKWEAR / ESPORTE & ESTILO</Text><Text style={styles.heroTitle}>Pronto para{ '\n' }o seu ritmo.</Text><Text style={styles.heroSubtitle}>Da arquibancada ao treino.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Explorar produtos" style={styles.heroButton} onPress={() => goToTab(navigation, 'Products', { requestId: Date.now() })}><Text style={styles.heroButtonText}>EXPLORAR PRODUTOS →</Text></Pressable>
     </View>
    </View>
    <View style={styles.section}>
     <Text style={styles.sectionLabel}>ENCONTRE SEU ESPORTE</Text>
     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sports}>{sports.map(modality => <Pressable key={modality} accessibilityRole="button" accessibilityLabel={`Explorar ${modality}`} style={styles.sport} onPress={() => goToTab(navigation, 'Products', { modality, requestId: Date.now() })}><Text style={styles.sportText}>{modality}</Text></Pressable>)}</ScrollView>
    </View>
    {maxDiscount > 0 && <View style={styles.section}>
     <Pressable accessibilityRole="button" accessibilityLabel="Ver todas as promoções" style={styles.offerBanner} onPress={() => goToTab(navigation, 'Promotions')}><View style={{ flex: 1 }}><Text style={styles.offerLabel}>SELEÇÃO EM OFERTA</Text><Text style={styles.offerTitle}>Até {maxDiscount}% OFF</Text><Text style={styles.offerSubtitle}>Confira os preços especiais do catálogo.</Text></View><Text style={styles.arrow}>→</Text></Pressable>
    </View>}
   </>}
   <View style={styles.section}>
    <View style={styles.heading}><View style={{ flex: 1 }}><Text style={styles.sectionLabel}>{searching ? 'BUSCA NA LOJA' : 'DO SEU JEITO'}</Text><Text style={styles.title}>{searching ? 'Resultados da busca' : 'Nosso catálogo'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Abrir catálogo com filtros" style={styles.seeAll} onPress={() => goToTab(navigation, 'Products', { query: search, requestId: Date.now() })}><Text style={styles.link}>Filtrar →</Text></Pressable></View>
    <Text style={styles.count}>{results.length} produtos disponíveis</Text>
    <CatalogStatus loading={loading} error={error} onRetry={refreshProducts} />
    {!loading && !error && <ProductGrid products={results} navigation={navigation} />}
    {!loading && !error && !results.length && <View style={styles.empty}><Text style={styles.title}>{products.length ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</Text><Text style={styles.count}>{products.length ? 'Tente outro nome, time ou modalidade.' : 'Os produtos adicionados aparecerão aqui.'}</Text><Pressable accessibilityRole="button" style={styles.seeAll} onPress={() => setSearch('')}><Text style={styles.link}>Limpar busca</Text></Pressable></View>}
   </View>
   <Footer />
  </ScrollView>
 </Screen>;
}
const styles = StyleSheet.create({
 scroll: { paddingBottom: 12 }, notice: { paddingVertical: 10, alignItems: 'center', backgroundColor: '#f6f5f2' }, noticeText: { fontSize: 9, letterSpacing: 1.4, color: '#666' },
 hero: { margin: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#202422' }, heroImage: { position: 'absolute', width: '100%', height: '100%', opacity: 0.25 }, heroCopy: { padding: 18 }, eyebrow: { fontSize: 9, letterSpacing: 1.4, color: '#c4d1c6', marginBottom: 10 }, heroTitle: { color: '#fff', fontSize: 27, fontWeight: '800', lineHeight: 31 }, heroSubtitle: { color: '#d4d6d4', fontSize: 12, marginTop: 10 }, heroButton: { alignSelf: 'flex-start', minHeight: 43, justifyContent: 'center', backgroundColor: '#e1ebd8', borderRadius: 6, paddingHorizontal: 14, marginTop: 20 }, heroButtonText: { fontSize: 10, fontWeight: '900', color: '#18221b' },
 section: { paddingHorizontal: 16, marginBottom: 28 }, sectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#777', marginBottom: 8 }, sports: { gap: 8 }, sport: { minHeight: 42, borderWidth: 1, borderColor: '#ddd', borderRadius: 22, paddingHorizontal: 17, justifyContent: 'center' }, sportText: { fontSize: 12, fontWeight: '600' },
 offerBanner: { backgroundColor: '#e8eddf', borderRadius: 12, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 }, offerLabel: { fontSize: 9, letterSpacing: 1.2, color: '#59644d' }, offerTitle: { fontSize: 28, fontWeight: '900', color: '#24311e', marginVertical: 6 }, offerSubtitle: { fontSize: 11, lineHeight: 16, color: '#53614b' }, arrow: { fontSize: 28, color: '#24311e' },
 heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }, title: { fontSize: 21, fontWeight: '800', color: '#111' }, seeAll: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }, link: { fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' }, count: { fontSize: 12, color: '#777', marginBottom: 16, marginTop: 4 }, empty: { alignItems: 'center', paddingVertical: 36 },
});

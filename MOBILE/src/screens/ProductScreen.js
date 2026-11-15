import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Footer from '../components/Footer';
import BackLink from '../components/BackLink';
import ProductArtwork from '../components/ProductArtwork';
import { useProducts } from '../context/ProductsContext';
import { getDiscount, getPrice, hasPromotion, money } from '../utils/catalog';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { remainingStock } from '../utils/stock';
export default function ProductScreen({ navigation, route }) {
 const { products } = useProducts();
 const product = products.find(item => item.id === route.params?.productId);
 if (!product) return <Screen navigation={navigation} active="Products"><BackLink navigation={navigation} fallback="Products" /><View style={styles.info}><Text style={styles.title}>Produto não encontrado</Text><Text style={styles.description}>Volte ao catálogo e escolha outro produto.</Text></View></Screen>;
 return <ProductDetail key={product.id} navigation={navigation} product={product} />;
}
function ProductDetail({ navigation, product }) {
 const [selectedSize, setSelectedSize] = useState(product.sizes.includes('M') ? 'M' : product.sizes[0]);
 const [added, setAdded] = useState(false);
 const { addProduct, cart, busy, error, clearError } = useCart();
 const available = remainingStock(cart, product);
 const { user, loading: authLoading } = useAuth();
 async function add(buyNow) {
  if (authLoading) return;
  if (!user) { setAdded(false); navigation.navigate('Account'); return; }
  setAdded(false);
  const success = await addProduct(product, selectedSize);
  if (!success) return;
  setAdded(true);
  if (buyNow) navigation.navigate('Cart');
 }
 return <Screen navigation={navigation} active="Products">
  <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
   <BackLink navigation={navigation} fallback="Products" />
   <View style={styles.image}><ProductArtwork product={product} large />{hasPromotion(product) && <Text style={styles.badge}>−{getDiscount(product)}% OFF</Text>}</View>
   <View style={styles.info}>
    <Text style={styles.collection}>{product.modality.toUpperCase()} / {product.team === 'Sem time' ? 'BLACKWEAR' : product.team.toUpperCase()}</Text>
    <Text style={styles.title}>{product.name}</Text>
    {hasPromotion(product) && <Text style={styles.oldPrice}>{money(product.price)}</Text>}
    <Text style={styles.price}>{money(getPrice(product))}</Text>
    <Text style={styles.description}>{product.description}</Text>
    <Text style={[styles.stock, product.stock <= 0 && styles.outOfStock]}>{product.stock <= 0 ? 'INDISPONÍVEL — sem estoque no momento' : `Estoque disponível: ${product.stock} unidade(s)`}</Text>
    <Text style={styles.sizesTitle}>SELECIONE O TAMANHO</Text>
    <View style={styles.sizes}>{product.sizes.map(size => <Pressable key={size} accessibilityRole="radio" accessibilityLabel={`Tamanho ${size}`} accessibilityState={{ checked: selectedSize === size }} style={[styles.size, selectedSize === size && styles.sizeActive]} onPress={() => { setSelectedSize(size); setAdded(false); clearError(); }}><Text style={[styles.sizeText, selectedSize === size && { color: '#fff' }]}>{size}</Text></Pressable>)}</View>
    <Text style={styles.stock}>{available > 0 ? `Você ainda pode adicionar ${available} unidade(s).` : 'Limite de estoque atingido.'}</Text>
    {!!error && <Text accessibilityRole="alert" style={styles.outOfStock}>{error}</Text>}
    {added && <View style={styles.feedback}><Text accessibilityLiveRegion="polite" style={styles.feedbackText}>Adicionado ao carrinho · tamanho {selectedSize}</Text><Pressable accessibilityRole="button" style={styles.cartLink} onPress={() => navigation.navigate('Cart')}><Text style={styles.cartLinkText}>VER CARRINHO →</Text></Pressable></View>}
    <Pressable accessibilityRole="button" disabled={busy || available < 1} style={[styles.primary, (busy || available < 1) && { opacity: 0.4 }]} onPress={() => add(true)}><Text style={styles.primaryText}>COMPRAR AGORA</Text></Pressable>
    <Pressable accessibilityRole="button" disabled={busy || available < 1} style={[styles.secondary, (busy || available < 1) && { opacity: 0.4 }]} onPress={() => add(false)}><Text style={styles.secondaryText}>ADICIONAR AO CARRINHO</Text></Pressable>
   </View>
   <Footer showCopyright={false} />
  </ScrollView>
 </Screen>;
}
const styles = StyleSheet.create({
 image: { margin: 16, borderRadius: 14, overflow: 'hidden' }, badge: { position: 'absolute', left: 12, top: 12, backgroundColor: '#111', color: '#fff', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 5, fontSize: 11, fontWeight: '800' }, info: { padding: 20 }, collection: { fontSize: 10, letterSpacing: 1.2, color: '#777', fontWeight: '700', marginBottom: 10 }, title: { fontSize: 27, lineHeight: 33, fontWeight: '900', marginBottom: 14 }, oldPrice: { fontSize: 13, textDecorationLine: 'line-through', color: '#888', marginBottom: 3 }, price: { fontSize: 25, fontWeight: '900', marginBottom: 18 }, description: { fontSize: 13, lineHeight: 21, color: '#777', marginBottom: 12 }, stock: { fontSize: 12, fontWeight: '800', color: '#557044', marginBottom: 22 }, outOfStock: { color: '#b42318' }, sizesTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12 }, sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }, size: { minWidth: 44, height: 44, paddingHorizontal: 12, borderRadius: 22, borderWidth: 1, borderColor: '#111', alignItems: 'center', justifyContent: 'center' }, sizeActive: { backgroundColor: '#111' }, sizeText: { fontSize: 13, fontWeight: '800' }, primary: { minHeight: 50, backgroundColor: '#111', borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, primaryText: { fontSize: 12, fontWeight: '800', color: '#fff' }, secondary: { minHeight: 50, borderRadius: 25, borderWidth: 1, borderColor: '#111', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, secondaryText: { fontSize: 12, fontWeight: '800' }, feedback: { padding: 14, backgroundColor: '#ecf2e7', borderRadius: 8, marginBottom: 18 }, feedbackText: { color: '#38552e', fontSize: 12, lineHeight: 18 }, cartLink: { minHeight: 36, justifyContent: 'center' }, cartLinkText: { color: '#38552e', fontWeight: '800', fontSize: 10 },
});

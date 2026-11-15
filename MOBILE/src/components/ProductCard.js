import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ProductArtwork from './ProductArtwork';
import { getDiscount, getPrice, hasPromotion, money } from '../utils/catalog';
export default function ProductCard({ product, navigation }) {
 return <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${product.name}`} testID={`product-${product.id}`} style={styles.card} onPress={() => navigation.navigate('Product', { productId: product.id })}>
  <View><ProductArtwork product={product} />{hasPromotion(product) && <View style={styles.badge}><Text style={styles.badgeText}>−{getDiscount(product)}%</Text></View>}</View>
  <View style={styles.info}>
   <Text style={styles.category}>{product.modality} · {product.team === 'Sem time' ? 'BLACKWEAR' : product.team}</Text>
   <Text style={styles.name}>{product.name}</Text>
   <Text style={[styles.stock, product.stock <= 0 && styles.outOfStock]}>{product.stock <= 0 ? 'INDISPONÍVEL' : `${product.stock} em estoque`}</Text>
   <View style={styles.prices}>
    {hasPromotion(product) && <Text style={styles.oldPrice}>{money(product.price)}</Text>}
    <Text style={styles.price}>{money(getPrice(product))}</Text>
   </View>
  </View>
 </Pressable>;
}
export function ProductGrid({ products, navigation }) {
 return <View style={styles.grid}>{products.map(product => <ProductCard key={product.id} product={product} navigation={navigation} />)}</View>;
}
const styles = StyleSheet.create({
 grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }, card: { width: '48%', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e5e5', backgroundColor: '#fff' },
 badge: { position: 'absolute', top: 9, left: 9, backgroundColor: '#111', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5 }, badgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },
 info: { padding: 11, flex: 1 }, stock: { fontSize: 10, color: '#557044', fontWeight: '700', marginBottom: 8 }, outOfStock: { color: '#b42318' }, category: { color: '#777', fontSize: 9, lineHeight: 13, marginBottom: 5 }, name: { fontSize: 13, lineHeight: 18, fontWeight: '700', marginBottom: 10 }, prices: { marginTop: 'auto' }, oldPrice: { fontSize: 10, color: '#888', textDecorationLine: 'line-through', marginBottom: 3 }, price: { fontSize: 15, fontWeight: '900' },
});

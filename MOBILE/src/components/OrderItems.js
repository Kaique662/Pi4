import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { money } from '../utils/catalog';
export default function OrderItems({ items = [] }) {
  return <View style={styles.list}>
    <Text style={styles.title}>Itens do pedido</Text>
    {!items.length ? <Text style={styles.meta}>Nenhum item retornado pelo servidor.</Text> : items.map((item, index) => <View key={item._id || `${item.productId}-${item.size}-${index}`} style={styles.item}>
      <Text style={styles.name}>{item.name || 'Produto'}</Text>
      <Text style={styles.meta}>Tamanho: {item.size || 'Único'} · Quantidade: {item.quantity}</Text>
      <Text style={styles.meta}>{money(Number(item.price))} cada · Subtotal: {money(Math.round(Number(item.price) * 100) * Number(item.quantity) / 100)}</Text>
    </View>)}
  </View>;
}
const styles = StyleSheet.create({ list: { width: '100%', marginVertical: 16 }, title: { fontSize: 16, fontWeight: '800', marginBottom: 8 }, item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }, name: { fontSize: 14, fontWeight: '700', marginBottom: 5 }, meta: { fontSize: 12, color: '#666', lineHeight: 20 } });

import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { emptyFilters, filterProducts } from '../utils/catalog';
export default function FilterSheet({ visible, onClose, draft, setDraft, onApply, products, query, promotionsOnly }) {
 const groups = [
  ['modality', 'Modalidade', ['Todas', ...new Set(products.map(p => p.modality))]],
  ['team', 'Time', ['Todos', ...new Set(products.map(p => p.team))]],
  ['category', 'Categoria', ['Todas', ...new Set(products.map(p => p.category))]],
  ['maxPrice', 'Preço máximo', ['Qualquer', '100', '150', '200', '250']],
  ['sort', 'Ordenar por', ['Destaques', 'Menor preço', 'Maior preço', 'Maior desconto']],
 ];
 const count = filterProducts(products, draft, query, promotionsOnly).length;
 return <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="fullScreen">
  <SafeAreaView style={styles.safe}>
   <View style={styles.sheet}>
    <View style={styles.header}><Text style={styles.title}>Filtrar produtos</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar filtros" style={styles.close} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
     {!products.length && <Text style={{ color: '#777', lineHeight: 20, marginBottom: 20 }}>Os filtros serão preenchidos automaticamente quando houver produtos cadastrados e a API estiver conectada.</Text>}
     {groups.map(([key, label, options]) => <View key={key} style={styles.group}><Text style={styles.label}>{label}</Text><View style={styles.options}>{options.map(option => <Pressable key={option} accessibilityRole="radio" accessibilityLabel={`${label}: ${option === 'Qualquer' ? 'Qualquer preço' : key === 'maxPrice' ? `Até R$ ${option}` : option}`} accessibilityState={{ checked: draft[key] === option }} style={[styles.chip, draft[key] === option && styles.active]} onPress={() => setDraft(current => ({ ...current, [key]: option }))}><Text style={[styles.chipText, draft[key] === option && styles.activeText]}>{key === 'maxPrice' && option !== 'Qualquer' ? `Até R$ ${option}` : option}</Text></Pressable>)}</View></View>)}
    </ScrollView>
    <View style={styles.actions}><Pressable accessibilityRole="button" style={styles.clear} onPress={() => setDraft({ ...emptyFilters })}><Text style={styles.clearText}>Limpar</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Aplicar filtros" style={styles.apply} onPress={onApply}><Text style={styles.applyText}>VER {count} PRODUTOS</Text></Pressable></View>
   </View>
  </SafeAreaView>
 </Modal>;
}
const styles = StyleSheet.create({
 safe: { flex: 1, backgroundColor: '#fff' }, sheet: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' }, header: { paddingHorizontal: 20, minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#eee' }, title: { fontSize: 21, fontWeight: '800' }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, closeText: { fontSize: 30 }, content: { padding: 20 }, group: { marginBottom: 26 }, label: { fontSize: 14, fontWeight: '800', marginBottom: 12 }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 42, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: '#ddd' }, active: { backgroundColor: '#111', borderColor: '#111' }, chipText: { fontSize: 12, color: '#444' }, activeText: { color: '#fff', fontWeight: '700' },
 actions: { flexDirection: 'row', gap: 16, padding: 20, borderTopWidth: 1, borderColor: '#eee' }, clear: { minHeight: 48, width: 64, justifyContent: 'center', alignItems: 'center' }, clearText: { textDecorationLine: 'underline', fontWeight: '700', fontSize: 13 }, apply: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }, applyText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});

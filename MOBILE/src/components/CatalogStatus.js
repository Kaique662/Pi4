import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
export default function CatalogStatus({ loading, error, onRetry }) {
 if (loading) return <View style={styles.box}><ActivityIndicator color="#111" /><Text style={styles.text}>Carregando catálogo...</Text></View>;
 if (!error) return null;
 return <View style={styles.box}><Text accessibilityRole="alert" style={styles.text}>{error}</Text><Pressable accessibilityRole="button" style={styles.retry} onPress={onRetry}><Text style={styles.text}>Tentar novamente</Text></Pressable></View>;
}
const styles = StyleSheet.create({ box: { paddingVertical: 24, alignItems: 'center', gap: 12 }, text: { fontSize: 12, color: '#666', textAlign: 'center' }, retry: { minHeight: 44, paddingHorizontal: 18, borderWidth: 1, borderColor: '#ccc', borderRadius: 22, justifyContent: 'center' } });

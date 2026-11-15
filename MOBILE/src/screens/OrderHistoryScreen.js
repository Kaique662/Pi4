import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import BackLink from '../components/BackLink';
import Footer from '../components/Footer';
import OrderItems from '../components/OrderItems';
import { orderId, orderService } from '../services/orderService';
import { money } from '../utils/catalog';
function OrderCard({ order }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const id = orderId(order);
  useEffect(() => {
    let active = true;
    if (!open || details) return;
    setLoading(true); setError('');
    orderService.get(id).then(data => { if (active) setDetails(data); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, details, id, attempt]);
  return <View style={styles.card}>
    <Text selectable style={styles.order}>Pedido #{id}</Text>
    <Text style={styles.meta}>Data: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : '—'}</Text>
    <Text style={styles.meta}>Status: {({ paid: 'Pago', pending: 'Pendente', shipped: 'Enviado', delivered: 'Entregue', canceled: 'Cancelado' })[order.status] || order.status}</Text>
    <Text style={styles.price}>{money(Number(order.totalPrice || 0))}</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.details} onPress={() => setOpen(value => !value)}><Text>{open ? 'Ocultar produtos' : 'Ver produtos comprados'}</Text></Pressable>
    {open && <>
      {loading && <ActivityIndicator accessibilityLabel="Carregando produtos do pedido" />}
      {!!error && <View><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setAttempt(n => n + 1)}><Text>TENTAR NOVAMENTE</Text></Pressable></View>}
      {!!details && <OrderItems items={details.items} />}
    </>}
  </View>;
}
export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError('');
    orderService.list().then(data => { if (active) setOrders(data); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]));
  return <Screen navigation={navigation} active="Account"><ScrollView contentContainerStyle={styles.content}>
    <BackLink navigation={navigation} fallback="Account" label="← MINHA CONTA" />
    <Text style={styles.title}>Histórico de compras</Text><Text style={styles.subtitle}>Consulte os pedidos feitos na sua conta.</Text>
    {loading ? <ActivityIndicator color="#111" /> : error ? <View><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" style={styles.button} onPress={() => setAttempt(n => n + 1)}><Text style={styles.buttonText}>TENTAR NOVAMENTE</Text></Pressable></View> : !orders.length ? <Text style={styles.empty}>Você ainda não fez nenhuma compra.</Text> : orders.map(order => <OrderCard key={orderId(order)} order={order} />)}
    <Footer />
  </ScrollView></Screen>;
}
const styles = StyleSheet.create({ content: { padding: 20, flexGrow: 1 }, title: { fontSize: 27, fontWeight: '900', marginTop: 16, marginBottom: 8 }, subtitle: { color: '#777', fontSize: 13, lineHeight: 20, marginBottom: 22 }, card: { padding: 16, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 10, marginBottom: 12 }, order: { fontSize: 13, fontWeight: '900', marginBottom: 8 }, meta: { fontSize: 12, color: '#777', marginBottom: 5 }, price: { fontSize: 17, fontWeight: '900', marginTop: 8 }, details: { minHeight: 44, justifyContent: 'center' }, empty: { padding: 24, textAlign: 'center', color: '#777' }, error: { color: '#b42318', marginBottom: 12 }, button: { padding: 14, backgroundColor: '#111', borderRadius: 24, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '800', fontSize: 11 } });

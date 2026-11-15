import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Footer from '../components/Footer';
import Header from '../components/Header';
import OrderItems from '../components/OrderItems';
import { orderId, orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { money } from '../utils/catalog';


export default function SuccessScreen({ navigation, route }) {
  const order = route.params?.order;
  const id = orderId(order);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (!id) return;
    setLoading(true); setError('');
    orderService.get(id).then(data => { if (active) setDetails(data); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, attempt]);

  // Pagamento pelo Mercado Pago: o pedido nasce 'pending' e só vira 'paid' após confirmação.
  const [orderStatus, setOrderStatus] = useState(order?.requiresPayment ? 'pending' : order?.status);
  const [checkoutUrl, setCheckoutUrl] = useState(route.params?.checkoutUrl || null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const awaitingPayment = !!id && orderStatus === 'pending';
  const checkPayment = useCallback(async () => {
    if (!id) return;
    try {
      const data = await paymentService.status(id);
      setOrderStatus(data.orderStatus);
      setPaymentError(data.paymentStatus === 'failed' && data.orderStatus === 'pending' ? 'O pagamento foi recusado. Tente novamente.' : '');
    } catch (e) { setPaymentError(e.message); }
  }, [id]);
  useEffect(() => {
    if (!awaitingPayment) return;
    const timer = setInterval(checkPayment, 5000);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') checkPayment(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [awaitingPayment, checkPayment]);
  async function payNow() {
    setPaymentBusy(true); setPaymentError('');
    try {
      let url = checkoutUrl;
      if (!url) { url = (await paymentService.createCheckout(id)).checkoutUrl; setCheckoutUrl(url); }
      await paymentService.open(url);
    } catch (e) { setPaymentError(e.message || 'Não foi possível abrir o pagamento.'); }
    finally { setPaymentBusy(false); }
  }

  const canceled = orderStatus === 'canceled';
  const title = !order ? 'Nenhum pedido realizado' : awaitingPayment ? 'Aguardando pagamento' : canceled ? 'Pagamento cancelado' : 'Pedido realizado com sucesso!';
  const message = !order ? 'Adicione produtos ao carrinho para realizar uma compra.'
    : awaitingPayment ? 'Conclua o pagamento no Mercado Pago. Esta tela atualiza sozinha quando o pagamento for confirmado.'
    : canceled ? 'O pagamento foi cancelado e o pedido não será enviado.'
    : 'Seu pedido foi registrado. Confira abaixo os produtos comprados.';
  const orderNumber = id ? `#${id}` : '—';

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Header navigation={navigation} />

      <Pressable
        style={styles.backArea}
        onPress={() => {
          navigation.navigate('Home');
        }}
      >
        <Text style={styles.backText}>← VOLTAR</Text>
      </Pressable>

      <View style={styles.successContent}>
        <View style={styles.successBox}>
          <View style={styles.successIcon}>
            <Text style={styles.check}>{awaitingPayment ? '…' : canceled ? '✕' : '✓'}</Text>
          </View>

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.message}>{message}</Text>

          {awaitingPayment && <View style={[styles.actions, { marginBottom: 25 }]}>
            {!!paymentError && <Text accessibilityRole="alert" style={{ color: '#b42318', textAlign: 'center' }}>{paymentError}</Text>}
            <Pressable disabled={paymentBusy} style={[styles.trackButton, paymentBusy && { opacity: 0.5 }]} onPress={payNow}>
              <Text style={styles.trackText}>{paymentBusy ? 'ABRINDO...' : 'PAGAR COM MERCADO PAGO'}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={checkPayment}>
              <Text style={styles.secondaryText}>JÁ PAGUEI, VERIFICAR</Text>
            </Pressable>
          </View>}

          <View style={styles.orderNumber}>
            <Text style={styles.orderText}>
              Pedido <Text style={[styles.orderStrong, { fontSize: 14 }]} selectable>{orderNumber}</Text>
            </Text>
          </View>

          {!!id && <>
            <Text style={styles.orderText}>Total: {money(Number((details || order).totalPrice || 0))}</Text>
            {loading && <Text style={styles.message}>Carregando itens do pedido...</Text>}
            {!!error && <View><Text accessibilityRole="alert" style={{ color: '#b42318' }}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setAttempt(n => n + 1)}><Text style={styles.secondaryText}>TENTAR CARREGAR ITENS NOVAMENTE</Text></Pressable></View>}
            {!!details && <OrderItems items={details.items} />}
          </>}
          <View style={styles.actions}>
            <Pressable
              style={styles.trackButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.trackText}>CONTINUAR COMPRANDO</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Text style={styles.secondaryText}>VER CARRINHO</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
  },
  backArea: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
  },
  backText: {
    fontSize: 15,
    fontWeight: '800',
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 50,
  },
  successBox: {
    width: '100%',
    alignItems: 'center',
  },
  successIcon: {
    width: 65,
    height: 65,
    marginBottom: 25,
    borderRadius: 33,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 36,
  },
  title: {
    marginBottom: 15,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    maxWidth: 560,
    marginBottom: 25,
    color: '#666666',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  orderNumber: {
    marginBottom: 30,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    backgroundColor: '#f7f7f7',
  },
  orderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  orderStrong: {
    fontSize: 19,
    fontWeight: '900',
  },
  actions: {
    width: '100%',
    maxWidth: 430,
    gap: 12,
  },
  trackButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
});

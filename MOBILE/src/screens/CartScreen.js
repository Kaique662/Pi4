import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';

import Footer from '../components/Footer';
import Screen from '../components/Screen';
import ProductArtwork from '../components/ProductArtwork';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { orderId, orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { remainingStock, quantityFor, stockOf } from '../utils/stock';

export default function CartScreen({ navigation }) {
 const { products, loading: productsLoading, refreshProducts } = useProducts();
 const checkoutPending = useRef(false);
 const { user } = useAuth();
 const [checkoutOpen, setCheckoutOpen] = useState(false);
 const [busy, setBusy] = useState(false);
 const [address, setAddress] = useState({ name: 'Casa', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
 const [addressId, setAddressId] = useState(null);
 const [paymentMethod, setPaymentMethod] = useState('pix');
 const [checkoutError, setCheckoutError] = useState('');
 function changeAddress(key, value) { setAddressId(null); setAddress(current => ({ ...current, [key]: value })); setCheckoutError(''); }
 useEffect(() => { if (!user) return; apiRequest('/api/addresses').then(data => { const list = Array.isArray(data) ? data : data.addresses || []; const saved = list.find(item => item.isDefault) || list[0]; if (saved) { setAddressId(saved._id || saved.id); setAddress({ name: saved.name || 'Casa', street: saved.street || '', number: saved.number || '', complement: saved.complement || '', neighborhood: saved.neighborhood || '', city: saved.city || '', state: saved.state || '', zipCode: saved.zipCode || '' }); } }).catch(() => {}); }, [user?.id]);
 async function lookupCep(value) { changeAddress('zipCode', value); const cep = value.replace(/\D/g, ''); if (cep.length !== 8) return; try { const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`); const data = await response.json(); if (!response.ok || data.erro) throw new Error('CEP não encontrado.'); setAddress(current => ({ ...current, zipCode: cep.replace(/^(\d{5})(\d{3})$/, '$1-$2'), street: data.logradouro || current.street, neighborhood: data.bairro || current.neighborhood, city: data.localidade || current.city, state: data.uf || current.state })); } catch (e) { setCheckoutError(e.message || 'Não foi possível consultar o CEP.'); } }
 async function checkout() {
  if (!user) { setCheckoutError('Entre na sua conta para finalizar a compra.'); return; }
  if (!address.street.trim() || !address.number.trim() || !address.city.trim() || !address.state.trim() || !address.zipCode.trim()) { setCheckoutError('Preencha rua, número, cidade, estado e CEP.'); return; }
  if (checkoutPending.current || cartBusy) return;
  if (productsLoading || cart.some(item => quantityFor(cart, item.id) > stockOf(products.find(p => p.id === item.id)))) { setCheckoutError('Revise o carrinho: há produtos indisponíveis ou quantidades acima do estoque.'); return; }
  checkoutPending.current = true; setBusy(true); setCheckoutError('');
  try {
    const order = await orderService.checkout({ address, paymentMethod, ...(addressId ? { addressId } : {}) });
    // O pedido já foi criado. Falhas ao atualizar o carrinho não devem incentivar novo envio.
    refreshCart().catch(() => {});
    refreshProducts();
    let checkoutUrl = null;
    if (order.requiresPayment) {
      // Se gerar/abrir o link falhar, a tela seguinte permite tentar de novo sem recriar o pedido.
      try {
        ({ checkoutUrl } = await paymentService.createCheckout(orderId(order)));
        await paymentService.open(checkoutUrl);
      } catch {}
    }
    navigation.replace('Success', { order, checkoutUrl });
  }
  catch (error) { setCheckoutError(error.message || 'Não foi possível finalizar o pedido.'); }
  finally { checkoutPending.current = false; setBusy(false); }
 }

  const {
    cart,
    totalQuantity,
    total,
    increase,
    decrease,
    remove,
    busy: cartBusy,
    error: cartError,
    refreshCart,
  } = useCart();

  const formatCurrency = (value) =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  return (
    <Screen navigation={navigation}>
      <ScrollView contentContainerStyle={styles.content}>


        <Pressable
          style={styles.backArea}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Home');
          }}
        >
          <Text style={styles.backText}>← VOLTAR</Text>
        </Pressable>

        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>SEU CARRINHO</Text>
          <Text style={styles.cartSubtitle}>
            Você tem <Text style={styles.bold}>{totalQuantity}</Text> itens no seu carrinho de compras.
          </Text>
        </View>

        {!!cartError && <Text accessibilityRole="alert" style={styles.checkoutError}>{cartError}</Text>}
        {cart.length > 0 ? (
          <>
            <View style={styles.products}>
              {cart.map((item, index) => (
                <View key={`${item.id}-${item.size}`} style={styles.cartItem}>
                  <View style={styles.itemMain}>
                    <View style={styles.productImage}>
                      <ProductArtwork compact product={products.find(p => p.id === item.id || p.name === item.name) || { name: item.name, modality: 'Casual' }} />
                    </View>

                    <View style={styles.productInfo}>
                      <Text style={styles.collection}>Coleção Essencial</Text>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.sizeText}>
                        Tamanho: <Text style={styles.bold}>{item.size}</Text>
                      </Text>

                      <Text style={styles.sizeText}>Estoque total: {stockOf(products.find(p => p.id === item.id))}</Text>
                      {quantityFor(cart, item.id) > stockOf(products.find(p => p.id === item.id)) && <Text style={styles.checkoutError}>Reduza a quantidade ou remova este produto.</Text>}
                      <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${item.name}`} disabled={cartBusy || busy} onPress={() => remove(index)}>
                        <Text style={styles.remove}>Remover</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.itemBottom}>
                    <View style={styles.quantityControl}>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Diminuir quantidade de ${item.name}`} disabled={cartBusy || busy} style={styles.quantityButton} onPress={() => decrease(index)}>
                        <Text style={styles.quantitySymbol}>−</Text>
                      </Pressable>

                      <Text style={styles.quantity}>{item.quantity}</Text>

                      <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar quantidade de ${item.name}`} disabled={cartBusy || busy || productsLoading || remainingStock(cart, products.find(p => p.id === item.id)) < 1} style={[styles.quantityButton, (cartBusy || busy || productsLoading || remainingStock(cart, products.find(p => p.id === item.id)) < 1) && { opacity: 0.3 }]} onPress={() => increase(index)}>
                        <Text style={styles.quantitySymbol}>+</Text>
                      </Pressable>
                    </View>

                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.total}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>

            {!checkoutOpen ? <Pressable disabled={cartBusy || busy} style={styles.checkoutButton} onPress={() => { if (!user) { navigation.navigate('Account'); return; } setCheckoutOpen(true); }}>
              <Text style={styles.checkoutText}>FINALIZAR COMPRA</Text>
            </Pressable> : <View style={styles.checkoutForm}>
              <Text style={styles.checkoutTitle}>Endereço de entrega</Text><Pressable onPress={() => navigation.navigate('Addresses')}><Text style={{ textDecorationLine: 'underline', marginBottom: 12, fontSize: 12 }}>Gerenciar endereços salvos</Text></Pressable>
              {[["street", "Rua / logradouro"], ["number", "Número"], ["complement", "Complemento (opcional)"], ["neighborhood", "Bairro (opcional)"], ["city", "Cidade"], ["state", "Estado / UF"], ["zipCode", "CEP"]].map(([key, label]) => <TextInput key={key} accessibilityLabel={label} placeholder={label} placeholderTextColor="#888" value={address[key]} onChangeText={value => key === 'zipCode' ? lookupCep(value) : changeAddress(key, value)} keyboardType={key === 'zipCode' ? 'numeric' : 'default'} style={styles.checkoutInput} />)}
              <Text style={styles.checkoutTitle}>Forma de pagamento</Text>
              <View style={styles.paymentOptions}>{[['pix','PIX'],['card','Cartão'],['boleto','Boleto']].map(([value,label]) => <Pressable key={value} onPress={() => setPaymentMethod(value)} style={[styles.paymentOption, paymentMethod === value && styles.paymentSelected]}><Text style={[styles.paymentText, paymentMethod === value && styles.paymentTextSelected]}>{label}</Text></Pressable>)}</View>
              {!!checkoutError && <Text accessibilityRole="alert" style={styles.checkoutError}>{checkoutError}</Text>}
              <Pressable disabled={busy || cartBusy} style={[styles.checkoutButton, busy && { opacity: 0.5 }]} onPress={checkout}><Text style={styles.checkoutText}>{busy ? 'PROCESSANDO...' : 'CONFIRMAR PEDIDO'}</Text></Pressable>
              <Pressable disabled={busy} style={styles.cancelCheckout} onPress={() => setCheckoutOpen(false)}><Text style={styles.cancelCheckoutText}>VOLTAR AO CARRINHO</Text></Pressable>
            </View>}
          </>
        ) : (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Seu carrinho está vazio</Text>
            <Text style={styles.emptyDescription}>
              Adicione um produto para continuar.
            </Text>

            <Pressable
              style={styles.continueButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.continueText}>CONTINUAR COMPRANDO</Text>
            </Pressable>
          </View>
        )}

        <Footer showCopyright={false} />
      </ScrollView>
    </Screen>
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  backArea: {
    marginTop: 20,
    marginBottom: 25,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cartHeader: {
    marginBottom: 28,
  },
  cartTitle: {
    marginBottom: 7,
    fontSize: 26,
    fontWeight: '900',
  },
  cartSubtitle: {
    color: '#777777',
    fontSize: 15,
    lineHeight: 21,
  },
  bold: {
    color: '#111111',
    fontWeight: '800',
  },
  products: {
    width: '100%',
  },
  cartItem: {
    paddingBottom: 18,
    marginBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  productImage: {
    width: 96,
    height: 96,
    flexShrink: 0,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#111111',
    borderRadius: 10,
    backgroundColor: '#eeeeee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    color: '#666666',
    fontFamily: 'serif',
    fontSize: 13,
    fontWeight: '900',
  },
  productInfo: {
    flex: 1,
  },
  collection: {
    marginBottom: 7,
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
  },
  productName: {
    marginBottom: 8,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  sizeText: {
    marginBottom: 10,
    fontSize: 14,
  },
  remove: {
    color: '#777777',
    textDecorationLine: 'underline',
    fontSize: 13,
  },
  itemBottom: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControl: {
    width: 105,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 999,
  },
  quantityButton: {
    width: 35,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantitySymbol: {
    fontSize: 20,
  },
  quantity: {
    minWidth: 25,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: '900',
  },
  emptyCart: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 15,
    fontSize: 45,
  },
  emptyTitle: {
    marginBottom: 8,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    marginBottom: 25,
    color: '#777777',
    fontSize: 15,
    textAlign: 'center',
  },
  continueButton: {
    minHeight: 50,
    paddingHorizontal: 25,
    borderRadius: 999,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  total: {
    marginTop: 25,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  checkoutButton: {
    width: '100%',
    minHeight: 58,
    marginTop: 20,
    borderRadius: 999,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutForm: { marginTop: 18, padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 12 },
  checkoutTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, marginTop: 8 },
  checkoutInput: { minHeight: 44, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, marginBottom: 10, color: '#111', backgroundColor: '#fafafa' },
  paymentOptions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  paymentOption: { flex: 1, minHeight: 40, borderWidth: 1, borderColor: '#bbb', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  paymentSelected: { backgroundColor: '#111', borderColor: '#111' },
  paymentText: { fontSize: 12, fontWeight: '700', color: '#111' },
  paymentTextSelected: { color: '#fff' },
  checkoutError: { color: '#a32020', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  cancelCheckout: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  cancelCheckoutText: { fontSize: 11, fontWeight: '800', textDecorationLine: 'underline' },
  checkoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});

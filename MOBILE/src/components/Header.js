import React from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from './Icon';
import { goToTab } from '../utils/navigation';
import { useCart } from '../context/CartContext';
export default function Header({ navigation, showSearch = false, searchValue = '', onSearchChange, onSearchSubmit }) {
  const { totalQuantity } = useCart();
  return <View style={styles.header}>
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Ir para a loja" onPress={() => goToTab(navigation, 'Home')} style={styles.brand}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.logo}>BLACKWEAR</Text>
      </Pressable>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Minha conta" style={styles.account} onPress={() => goToTab(navigation, 'Account')}>
          <Icon name="account" /><Text style={styles.accountText}>Conta</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Carrinho, ${totalQuantity} itens`} style={styles.cart} onPress={() => navigation.navigate('Cart')}>
          <Icon name="cart" /><Text style={styles.badge}>{totalQuantity}</Text>
        </Pressable>
      </View>
    </View>
    {showSearch && <View style={styles.search}>
      <TextInput accessibilityLabel="Pesquisar produtos" value={searchValue} onChangeText={onSearchChange} onSubmitEditing={onSearchSubmit} placeholder="Busque produtos, times e modalidades" placeholderTextColor="#bdbdbd" style={styles.input} returnKeyType="search" />
      <Pressable accessibilityRole="button" accessibilityLabel="Pesquisar" style={styles.searchButton} onPress={onSearchSubmit}><Icon name="search" /></Pressable>
    </View>}
  </View>;
}
const styles = StyleSheet.create({
 header: { backgroundColor: '#fff', paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
 row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
 brand: { flex: 1, minWidth: 0 }, logo: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 20, fontWeight: '900', color: '#111' },
 actions: { flexDirection: 'row', alignItems: 'center', gap: 10 }, account: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 }, person: { fontSize: 17 }, accountText: { fontSize: 12 },
 cart: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#aaa', backgroundColor: '#f1f1f1', alignItems: 'center', justifyContent: 'center' },
 badge: { position: 'absolute', top: -3, right: -3, minWidth: 17, paddingHorizontal: 3, height: 17, borderRadius: 9, backgroundColor: '#000', color: '#fff', textAlign: 'center', fontSize: 10, lineHeight: 17 },
 search: { position: 'relative', width: '100%' }, input: { height: 40, borderRadius: 24, backgroundColor: '#111', color: '#fff', paddingLeft: 14, paddingRight: 46, fontSize: 12 },
 searchButton: { position: 'absolute', right: 5, top: 4, width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }
});

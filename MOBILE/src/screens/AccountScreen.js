import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthForm from '../components/AuthForm';
import Screen from '../components/Screen';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
export default function AccountScreen({ navigation }) {
 const { user, logout, isAdmin } = useAuth();
 if (!user) return <AuthForm navigation={navigation} />;
 return <Screen navigation={navigation} active="Account">
  <ScrollView contentContainerStyle={styles.content}>
   <View style={styles.main}>
    <Text style={styles.eyebrow}>SUA BLACKWEAR</Text>
    <Text style={styles.title}>Minha conta</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`Ver dados de ${user.name}`} style={styles.identity} onPress={() => navigation.navigate('Profile')}>
     <View style={styles.avatar}><Text style={styles.initial}>{user.name.trim().slice(0, 1).toUpperCase() || 'B'}</Text></View>
     <View style={{ flex: 1 }}><Text style={styles.name}>{user.name}</Text><Text style={styles.subtitle}>Ver e editar meus dados</Text></View>
     <Text style={styles.arrow}>›</Text>
    </Pressable>
    <Pressable accessibilityRole="button" style={[styles.identity, { marginTop: 14 }]} onPress={() => navigation.navigate('Addresses')}><View style={{ flex: 1 }}><Text style={styles.name}>Meus endereços</Text><Text style={styles.subtitle}>Cadastrar e editar endereço de entrega</Text></View><Text style={styles.arrow}>›</Text></Pressable>
    <Pressable accessibilityRole="button" style={[styles.identity, { marginTop: 14 }]} onPress={() => navigation.navigate('OrderHistory')}><View style={{ flex: 1 }}><Text style={styles.name}>Histórico de compras</Text><Text style={styles.subtitle}>Acompanhar seus pedidos</Text></View><Text style={styles.arrow}>›</Text></Pressable>
    {isAdmin && <Pressable accessibilityRole="button" accessibilityLabel="Abrir administração" style={[styles.identity, { marginTop: 14 }]} onPress={() => navigation.navigate('Admin')}><View style={{ flex: 1 }}><Text style={styles.name}>Gerenciar produtos</Text><Text style={styles.subtitle}>Acessar painel de administração</Text></View><Text style={styles.arrow}>›</Text></Pressable>}
    {isAdmin && <Pressable accessibilityRole="button" accessibilityLabel="Gerenciar usuários" style={[styles.identity, { marginTop: 14 }]} onPress={() => navigation.navigate('Users')}><View style={{ flex: 1 }}><Text style={styles.name}>Gerenciar usuários</Text><Text style={styles.subtitle}>Tornar admin, desativar ou excluir contas</Text></View><Text style={styles.arrow}>›</Text></Pressable>}
    <View style={styles.separator} />
    <Pressable accessibilityRole="button" style={styles.logout} onPress={logout}><Text style={styles.logoutText}>SAIR DA CONTA</Text></Pressable>
   </View>
   <Footer />
  </ScrollView>
 </Screen>;
}
const styles = StyleSheet.create({
 content: { flexGrow: 1 }, main: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', padding: 24 }, eyebrow: { fontSize: 9, letterSpacing: 1.5, color: '#777', fontWeight: '800', marginBottom: 8 }, title: { fontSize: 28, fontWeight: '900', marginBottom: 24 },
 identity: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, minHeight: 88, borderRadius: 12, backgroundColor: '#f4f4f0' }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222d22', alignItems: 'center', justifyContent: 'center' }, initial: { fontSize: 20, fontWeight: '800', color: '#e3ecd9' }, name: { fontSize: 15, fontWeight: '800', marginBottom: 5 }, subtitle: { fontSize: 11, lineHeight: 16, color: '#777' }, arrow: { fontSize: 28, color: '#777' }, separator: { height: 1, backgroundColor: '#e5e5e5', marginTop: 24, marginBottom: 12 }, logout: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, logoutText: { fontSize: 11, fontWeight: '800', textDecorationLine: 'underline' },
});

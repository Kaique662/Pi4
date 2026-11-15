import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import BackLink from '../components/BackLink';
import Screen from '../components/Screen';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
export default function ProfileScreen({ navigation }) {
 const { user } = useAuth();
 if (!user) return <Screen navigation={navigation} active="Account"><BackLink navigation={navigation} fallback="Account" label="← MINHA CONTA" /><View style={styles.form}><Text style={styles.description}>Entre na sua conta para editar os dados.</Text></View></Screen>;
 return <ProfileForm key={user.id} navigation={navigation} />;
}
function ProfileForm({ navigation }) {
 const { user, updateProfile } = useAuth();
 const [name, setName] = useState(user.name);
 const [email, setEmail] = useState(user.email);
 const [phone, setPhone] = useState(user.phone || '');
 const [message, setMessage] = useState('');
 const [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 const changed = name !== user.name || email !== user.email || phone !== (user.phone || '');
 function reset() { setName(user.name); setEmail(user.email); setPhone(user.phone || ''); setMessage(''); setError(''); }
 async function save() {
  if (busy) return;
  setBusy(true); setMessage(''); setError('');
  const result = await updateProfile({ name, email, phone });
  setBusy(false);
  if (result) setError(result); else {
   setName(name.trim()); setEmail(email.trim().toLowerCase()); setPhone(phone.trim());
   setMessage('Dados atualizados com sucesso!');
  }
 }
 function update(setter, value) { setter(value); setMessage(''); setError(''); }
 return <Screen navigation={navigation} active="Account">
  <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
    <BackLink navigation={navigation} fallback="Account" label="← MINHA CONTA" />
    <View style={styles.form}>
     <Text style={styles.eyebrow}>SUA BLACKWEAR</Text><Text style={styles.title}>Dados pessoais</Text>
     <View style={styles.identity}><View style={styles.avatar}><Text style={styles.initial}>{user.name?.trim().slice(0, 1).toUpperCase() || 'B'}</Text></View><View style={{ flex: 1 }}><Text style={styles.userName}>{user.name}</Text><Text style={styles.userEmail}>{user.email}</Text></View></View>
     <Text style={styles.description}>Altere seu nome, e-mail e telefone abaixo.</Text>
     <Text style={styles.label}>NOME</Text><TextInput accessibilityLabel="Nome" style={styles.input} value={name} onChangeText={value => update(setName, value)} autoComplete="name" maxLength={80} />
     <Text style={styles.label}>E-MAIL</Text><TextInput accessibilityLabel="E-mail" style={styles.input} value={email} onChangeText={value => update(setEmail, value)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" maxLength={160} />
     <Text style={styles.label}>TELEFONE (OPCIONAL)</Text><TextInput accessibilityLabel="Telefone" style={styles.input} value={phone} onChangeText={value => update(setPhone, value)} placeholder="(11) 99999-9999" placeholderTextColor="#888" keyboardType="phone-pad" autoComplete="tel" maxLength={20} />
     {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
     {!!message && <Text accessibilityLiveRegion="polite" style={styles.success}>{message}</Text>}
     <Pressable accessibilityRole="button" accessibilityLabel="Salvar alterações" accessibilityState={{ disabled: !changed || busy }} disabled={!changed || busy} style={[styles.save, (!changed || busy) && styles.disabled]} onPress={save}><Text style={styles.saveText}>{busy ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}</Text></Pressable>
     {changed && <Pressable accessibilityRole="button" style={styles.link} onPress={reset}><Text style={styles.linkText}>CANCELAR ALTERAÇÕES</Text></Pressable>}
     <View style={styles.separator} />
     <Pressable accessibilityRole="button" style={styles.logout} onPress={() => navigation.goBack()}><Text style={styles.linkText}>VOLTAR PARA MINHA CONTA</Text></Pressable>
    </View>
    <Footer />
   </ScrollView>
  </KeyboardAvoidingView>
 </Screen>;
}
const styles = StyleSheet.create({
 form: { padding: 24, width: '100%', maxWidth: 440, alignSelf: 'center', flex: 1 }, eyebrow: { fontSize: 9, color: '#777', fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 }, title: { fontSize: 28, fontWeight: '900', marginBottom: 22 }, identity: { padding: 16, borderRadius: 12, backgroundColor: '#f4f4f0', flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 26 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222d22', alignItems: 'center', justifyContent: 'center' }, initial: { fontSize: 20, fontWeight: '800', color: '#e3ecd9' }, userName: { fontSize: 15, fontWeight: '800', marginBottom: 4 }, userEmail: { fontSize: 11, color: '#777' }, sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 }, description: { fontSize: 12, lineHeight: 19, color: '#777', marginBottom: 22 }, label: { fontSize: 11, fontWeight: '800', marginBottom: 8 }, input: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 9, borderWidth: 1, borderColor: '#ccc', fontSize: 14, color: '#111', marginBottom: 18, backgroundColor: '#fafafa' }, error: { color: '#a32020', fontSize: 12, lineHeight: 18, marginBottom: 14 }, success: { color: '#2c5d38', fontSize: 12, lineHeight: 18, marginBottom: 14 }, save: { minHeight: 48, borderRadius: 24, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }, saveText: { color: '#fff', fontSize: 12, fontWeight: '800' }, disabled: { opacity: 0.45 }, link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, linkText: { fontSize: 11, fontWeight: '800', textDecorationLine: 'underline' }, separator: { height: 1, backgroundColor: '#e5e5e5', marginTop: 24, marginBottom: 12 }, logout: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});

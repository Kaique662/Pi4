import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Screen from './Screen';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
export default function AuthForm({ navigation, mode = 'login' }) {
 const creating = mode === 'register';
 const { register, login } = useAuth();
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [confirmation, setConfirmation] = useState('');
 const [address, setAddress] = useState({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
 const [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 async function submit() {
  if (busy) return;
  setBusy(true); setError('');
  const message = await (creating ? register({ name, email, password, confirmation, address }) : login({ email, password }));
  setBusy(false);
  if (message) { setError(message); return; }
  setPassword(''); setConfirmation('');
  if (creating) navigation.replace('Account');
 }
 return <Screen navigation={navigation} active="Account">
  <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
   <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
    <View style={styles.form}>
     <Text style={styles.eyebrow}>BEM-VINDO À BLACKWEAR</Text>
     <Text style={styles.title}>{creating ? 'Criar conta' : 'Entrar'}</Text>
     <Text style={styles.description}>{creating ? 'Seus dados e seu estilo em um só lugar.' : 'Acesse sua conta para editar seus dados.'}</Text>
     {creating && <><Text style={styles.label}>NOME</Text><TextInput accessibilityLabel="Nome" style={styles.input} placeholder="Como podemos te chamar?" placeholderTextColor="#777" autoComplete="name" maxLength={80} value={name} onChangeText={setName} /></>}
     <Text style={styles.label}>E-MAIL</Text>
     <TextInput accessibilityLabel="E-mail" style={styles.input} placeholder="seuemail@email.com" placeholderTextColor="#777" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" maxLength={160} value={email} onChangeText={setEmail} />
     <Text style={styles.label}>SENHA</Text>
     <TextInput accessibilityLabel="Senha" style={styles.input} placeholder="Pelo menos 6 caracteres" placeholderTextColor="#777" secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={creating ? 'new-password' : 'current-password'} value={password} onChangeText={setPassword} onSubmitEditing={creating ? undefined : submit} returnKeyType={creating ? 'next' : 'done'} />
     {creating && <><Text style={styles.label}>ENDEREÇO DE ENTREGA</Text>{[['zipCode','CEP'],['street','Rua / logradouro'],['number','Número'],['complement','Complemento (opcional)'],['neighborhood','Bairro'],['city','Cidade'],['state','Estado / UF']].map(([key,label])=><View key={key}><Text style={styles.label}>{label.toUpperCase()}</Text><TextInput accessibilityLabel={label} style={styles.input} placeholder={label} placeholderTextColor="#777" value={address[key]} onChangeText={async value=>{setAddress(current=>({...current,[key]:value}));if(key==='zipCode'&&value.replace(/\D/g,'').length===8){try{const response=await fetch(`https://viacep.com.br/ws/${value.replace(/\D/g,'')}/json/`);const data=await response.json();if(!data.erro)setAddress(current=>({...current,zipCode:value,street:data.logradouro||current.street,neighborhood:data.bairro||current.neighborhood,city:data.localidade||current.city,state:data.uf||current.state}));}catch{}}}} keyboardType={key==='zipCode'?'numeric':'default'} maxLength={key==='zipCode'?9:100}/></View>)}<Text style={styles.label}>CONFIRMAR SENHA</Text><TextInput accessibilityLabel="Confirmar senha" style={styles.input} placeholder="Repita sua senha" placeholderTextColor="#777" secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" value={confirmation} onChangeText={setConfirmation} onSubmitEditing={submit} returnKeyType="done" /></>}
     {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
     <Pressable accessibilityRole="button" accessibilityLabel={creating ? 'Criar conta' : 'Entrar'} disabled={busy} style={[styles.button, busy && { opacity: 0.5 }]} onPress={submit}><Text style={styles.buttonText}>{busy ? 'AGUARDE...' : creating ? 'CRIAR CONTA' : 'ENTRAR'}</Text></Pressable>
     <Text style={styles.prompt}>{creating ? 'Já possui conta?' : 'Ainda não possui conta?'}</Text>
     <Pressable accessibilityRole="button" style={styles.link} onPress={() => navigation.replace(creating ? 'Account' : 'Register')}><Text style={styles.linkText}>{creating ? 'ENTRAR' : 'CRIAR CONTA'}</Text></Pressable>
     <Text style={styles.demo}>Versão de demonstração do PI. Os dados da conta e o endereço são salvos no servidor.</Text>
    </View>
    <Footer />
   </ScrollView>
  </KeyboardAvoidingView>
 </Screen>;
}
const styles = StyleSheet.create({
 scroll: { flexGrow: 1 }, form: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 30 }, eyebrow: { color: '#777', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 }, title: { fontSize: 29, fontWeight: '900', marginBottom: 12 }, description: { fontSize: 13, color: '#666', lineHeight: 21, marginBottom: 24 },
 label: { fontSize: 11, fontWeight: '800', marginBottom: 8 }, input: { minHeight: 48, borderWidth: 1, borderColor: '#ccc', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 18, color: '#111', backgroundColor: '#fafafa' }, button: { minHeight: 48, borderRadius: 24, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, marginTop: 8 }, buttonText: { color: '#fff', fontSize: 13, fontWeight: '800' }, prompt: { textAlign: 'center', fontSize: 12, color: '#666', marginTop: 24 }, link: { minHeight: 44, justifyContent: 'center', alignItems: 'center' }, linkText: { fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' }, error: { color: '#a32020', fontSize: 13, lineHeight: 19, marginBottom: 8 }, demo: { fontSize: 10, lineHeight: 16, textAlign: 'center', color: '#777', marginTop: 18 },
});

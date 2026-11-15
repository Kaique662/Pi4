import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Screen from '../components/Screen';
import BackLink from '../components/BackLink';
import { useDeleteConfirmation } from '../components/DeleteConfirmation';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';

const FILTERS = [['all', 'Todos'], ['admin', 'Admins'], ['user', 'Clientes'], ['inactive', 'Inativos']];

export default function UsersScreen({ navigation }) {
  const { user, isAdmin } = useAuth();
  const deletion = useDeleteConfirmation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setUsers(await userService.list()); }
    catch (e) { setError(e.message || 'Não foi possível carregar os usuários.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u =>
      (filter === 'all' || (filter === 'inactive' ? !u.isActive : u.role === filter)) &&
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
  }, [users, search, filter]);

  async function run(u, action, success) {
    setBusyId(u.id); setNotice(null);
    try {
      const updated = await action();
      setUsers(list => list.map(item => (item.id === u.id ? { ...item, ...updated } : item)));
      setNotice({ text: success });
    } catch (e) { setNotice({ error: true, text: e.message || 'Não foi possível concluir a ação.' }); }
    finally { setBusyId(null); }
  }

  function toggleRole(u) {
    const role = u.role === 'admin' ? 'user' : 'admin';
    run(u, () => userService.setRole(u.id, role), role === 'admin' ? `${u.name} agora é admin.` : `${u.name} voltou a ser cliente.`);
  }
  function toggleActive(u) {
    run(u, () => userService.setActive(u.id, !u.isActive), u.isActive ? `${u.name} foi desativado.` : `${u.name} foi reativado.`);
  }
  function confirmDelete(u) {
    deletion.open(
      `Excluir a conta de ${u.name} (${u.email})? Os pedidos dessa conta continuam no histórico de vendas.`,
      async () => {
        await userService.remove(u.id);
        setUsers(list => list.filter(item => item.id !== u.id));
        setNotice({ text: `Conta de ${u.name} excluída.` });
      });
  }

  if (!user || !isAdmin) {
    return (
      <Screen navigation={navigation} active="Account">
        <BackLink navigation={navigation} fallback="Account" />
        <View style={styles.main}>
          <Text style={styles.title}>Acesso restrito</Text>
          <Text style={styles.description}>Somente administradores podem gerenciar usuários.</Text>
        </View>
      </Screen>
    );
  }

  const admins = users.filter(u => u.role === 'admin').length;
  const inactive = users.filter(u => !u.isActive).length;

  return (
    <Screen navigation={navigation} active="Account">
      {deletion.dialog}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <BackLink navigation={navigation} fallback="Admin" label="← ADMINISTRAÇÃO" />
        <View style={styles.main}>
          <Text style={styles.eyebrow}>BLACKWEAR / ADMINISTRAÇÃO</Text>
          <Text style={styles.title}>Gerenciar usuários</Text>
          <Text style={styles.description}>Torne contas administradoras, desative ou exclua usuários. O admin principal é protegido.</Text>

          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.number}>{users.length}</Text><Text style={styles.statLabel}>Contas</Text></View>
            <View style={styles.stat}><Text style={styles.number}>{admins}</Text><Text style={styles.statLabel}>Admins</Text></View>
            <View style={styles.stat}><Text style={styles.number}>{inactive}</Text><Text style={styles.statLabel}>Inativas</Text></View>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nome ou e-mail"
            placeholderTextColor="#999"
            autoCapitalize="none"
            style={styles.search}
          />
          <View style={styles.filters}>
            {FILTERS.map(([value, label]) => (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }}
                onPress={() => setFilter(value)} style={[styles.chip, filter === value && styles.chipSelected]}>
                <Text style={[styles.chipText, filter === value && { color: '#fff' }]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {!!notice && (
            <Text accessibilityLiveRegion="polite" style={[styles.notice, notice.error && styles.noticeError]}>{notice.text}</Text>
          )}

          {loading && <ActivityIndicator style={{ marginVertical: 24 }} color="#111" />}
          {!!error && (
            <View style={{ gap: 10 }}>
              <Text accessibilityRole="alert" style={{ color: '#b42318' }}>{error}</Text>
              <Pressable accessibilityRole="button" style={styles.action} onPress={load}><Text style={styles.actionText}>TENTAR NOVAMENTE</Text></Pressable>
            </View>
          )}
          {!loading && !error && !visible.length && <Text style={styles.description}>Nenhum usuário encontrado.</Text>}

          {!loading && !error && visible.map(u => {
            const locked = u.isMainAdmin || u.isSelf;
            const busy = busyId === u.id;
            return (
              <View key={u.id} style={[styles.item, !u.isActive && { opacity: 0.6 }]}>
                <View style={styles.badges}>
                  {u.isMainAdmin && <Text style={[styles.badge, styles.badgeDark]}>ADMIN PRINCIPAL</Text>}
                  {!u.isMainAdmin && u.role === 'admin' && <Text style={[styles.badge, styles.badgeDark]}>ADMIN</Text>}
                  {u.isSelf && <Text style={styles.badge}>VOCÊ</Text>}
                  {!u.isActive && <Text style={[styles.badge, styles.badgeDanger]}>INATIVA</Text>}
                </View>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.meta} selectable>{u.email}</Text>
                <Text style={styles.meta}>
                  Desde {new Date(u.createdAt).toLocaleDateString('pt-BR')} · {u.orderCount} pedido(s)
                </Text>

                {locked ? (
                  <Text style={styles.lockedText}>
                    {u.isMainAdmin ? 'Conta protegida: não pode ser alterada nem excluída.' : 'Você não pode alterar a sua própria conta aqui.'}
                  </Text>
                ) : (
                  <View style={styles.actions}>
                    <Pressable accessibilityRole="button" disabled={busy} style={[styles.action, busy && { opacity: 0.5 }]} onPress={() => toggleRole(u)}>
                      <Text style={styles.actionText}>{u.role === 'admin' ? 'REMOVER ADMIN' : 'TORNAR ADMIN'}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" disabled={busy} style={[styles.action, busy && { opacity: 0.5 }]} onPress={() => toggleActive(u)}>
                      <Text style={styles.actionText}>{u.isActive ? 'DESATIVAR' : 'REATIVAR'}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Excluir conta de ${u.name}`} disabled={busy}
                      style={[styles.action, { borderColor: '#b42318' }, busy && { opacity: 0.5 }]} onPress={() => confirmDelete(u)}>
                      <Text style={[styles.actionText, { color: '#b42318' }]}>EXCLUIR</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  main: { padding: 20 },
  eyebrow: { fontSize: 9, letterSpacing: 1.5, fontWeight: '800', color: '#777', marginBottom: 8 },
  title: { fontSize: 27, fontWeight: '900', marginBottom: 10 },
  description: { fontSize: 13, lineHeight: 20, color: '#777', marginBottom: 20 },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  stat: { flex: 1, borderRadius: 12, backgroundColor: '#f1f2ec', padding: 16 },
  number: { fontSize: 26, fontWeight: '900', color: '#263322', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#66705d' },
  search: { minHeight: 44, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, color: '#111', backgroundColor: '#fafafa' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipSelected: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#111' },
  notice: { fontSize: 12, lineHeight: 19, color: '#2b6438', padding: 14, borderRadius: 8, backgroundColor: '#eaf2e5', marginBottom: 16 },
  noticeError: { color: '#b42318', backgroundColor: '#fdecea' },
  item: { paddingVertical: 16, borderBottomWidth: 1, borderColor: '#eee' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  badge: { fontSize: 9, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#ccc', color: '#333', overflow: 'hidden' },
  badgeDark: { backgroundColor: '#111', borderColor: '#111', color: '#fff' },
  badgeDanger: { borderColor: '#b42318', color: '#b42318' },
  name: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  meta: { fontSize: 12, color: '#777', lineHeight: 18 },
  lockedText: { fontSize: 11, color: '#777', marginTop: 8, fontStyle: 'italic' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  action: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  actionText: { fontSize: 10, fontWeight: '800', color: '#111' },
});

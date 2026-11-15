import React, { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

// Mesmo diálogo no navegador, Android e iOS; não depende de window.confirm.
export function useDeleteConfirmation() {
  const [request, setRequest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  function open(message, action) { if (pending.current) return; setError(''); setRequest({ message, action }); }
  function close() { if (!pending.current) setRequest(null); }
  async function confirm() {
    if (!request || pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try { await request.action(); setRequest(null); }
    catch (e) { setError(e.message || 'Não foi possível excluir. Tente novamente.'); }
    finally { pending.current = false; setBusy(false); }
  }
  const dialog = <Modal visible={!!request} transparent animationType="fade" onRequestClose={close}>
    <View style={styles.overlay}><View style={styles.box} accessibilityViewIsModal>
      <Text style={styles.title}>Confirmar exclusão</Text>
      <Text style={styles.message}>{request?.message}</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <View style={styles.row}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={close} style={styles.button}><Text>Cancelar</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={confirm} style={[styles.button, styles.danger, busy && { opacity: 0.5 }]}><Text style={styles.white}>{busy ? 'Excluindo...' : 'Confirmar exclusão'}</Text></Pressable>
      </View>
    </View></View>
  </Modal>;
  return { open, dialog, busy };
}
const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }, box: { width: '100%', maxWidth: 420, padding: 22, backgroundColor: '#fff', borderRadius: 14 }, title: { fontSize: 20, fontWeight: '900', marginBottom: 12 }, message: { fontSize: 14, lineHeight: 22, marginBottom: 18 }, error: { color: '#b42318', marginBottom: 14 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }, button: { padding: 13, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }, danger: { backgroundColor: '#b42318', borderColor: '#b42318' }, white: { color: '#fff', fontWeight: '800' } });

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { goToTab } from '../utils/navigation';
const tabs = [ ['Home', 'Início', 'home'], ['Products', 'Produtos', 'grid'], ['Promotions', 'Ofertas', 'tag'], ['Account', 'Minha conta', 'user'] ];
function TabIcon({ type, selected }) {
 const ink = selected ? '#111' : '#858585';
 return <View style={styles.icon}>
  {type === 'grid' ? [0,1,2,3].map(i => <View key={i} style={{ position: 'absolute', left: i % 2 * 11 + 2, top: Math.floor(i / 2) * 11 + 2, width: 8, height: 8, borderWidth: 1.5, borderColor: ink, borderRadius: 2 }} />)
   : type === 'user' ? <><View style={[styles.head, { borderColor: ink }]} /><View style={[styles.body, { borderColor: ink }]} /></>
   : type === 'home' ? <><View style={[styles.roof, { borderColor: ink }]} /><View style={[styles.house, { borderColor: ink }]} /></>
   : <><View style={[styles.tag, { borderColor: ink }]} /><Text style={[styles.percent, { color: ink }]}>%</Text></>}
 </View>;
}
export default function BottomNav({ navigation, active }) {
 return <View style={styles.nav} accessibilityRole="tablist">
  {tabs.map(([route, label, icon]) => <Pressable key={route} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: active === route }} style={styles.tab} onPress={() => goToTab(navigation, route)}>
    <TabIcon type={icon} selected={active === route} /><Text style={[styles.label, active === route && styles.selected]}>{label}</Text>
  </Pressable>)}
 </View>;
}
const styles = StyleSheet.create({
 nav: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#e6e6e6', backgroundColor: '#fff', paddingTop: 7, paddingBottom: 5 },
 tab: { flex: 1, minHeight: 53, alignItems: 'center', justifyContent: 'center', gap: 4 }, label: { fontSize: 10, color: '#777' }, selected: { color: '#111', fontWeight: '800' }, icon: { width: 24, height: 24 },
 head: { position: 'absolute', width: 8, height: 8, left: 8, top: 1, borderWidth: 1.5, borderRadius: 4 }, body: { position: 'absolute', width: 18, height: 10, left: 3, top: 12, borderWidth: 1.5, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
 roof: { position: 'absolute', width: 14, height: 14, left: 5, top: 2, borderLeftWidth: 1.5, borderTopWidth: 1.5, transform: [{ rotate: '45deg' }] }, house: { position: 'absolute', width: 16, height: 12, left: 4, top: 10, borderWidth: 1.5, borderTopWidth: 0, backgroundColor: '#fff' },
 tag: { width: 20, height: 20, top: 2, left: 2, borderWidth: 1.5, borderRadius: 5 }, percent: { position: 'absolute', top: 3, left: 7, fontSize: 13, fontWeight: '700' },
});

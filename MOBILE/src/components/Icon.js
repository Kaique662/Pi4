import React from 'react';
import { StyleSheet, View } from 'react-native';
// Ícones construídos com Views: não dependem dos emojis/fontes do aparelho.
export default function Icon({ name }) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.box}>
    {name === 'account' ? <><View style={styles.head} /><View style={styles.shoulders} /></> : name === 'search' ? <><View style={styles.lens} /><View style={styles.stem} /></> : <><View style={styles.handle} /><View style={styles.basket} /><View style={[styles.wheel, { left: 6 }]} /><View style={[styles.wheel, { left: 16 }]} /></>}
  </View>;
}
const styles = StyleSheet.create({
 box: { width: 24, height: 24 },
 head: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#513573', position: 'absolute', top: 3, left: 8 },
 shoulders: { width: 16, height: 9, borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: '#513573', position: 'absolute', top: 12, left: 4 },
 lens: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.5, borderColor: '#444', backgroundColor: '#e4f5fc', position: 'absolute', top: 3, left: 3 },
 stem: { width: 9, height: 2, backgroundColor: '#444', position: 'absolute', top: 17, left: 13, transform: [{ rotate: '45deg' }] },
 handle: { width: 5, height: 2, backgroundColor: '#888', position: 'absolute', top: 4, left: 1 },
 basket: { width: 15, height: 10, borderWidth: 1, borderColor: '#888', position: 'absolute', top: 6, left: 5, transform: [{ skewX: '-10deg' }] },
 wheel: { width: 4, height: 4, borderRadius: 2, borderWidth: 1, borderColor: '#888', position: 'absolute', top: 18 }
});

import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
// Ilustrações do catálogo demonstrativo, sem baixar fontes ou imagens externas.
export default function ProductArtwork({ product, large = false, compact = false }) {
 const [failed, setFailed] = useState(false);
 if (product.imageUrl && !failed) return <View style={[styles.background, large && styles.large]}><Image accessibilityLabel={product.name} source={{ uri: product.imageUrl }} resizeMode="contain" style={{ width: '100%', height: '100%' }} onError={() => setFailed(true)} /></View>;
 const color = product.color || '#333';
 const accent = product.accent || '#eee';
 const kind = product.kind || 'shirt';
 return <View style={[styles.background, large && styles.large]} accessible={false}>
  <View style={[styles.art, large ? { transform: [{ scale: 1.55 }] } : compact ? { transform: [{ scale: 0.55 }] } : null]}>
    {kind === 'cap' ? <><View style={[styles.cap, { backgroundColor: color }]} /><View style={[styles.brim, { backgroundColor: color }]} /><Text style={[styles.capLogo, { color: accent }]}>BW</Text></>
    : ['pants', 'shorts'].includes(kind) ? <><View style={[styles.waist, { backgroundColor: color }]} /><View style={[styles.leg, { backgroundColor: color, left: 23, height: kind === 'shorts' ? 43 : 90 }]} /><View style={[styles.leg, { backgroundColor: color, right: 23, height: kind === 'shorts' ? 43 : 90 }]} /><View style={[styles.seam, { backgroundColor: accent }]} /></>
    : <>
     {kind !== 'tank' && <><View style={[styles.sleeve, { backgroundColor: color, left: 6, transform: [{ rotate: '24deg' }] }]} /><View style={[styles.sleeve, { backgroundColor: color, right: 6, transform: [{ rotate: '-24deg' }] }]} /></>}
     {kind === 'hoodie' && <View style={[styles.hood, { backgroundColor: color, borderColor: accent }]} />}
     <View style={[styles.torso, { backgroundColor: color }, kind === 'tank' && { left: 30, width: 60 }]}>
       <View style={[styles.collar, { borderColor: accent }]} />
       {kind === 'jersey' && <View style={[styles.stripe, { backgroundColor: accent }]} />}
       <Text style={[styles.mark, { color: kind === 'jersey' ? color : accent }]}>{product.initials || 'BW'}</Text>
       {kind === 'hoodie' && <View style={[styles.pocket, { borderColor: accent }]} />}
     </View>
    </>}
  </View>
  <Text style={[styles.caption, compact && { fontSize: 5, bottom: 4 }]}>BLACKWEAR / {product.modality?.toUpperCase()}</Text>
 </View>;
}
const styles = StyleSheet.create({
 background: { width: '100%', aspectRatio: 1, backgroundColor: '#f0efeb', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, large: { aspectRatio: 1.35 },
 art: { width: 120, height: 128, marginTop: 8 }, caption: { position: 'absolute', bottom: 10, fontSize: 7, letterSpacing: 1.2, color: '#78766e' },
 torso: { position: 'absolute', left: 24, top: 24, width: 72, height: 88, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, borderTopLeftRadius: 14, borderTopRightRadius: 14, overflow: 'hidden' },
 sleeve: { position: 'absolute', top: 27, width: 36, height: 36, borderRadius: 4 }, collar: { width: 23, height: 11, borderWidth: 2, borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, alignSelf: 'center' },
 stripe: { position: 'absolute', left: 0, right: 0, height: 27, top: 29 }, mark: { position: 'absolute', top: 36, width: '100%', textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
 hood: { position: 'absolute', top: 12, left: 41, width: 38, height: 31, borderRadius: 19, borderWidth: 2 }, pocket: { position: 'absolute', left: 17, bottom: 12, width: 38, height: 15, borderWidth: 1, borderRadius: 4 },
 waist: { position: 'absolute', left: 23, top: 20, width: 74, height: 24, borderRadius: 4 }, leg: { position: 'absolute', top: 31, width: 32, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }, seam: { position: 'absolute', top: 24, left: 57, width: 6, height: 2 },
 cap: { position: 'absolute', top: 35, left: 20, width: 75, height: 51, borderTopLeftRadius: 40, borderTopRightRadius: 40 }, brim: { position: 'absolute', left: 42, top: 79, width: 64, height: 14, borderRadius: 8, transform: [{ rotate: '-7deg' }] }, capLogo: { position: 'absolute', top: 53, left: 46, fontWeight: '900', fontSize: 15 },
});

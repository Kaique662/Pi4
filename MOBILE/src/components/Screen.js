import React from 'react';
import { StyleSheet, View } from 'react-native';
import Header from './Header';
import BottomNav from './BottomNav';
export default function Screen({ navigation, active, children, searchValue, onSearchChange, onSearchSubmit, showSearch = false }) {
 return <View style={styles.page}>
  <Header navigation={navigation} showSearch={showSearch} searchValue={searchValue} onSearchChange={onSearchChange} onSearchSubmit={onSearchSubmit} />
  <View style={styles.content}>{children}</View>
  <BottomNav navigation={navigation} active={active} />
 </View>;
}
const styles = StyleSheet.create({ page: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: '#fff' }, content: { flex: 1 } });

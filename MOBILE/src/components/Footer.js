import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Footer({ showCopyright = true }) {
  return (
    <View style={styles.footer}>
      <Text style={styles.logo}>BLACKWEAR</Text>
      {showCopyright && (
        <Text style={styles.copy}>© 2026 BLACKWEAR. TODOS OS DIREITOS RESERVADOS.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'serif',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  copy: {
    color: '#777777',
    fontSize: 10,
    textAlign: 'center',
  },
});

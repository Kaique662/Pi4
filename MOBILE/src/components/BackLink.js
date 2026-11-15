import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function BackLink({ navigation, fallback = 'Home', label = '← VOLTAR' }) {
  return (
    <Pressable
      style={styles.container}
      onPress={() => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate(fallback);
      }}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
  },
});

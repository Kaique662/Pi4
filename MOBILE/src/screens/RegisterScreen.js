import React from 'react';
import AuthForm from '../components/AuthForm';
export default function RegisterScreen({ navigation }) {
  return <AuthForm navigation={navigation} mode="register" />;
}

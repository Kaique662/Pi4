import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Sem EXPO_PUBLIC_API_URL, usa o IP do computador que está rodando o Expo
// (o mesmo pelo qual o celular baixou o app), na porta 3000 do back-end.
function devMachineUrl() {
  const host = (Constants.expoConfig?.hostUri || '').split(':')[0];
  if (!host || host.includes('exp.direct') || host.includes('ngrok')) return null; // modo --tunnel
  return `http://${host}:3000`;
}

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || devMachineUrl() || 'http://localhost:3000'
).replace(/\/+$/, '');

if (__DEV__) console.log(`[BlackWear] API: ${API_URL}`);

// Dashboard de vendas (Streamlit, pasta DASHBOARD). Por padrão, mesmo IP da API na porta 8501.
export const DASHBOARD_URL = (
  process.env.EXPO_PUBLIC_DASHBOARD_URL || API_URL.replace(/:\d+$/, '') + ':8501'
).replace(/\/+$/, '');

const TOKEN_KEY = 'blackwearAuthTokenV1';

export const tokenStorage = {
  get: () => AsyncStorage.getItem(TOKEN_KEY),
  set: (token) => AsyncStorage.setItem(TOKEN_KEY, token),
  clear: () => AsyncStorage.removeItem(TOKEN_KEY),
};

export async function apiRequest(path, options = {}) {
  const { noAuth = false, headers: customHeaders = {}, body, ...requestOptions } = options;
  const token = noAuth ? null : await tokenStorage.get();

  const headers = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...customHeaders,
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Não foi possível conectar ao servidor (${API_URL}). ` +
      'Confira o IP, a porta 3000, o Wi-Fi e se o back-end está ligado.'
    );
  }

  const raw = await response.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Erro HTTP ${response.status}.`);
  }

  return data;
}

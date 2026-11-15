// Reutiliza a rota da aba em vez de empilhar cópias ao alternar de aba.
export function goToTab(navigation, name, params) {
  const exists = navigation.getState().routes.some(route => route.name === name);
  if (exists && navigation.popTo) navigation.popTo(name, params);
  else navigation.navigate(name, params);
}

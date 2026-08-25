const TOKEN_KEY = 'transporte_admin_token';
localStorage.removeItem(TOKEN_KEY);
export const authStorage = {
  getToken: () => sessionStorage.getItem(TOKEN_KEY),
  setToken: (token) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

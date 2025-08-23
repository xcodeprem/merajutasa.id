import { useEffect, useState } from 'react';
import { getAuthState, onAuthChange, logout as doLogout } from './authService';

export function useAuth() {
  const [auth, setAuth] = useState(getAuthState());
  useEffect(() => onAuthChange(setAuth), []);
  return auth;
}

export function logout() {
  doLogout();
}

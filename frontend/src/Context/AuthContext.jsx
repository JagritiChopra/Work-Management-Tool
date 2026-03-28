import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { getMe, login as loginApi, logout as logoutApi, register as registerApi } from '../Services/authService';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { data } = await getMe();
        if (isMounted) {
          setUser(data.data.user);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('accessToken');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await loginApi({ email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
  }, []);

  const register = useCallback(async (name, email, password, passwordConfirm) => {
    const { data } = await registerApi({ name, email, password, passwordConfirm });
    return data.message;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout failures and clear local state anyway.
    }

    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser }),
    [user, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


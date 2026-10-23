import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import * as authApi from "../api/auth";
import { AUTH_EXPIRED_EVENT } from "../api/http";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const expireSession = () => setUser(null);
    // A browser-restored page must verify its session again after logout.
    const verifyRestoredPage = (event) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    window.addEventListener("pageshow", verifyRestoredPage);
    authApi.getCurrentUser(controller.signal)
      .then((currentUser) => {
        if (!controller.signal.aborted) setUser(currentUser);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted && requestError.status !== 401) {
          setError("Não foi possível conectar ao servidor. Tente entrar novamente.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
      window.removeEventListener("pageshow", verifyRestoredPage);
    };
  }, []);

  const signIn = async (email, password) => {
    setError("");
    setUser(await authApi.login(email, password));
  };

  const signOut = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

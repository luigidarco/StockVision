import { useEffect } from "react";
import { Spinner } from "@heroui/react";
import { useAuth } from "./auth/useAuth";
import InventoryPage from "./pages/InventoryPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const { user, loading } = useAuth();
  const targetPath = user ? "/" : "/login";
  const needsRedirect = !loading && window.location.pathname !== targetPath;

  useEffect(() => {
    if (needsRedirect) window.location.replace(targetPath);
  }, [needsRedirect, targetPath]);

  if (loading || needsRedirect) {
    return <div className="auth-loading"><Spinner label="Verificando sessão..." /></div>;
  }
  return user ? <InventoryPage /> : <LoginPage />;
}
